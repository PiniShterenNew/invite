import { readImage } from "@/lib/storage";

// Serves local or private Supabase Storage uploads. Keys are constrained to
// generated hex names, and the bucket is never exposed directly to clients.

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const buf = await readImage(key.join("/"));
  if (!buf) return new Response("not found", { status: 404 });
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Robots-Tag": "noindex",
    },
  });
}
