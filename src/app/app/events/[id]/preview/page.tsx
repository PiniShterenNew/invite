import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n/he";
import { buildEventView, buildViewerContext } from "@/lib/services/event-view";
import { EventPage } from "@/components/event/event-page";

export const metadata = { title: t.wizard.previewTitle };

// Organizer preview: renders exactly what a personal-link guest with full
// access would see (address always shown), clearly separate from the
// public routes so it never gets indexed or mistaken for a live invite.

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const event = await db.event.findFirst({ where: { id, organizerId: user.id }, include: { questions: true } });
  if (!event) notFound();

  const view = buildEventView(event, { kind: "preview" });
  const viewer = buildViewerContext(null, "preview", event.capacity, event.generalLinkMaxParty);

  return (
    <div>
      <div className="bg-ink text-white text-center text-sm font-semibold py-2 sticky top-0 z-20">{t.wizard.previewTitle}</div>
      <EventPage event={view} viewer={viewer} />
    </div>
  );
}
