// Smooth scroll to the top of the document. The global reduced-motion rule in
// globals.css forces `scroll-behavior: auto`, so this stays instant for users
// who asked for less motion.
export function scrollToTop() {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
