// Progressive enhancement for the "share invite" buttons: on devices that
// support the Web Share API (most mobile browsers), let the user pick any
// app/contact via the native sheet. Everywhere else, the surrounding <a
// href="wa.me/...">  still works unmodified — this only intercepts the click
// when navigator.share is actually available.
export function tryWebShare(e: React.MouseEvent<HTMLAnchorElement>, text: string): void {
  if (typeof navigator === "undefined" || !navigator.share) return; // fall through to the wa.me link
  e.preventDefault();
  navigator.share({ text }).catch(() => {
    // User cancelled or the share sheet failed — fall back to WhatsApp directly.
    window.open(e.currentTarget.href, "_blank", "noopener,noreferrer");
  });
}
