import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { EventNav } from "@/components/organizer/event-nav";

export default async function EventLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const event = await db.event.findFirst({
    where: { id, organizerId: user.id },
    select: { id: true, name: true, status: true },
  });
  if (!event) notFound();

  return (
    <div className="space-y-4">
      <EventNav eventId={event.id} eventName={event.name} status={event.status} />
      {children}
    </div>
  );
}
