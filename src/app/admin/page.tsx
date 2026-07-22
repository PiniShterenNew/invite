import { requireAdmin } from "@/lib/authz";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n/he";
import { AdminSearch } from "@/components/admin/search";
import { ReportsList } from "@/components/admin/reports-list";

export const metadata = { title: t.admin.title };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;

  const events = q
    ? await db.event.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { slug: { contains: q } },
            { organizer: { email: { contains: q } } },
          ],
        },
        include: { organizer: { select: { email: true } } },
        take: 20,
      })
    : [];

  const reports = await db.report.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" }, take: 30 });

  const auditLog = await db.auditEvent.findMany({
    where: { actorType: "ADMIN" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="min-h-dvh bg-paper px-5 py-8">
      <div className="max-w-2xl mx-auto space-y-6 animate-rise">
        <h1 className="text-2xl font-extrabold text-ink">{t.admin.title}</h1>

        <AdminSearch query={q ?? ""} events={events} />

        <ReportsList reports={reports} />

        <section className="bg-white rounded-card border border-line/60 shadow-card p-5 space-y-2">
          <h2 className="font-bold text-ink">{t.admin.auditLog}</h2>
          <ul className="text-sm text-ink-soft space-y-1 max-h-64 overflow-y-auto">
            {auditLog.map((a) => (
              <li key={a.id}>
                {new Date(a.createdAt).toLocaleString("he-IL")} — {a.action}
              </li>
            ))}
            {auditLog.length === 0 && <li className="text-ink-faint">—</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
