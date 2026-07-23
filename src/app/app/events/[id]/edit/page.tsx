import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n/he";
import { EventWizard, type WizardInitial } from "@/components/organizer/event-wizard";

export const metadata = { title: t.wizard.title };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const event = await db.event.findFirst({
    where: { id, organizerId: user.id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!event) notFound();

  const initial: WizardInitial = {
    id: event.id,
    slug: event.slug,
    status: event.status,
    type: event.type,
    name: event.name,
    hostName: event.hostName,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    timezone: event.timezone,
    locationName: event.locationName ?? "",
    locationAddress: event.locationAddress ?? "",
    addressReveal: event.addressReveal,
    accessMode: event.accessMode,
    hasAccessCode: Boolean(event.accessCodeHash),
    template: event.template,
    accentColor: event.accentColor,
    typography: event.typography,
    backgroundPattern: event.backgroundPattern,
    fontSize: event.fontSize,
    coverUrl: event.coverImage ? `/api/uploads/${event.coverImage}` : null,
    description: event.description ?? "",
    dressCode: event.dressCode ?? "",
    schedule: event.scheduleJson ? JSON.parse(event.scheduleJson) : [],
    bringList: event.bringList ?? "",
    playlistUrl: event.playlistUrl ?? "",
    showCountdown: event.showCountdown,
    showGuestList: event.showGuestList,
    questions: event.questions.map((q) => ({
      id: q.id,
      type: q.type,
      label: q.label,
      options: q.optionsJson ? JSON.parse(q.optionsJson) : [],
    })),
    rsvpDeadline: event.rsvpDeadline?.toISOString() ?? null,
    deadlinePolicy: event.deadlinePolicy,
    capacity: event.capacity,
    notifyMode: event.notifyMode,
  };

  return <EventWizard initial={initial} />;
}
