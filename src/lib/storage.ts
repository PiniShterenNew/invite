import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Local development uses .uploads/. Production uses a private Supabase
// Storage bucket and serves files through /api/uploads/[...key]. Images are
// always re-encoded with sharp, stripping EXIF/location metadata.

const UPLOAD_DIR = path.join(process.cwd(), ".uploads");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "event-images";

let cachedStorage: SupabaseClient | null | undefined;

function cloudStorage(): SupabaseClient | null {
  if (cachedStorage !== undefined) return cachedStorage;
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  cachedStorage =
    url && secretKey
      ? createClient(url, secretKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        })
      : null;
  return cachedStorage;
}

export class UploadError extends Error {}

export async function saveImage(file: File, kind: "cover" | "avatar"): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new UploadError("bad-type");
  if (file.size > MAX_BYTES) throw new UploadError("too-big");

  const buf = Buffer.from(await file.arrayBuffer());
  const sharp = (await import("sharp")).default;
  // Re-encode → strips all metadata (EXIF/GPS). Covers stay large, avatars small.
  const width = kind === "cover" ? 1600 : 400;
  const out = await sharp(buf).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();

  const key = `${kind}/${crypto.randomBytes(16).toString("hex")}.webp`;

  const storage = cloudStorage();
  if (storage) {
    const { error } = await storage.storage.from(BUCKET).upload(key, out, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new UploadError(`storage-upload-failed: ${error.message}`);
    return key;
  }

  if (process.env.NODE_ENV === "production") throw new UploadError("storage-not-configured");

  const target = path.join(UPLOAD_DIR, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, out);
  return key;
}

export async function readImage(key: string): Promise<Buffer | null> {
  // Defense against path traversal: keys are generated hex names only.
  if (!/^(cover|avatar)\/[a-f0-9]{32}\.webp$/.test(key)) return null;
  const storage = cloudStorage();
  if (storage) {
    const { data, error } = await storage.storage.from(BUCKET).download(key);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  }

  if (process.env.NODE_ENV === "production") return null;

  try {
    return await fs.readFile(path.join(UPLOAD_DIR, key));
  } catch {
    return null;
  }
}

export async function deleteImage(key: string): Promise<void> {
  if (!/^(cover|avatar)\/[a-f0-9]{32}\.webp$/.test(key)) return;
  const storage = cloudStorage();
  if (storage) {
    const { error } = await storage.storage.from(BUCKET).remove([key]);
    if (error) throw new UploadError(`storage-delete-failed: ${error.message}`);
    return;
  }

  if (process.env.NODE_ENV === "production") return;

  try {
    await fs.unlink(path.join(UPLOAD_DIR, key));
  } catch {
    // already gone
  }
}

export const imageUrl = (key: string | null | undefined) => (key ? `/api/uploads/${key}` : null);
