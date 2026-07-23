// Serializable view models passed from server pages to client components.
// The server decides what the viewer may see (address reveal, guest list…)
// before anything reaches the client — never filter sensitive data client-side.

export interface QuestionView {
  id: string;
  type: string;
  label: string;
  options: string[];
}

export interface EventView {
  slug: string;
  name: string;
  type: string;
  hostName: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  locationName: string | null;
  /** Already filtered by the address-reveal policy for this viewer. */
  locationAddress: string | null;
  addressHint: "AFTER_RSVP" | "PERSONAL_ONLY" | null; // why the address is hidden, if it is
  template: string;
  accentColor: string;
  typography: string;
  coverUrl: string | null;
  description: string | null;
  dressCode: string | null;
  schedule: { time: string; label: string }[];
  bringList: string | null;
  playlistUrl: string | null;
  showCountdown: boolean;
  announcement: string | null;
  showGuestList: boolean;
  questions: QuestionView[];
  deadlinePassed: boolean;
  deadlinePolicy: string;
  ended: boolean;
}

export interface RsvpView {
  status: string;
  partySize: number;
  message: string | null;
  answers: Record<string, string>;
}

export interface ViewerContext {
  kind: "personal" | "general" | "preview";
  token: string | null; // personal invite token
  guestName: string | null;
  maxParty: number;
  rsvp: RsvpView | null;
  seatsLeft: number | null; // null = no capacity limit
  hasProfile: boolean;
}
