import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Provider } from "next-auth/providers";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import { magicLinkEmail } from "@/lib/email/templates";
import { verifyPassword } from "@/lib/password";

const providers: Provider[] = [];
export const hasEmailAuth = Boolean(process.env.RESEND_API_KEY) || process.env.NODE_ENV !== "production";

if (hasEmailAuth) {
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

providers.push(Credentials({
  credentials: { email: { type: "email" }, password: { type: "password" } },
  async authorize(credentials) {
    try {
      const email = typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
      const password = typeof credentials.password === "string" ? credentials.password : "";
      if (!email || !password) return null;

      const user = await db.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;
      if (user.disabledAt) return null;

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, email: user.email, name: user.name, image: user.image };
    } catch {
      return null;
    }
  },
}));

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/login",
    verifyRequest: "/login/sent",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        const existing = await db.user.findUnique({ where: { email: user.email } });
        return !existing?.disabledAt;
      } catch {
        return true;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        try {
          const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
          token.role = dbUser?.role ?? "USER";
        } catch {
          token.role = "USER";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) (session.user as unknown as Record<string, unknown>).role = token.role;
      return session;
    },
  },
});

export const hasGoogleAuth = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
