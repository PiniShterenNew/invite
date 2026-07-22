import fs from "node:fs/promises";
import path from "node:path";

// Email transport with an honest dev fallback: without RESEND_API_KEY every
// email is printed to the server log and written to .dev-mailbox/ as HTML,
// so magic-link login and notifications work end-to-end locally.

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const DEV_MAILBOX = path.join(process.cwd(), ".dev-mailbox");

export async function sendEmail(mail: Mail): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "email-not-configured" };
    }
    await fs.mkdir(DEV_MAILBOX, { recursive: true });
    const file = path.join(DEV_MAILBOX, `${Date.now()}-${mail.to.replace(/[^a-z0-9@.]/gi, "_")}.html`);
    await fs.writeFile(file, `<!-- to: ${mail.to} | subject: ${mail.subject} -->\n${mail.html}`, "utf8");
    console.log(`\n📬 [dev-mail] to=${mail.to} subject="${mail.subject}"\n${mail.text ?? ""}\n(saved: ${file})\n`);
    return { ok: true };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "baim <onboarding@resend.dev>",
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}
