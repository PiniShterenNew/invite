import { db } from "@/lib/db";
import { t } from "@/lib/i18n/he";
import { imageUrl } from "@/lib/storage";
import { NotFoundCard } from "@/components/event/not-found";
import { ProfileForm } from "@/components/event/profile-form";

export default async function ProfilePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const guest = await db.guest.findUnique({
    where: { inviteToken: token },
    include: { event: { select: { name: true, status: true, disabledAt: true, showGuestList: true } }, profile: true },
  });

  if (!guest || guest.event.status === "DRAFT" || guest.event.disabledAt) {
    return <NotFoundCard title={t.invite.notFound} text={t.invite.notFoundText} />;
  }

  return (
    <main className="min-h-dvh bg-paper px-4 py-8">
      <div className="max-w-md mx-auto space-y-4 animate-rise">
        <h1 className="text-2xl font-bold text-ink text-center">{t.profile.title}</h1>
        <p className="text-sm text-ink-faint text-center">{t.profile.subtitle}</p>
        <ProfileForm
          token={token}
          initial={
            guest.profile
              ? {
                  shareLevel: guest.profile.shareLevel,
                  bio: guest.profile.bio ?? "",
                  instagram: guest.profile.instagram ?? "",
                  photoUrl: imageUrl(guest.profile.photo),
                }
              : null
          }
        />
      </div>
    </main>
  );
}
