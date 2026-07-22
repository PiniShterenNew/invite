import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn/ui class-name merge helper: clsx for conditionals, tailwind-merge to
// resolve conflicting Tailwind utilities so caller overrides win.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
