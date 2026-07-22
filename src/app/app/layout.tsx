import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { signOut } from "@/lib/auth";
import { t } from "@/lib/i18n/he";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh bg-paper flex flex-col">
      <header className="border-b border-line bg-white shadow-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/app" className="text-xl font-extrabold text-ink">
            {t.common.appName}
          </Link>
          <nav className="flex items-center gap-3 text-sm font-semibold text-ink-soft">
            {user.role === "ADMIN" && (
              <Link href="/admin" className="hover:text-ink">
                {t.admin.title}
              </Link>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="hover:text-ink min-h-11 px-2">
                {t.nav.logout}
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
