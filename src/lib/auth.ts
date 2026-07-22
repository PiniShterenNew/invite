import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Provider } from "next-auth/providers";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { magicLinkEmail } from "@/lib/email/templates";

// Organizers only. Guests are identified by invitation tokens and never
// touch this flow (ADR-002).

const providers: Provider[] = [];
export const hasEmailAuth = Boolean(process.env.RESEND_API_KEY) || process.env.NODE_ENV !== "production";

if (hasEmailAuth) {
  // Magic link via Resend in production, .dev-mailbox locally.
  providers.push(Resend({
    from: process.env.EMAIL_FROM ?? "baim <onboarding@resend.dev>",
    maxAge: 24 * 60 * 60,
    async sendVerificationRequest({ identifier, url }) {
      const mail = magicLinkEmail(url);
      const res = await sendEmail({ to: identifier, ...mail });
      if (!res.ok) throw new Error(`magic link email failed: ${res.error}`);
    },
  }));
}

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google({ allowDangerousEmailAccountLinking: true }));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers,
  pages: {
    signIn: "/login",
    verifyRequest: "/login/sent",
  },
  callbacks: {
    async signIn({ user }) {
      // Blocked users cannot start a new session.
      if (!user.email) return false;
      const existing = await db.user.findUnique({ where: { email: user.email } });
      return !existing?.disabledAt;
    },
  },
});

export const hasGoogleAuth = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
