import type { AccentColor, TemplateId } from "@/lib/constants";

// Four genuinely different templates — structure, typography and rhythm
// differ, not just the accent color (product decision #19).

export interface TemplateStyle {
  page: string; // page background + base text
  hero: string; // hero block
  heroTitle: string;
  heroMeta: string;
  card: string; // content cards
  sectionTitle: string;
  divider: string;
  chip: string;
}

export const TEMPLATE_STYLES: Record<TemplateId, TemplateStyle> = {
  classic: {
    page: "bg-paper text-ink",
    hero: "text-center pt-10 pb-8 px-6",
    heroTitle: "font-display text-4xl sm:text-5xl font-bold leading-tight",
    heroMeta: "text-ink-soft",
    card: "bg-white border border-line/70 shadow-card rounded-card",
    sectionTitle: "font-display text-xl font-bold",
    divider: "border-line",
    chip: "bg-cream text-ink-soft",
  },
  midnight: {
    page: "bg-night text-[#f2eefc]",
    hero: "text-center pt-12 pb-10 px-6",
    heroTitle: "text-4xl sm:text-5xl font-extrabold tracking-tight",
    heroMeta: "text-[#b5aecd]",
    card: "bg-night-soft border border-white/10 rounded-card",
    sectionTitle: "text-lg font-bold uppercase tracking-wide",
    divider: "border-white/10",
    chip: "bg-white/10 text-[#d9d3ea]",
  },
  sunset: {
    page: "bg-[#fff4ec] text-[#3a2318]",
    hero: "text-start pt-12 pb-8 px-6 bg-gradient-to-b from-[#ffddc2] to-[#fff4ec]",
    heroTitle: "text-5xl sm:text-6xl font-extrabold leading-[1.05]",
    heroMeta: "text-[#8a5c42]",
    card: "bg-white/80 border border-[#f3d8c3] shadow-card rounded-card",
    sectionTitle: "text-xl font-extrabold",
    divider: "border-[#f3d8c3]",
    chip: "bg-[#ffe8d6] text-[#8a5c42]",
  },
  garden: {
    page: "bg-[#f4f7ee] text-[#26301c]",
    hero: "text-center pt-10 pb-8 px-6",
    heroTitle: "font-display text-4xl sm:text-5xl font-medium italic",
    heroMeta: "text-[#5f6f4d]",
    card: "bg-white border-2 border-[#dde7cd] rounded-[2rem]",
    sectionTitle: "font-display text-xl italic",
    divider: "border-[#dde7cd]",
    chip: "bg-[#e7efd8] text-[#4a5c36]",
  },
};

export const ACCENT_STYLES: Record<AccentColor, { solid: string; soft: string; text: string }> = {
  coral: { solid: "bg-coral hover:bg-coral-deep text-white", soft: "bg-coral-soft", text: "text-coral-deep" },
  ocean: { solid: "bg-ocean hover:bg-[#255a75] text-white", soft: "bg-ocean-soft", text: "text-ocean" },
  lime: { solid: "bg-lime hover:bg-[#4a6822] text-white", soft: "bg-lime-soft", text: "text-lime" },
  violet: { solid: "bg-violet hover:bg-[#594a85] text-white", soft: "bg-violet-soft", text: "text-violet" },
  amber: { solid: "bg-amber hover:bg-[#8f5d0f] text-white", soft: "bg-amber-soft", text: "text-amber" },
  rose: { solid: "bg-rose hover:bg-[#9c3d5c] text-white", soft: "bg-rose-soft", text: "text-rose" },
};

export const templateStyle = (id: string): TemplateStyle => TEMPLATE_STYLES[(id as TemplateId) in TEMPLATE_STYLES ? (id as TemplateId) : "classic"];
export const accentStyle = (id: string) => ACCENT_STYLES[(id as AccentColor) in ACCENT_STYLES ? (id as AccentColor) : "coral"];
