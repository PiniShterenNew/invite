import "dotenv/config";
import { db } from "../src/lib/db";
import { newEventSlug, newInviteToken } from "../src/lib/tokens";
import { hashAccessCode } from "../src/lib/services/access";

// Realistic-but-fictional demo data covering every access mode, RSVP
// status and profile share level called for in the spec. Safe to re-run —
// clears prior demo data first (idempotent).

const DEMO_EMAIL = "demo@baim.app";
const DAY = 24 * 3600_000;
const in_ = (days: number, hour = 20) => {
  const d = new Date(Date.now() + days * DAY);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function main() {
  console.log("🌱 Seeding demo data…");

  const priorEventIds = (await db.event.findMany({ where: { organizer: { email: DEMO_EMAIL } }, select: { id: true } })).map((e) => e.id);
  await db.$transaction([
    db.auditEvent.deleteMany({ where: { eventId: { in: priorEventIds } } }),
    db.event.deleteMany({ where: { organizer: { email: DEMO_EMAIL } } }),
    db.user.deleteMany({ where: { email: DEMO_EMAIL } }),
  ]);

  const organizer = await db.user.create({
    data: { email: DEMO_EMAIL, name: "דנה כהן" },
  });

  // ---------- 1. Birthday — general link, published, mixed RSVPs ----------
  const birthday = await db.event.create({
    data: {
      organizerId: organizer.id,
      slug: newEventSlug(),
      type: "BIRTHDAY",
      name: "יום הולדת 30 לדנה",
      hostName: "דנה כהן",
      startsAt: in_(9),
      endsAt: in_(9, 23),
      locationName: "הבית של דנה",
      locationAddress: "רחוב דיזנגוף 99, תל אביב",
      addressReveal: "AFTER_RSVP",
      template: "sunset",
      accentColor: "coral",
      description: "בואו לחגוג איתי 🎂 יהיה אוכל, מוזיקה טובה וגג עם נוף.",
      dressCode: "קז'ואל צבעוני",
      bringList: "בקבוק, מצב רוח טוב",
      showCountdown: true,
      showGuestList: true,
      accessMode: "GENERAL",
      generalLinkMaxParty: 2,
      status: "PUBLISHED",
      notifyMode: "DAILY",
      questions: {
        create: [
          { order: 0, type: "TEXT", label: "יש רגישות למזון?" },
          { order: 1, type: "YESNO", label: "צריכים עזרה בהסעה?" },
        ],
      },
    },
  });

  const birthdayGuests: { name: string; phone?: string; maxParty: number; rsvp?: "YES" | "MAYBE" | "NO"; party?: number; profile?: "MINIMAL" | "SOCIAL" | "OPEN" }[] = [
    { name: "נועה לוי", maxParty: 1, rsvp: "YES", party: 1, profile: "SOCIAL" },
    { name: "איתי ושירה", maxParty: 2, rsvp: "YES", party: 2, profile: "OPEN" },
    { name: "מאיה ברק", maxParty: 2, rsvp: "MAYBE", party: 1, profile: "MINIMAL" },
    { name: "יובל שגיא", maxParty: 1, rsvp: "NO" },
    { name: "רועי אביטן", maxParty: 1 },
    { name: "טל גורן", maxParty: 2 },
  ];
  for (const g of birthdayGuests) {
    const guest = await db.guest.create({
      data: { eventId: birthday.id, name: g.name, phone: g.phone, maxParty: g.maxParty, inviteToken: newInviteToken(), linkOpenedAt: g.rsvp ? new Date() : null, shareOpenedAt: new Date() },
    });
    if (g.rsvp) {
      await db.rsvp.create({ data: { guestId: guest.id, status: g.rsvp, partySize: g.party ?? 1, message: g.rsvp === "YES" ? "מביאה עוגה!" : null } });
    }
    if (g.profile) {
      await db.attendeeProfile.create({
        data: {
          guestId: guest.id,
          shareLevel: g.profile,
          bio: g.profile !== "MINIMAL" ? "אוהבת מוזיקה טובה ואנשים טובים" : null,
          instagram: g.profile === "OPEN" ? "noa.levi" : null,
        },
      });
    }
  }

  // ---------- 2. Rooftop party — personal links only ----------
  const rooftop = await db.event.create({
    data: {
      organizerId: organizer.id,
      slug: newEventSlug(),
      type: "ROOFTOP",
      name: "רופטופ קיץ",
      hostName: "עידן ונוי",
      startsAt: in_(16, 21),
      locationName: "מגדל רוגובין",
      locationAddress: "אבן גבירול 76, תל אביב",
      addressReveal: "PERSONAL_ONLY",
      template: "midnight",
      accentColor: "violet",
      playlistUrl: "https://open.spotify.com/playlist/demo",
      showCountdown: true,
      accessMode: "PERSONAL_ONLY",
      status: "PUBLISHED",
      notifyMode: "IMMEDIATE",
      capacity: 40,
    },
  });
  for (const [name, rsvp, party] of [
    ["גיא נחום", "YES", 1],
    ["שירה אלמוג", "YES", 2],
    ["דניאל כהן", null, null],
  ] as const) {
    const guest = await db.guest.create({ data: { eventId: rooftop.id, name, maxParty: 2, inviteToken: newInviteToken() } });
    if (rsvp) await db.rsvp.create({ data: { guestId: guest.id, status: rsvp, partySize: party! } });
  }

  // ---------- 3. Bachelorette — code-protected ----------
  const bachelorette = await db.event.create({
    data: {
      organizerId: organizer.id,
      slug: newEventSlug(),
      type: "BACHELORETTE",
      name: "רווקות של מאיה",
      hostName: "החברות הכי טובות",
      startsAt: in_(23, 19),
      locationAddress: "וילה בבנימינה",
      addressReveal: "ALWAYS",
      template: "garden",
      accentColor: "rose",
      accessMode: "CODE",
      accessCodeHash: hashAccessCode("2412"),
      dressCode: "לבן",
      status: "PUBLISHED",
    },
  });
  await db.guest.create({ data: { eventId: bachelorette.id, name: "אורחת לדוגמה", maxParty: 1, inviteToken: newInviteToken() } });

  // ---------- 4. House party — draft ----------
  await db.event.create({
    data: {
      organizerId: organizer.id,
      slug: newEventSlug(),
      type: "HOUSE_PARTY",
      name: "מסיבת בית — טיוטה",
      hostName: "דנה כהן",
      startsAt: in_(30),
      template: "classic",
      status: "DRAFT",
    },
  });

  // ---------- 5. Full event (capacity reached) ----------
  const full = await db.event.create({
    data: {
      organizerId: organizer.id,
      slug: newEventSlug(),
      type: "HOUSE_PARTY",
      name: "מסיבת דירה חדשה",
      hostName: "עומר לביא",
      startsAt: in_(5, 21),
      locationAddress: "רוטשילד 12, תל אביב",
      addressReveal: "ALWAYS",
      template: "classic",
      accentColor: "lime",
      accessMode: "GENERAL",
      generalLinkMaxParty: 1,
      capacity: 20,
      status: "PUBLISHED",
    },
  });
  const fullGuest = await db.guest.create({ data: { eventId: full.id, name: "קבוצת מוזמנים", maxParty: 20, inviteToken: newInviteToken() } });
  await db.rsvp.create({ data: { guestId: fullGuest.id, status: "YES", partySize: 20 } });

  // ---------- 6. Ended event ----------
  const ended = await db.event.create({
    data: {
      organizerId: organizer.id,
      slug: newEventSlug(),
      type: "OTHER",
      name: "מפגש חברים — קיץ שעבר",
      hostName: "דנה כהן",
      startsAt: in_(-20, 20),
      endsAt: in_(-20, 23),
      template: "sunset",
      accessMode: "GENERAL",
      status: "ENDED",
      endedAt: in_(-20, 23),
    },
  });
  const endedGuest = await db.guest.create({ data: { eventId: ended.id, name: "אורח לשעבר", maxParty: 1, inviteToken: newInviteToken() } });
  await db.rsvp.create({ data: { guestId: endedGuest.id, status: "YES", partySize: 1 } });

  console.log("✅ Seed complete.");
  console.log(`   Organizer: ${DEMO_EMAIL} (open /login, use magic link — printed to console / .dev-mailbox)`);
  console.log(`   Events: ${[birthday, rooftop, bachelorette, full, ended].map((e) => e.slug).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
