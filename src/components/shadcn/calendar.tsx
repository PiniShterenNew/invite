"use client";

import { DayPicker } from "react-day-picker";
import { he } from "react-day-picker/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// shadcn-style Calendar on react-day-picker v10, Hebrew locale + RTL, skinned
// with the "באים?" tokens.
export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      dir="rtl"
      locale={he}
      showOutsideDays={showOutsideDays}
      className={cn("select-none", className)}
      classNames={{
        months: "relative",
        month: "space-y-3",
        month_caption: "flex h-9 items-center justify-center",
        caption_label: "text-base font-bold text-ink",
        nav: "absolute inset-x-0 top-0 z-10 flex items-center justify-between",
        button_previous: "grid size-9 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-cream",
        button_next: "grid size-9 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-cream",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-10 pb-1 text-xs font-bold text-ink-faint",
        week: "mt-1 flex w-full",
        day: "size-10 p-0 text-center",
        day_button:
          "grid size-10 place-items-center rounded-xl text-sm font-medium text-ink transition-colors hover:bg-cream aria-selected:bg-coral aria-selected:font-bold aria-selected:text-white",
        today: "font-bold text-coral",
        outside: "text-ink-faint/50",
        disabled: "pointer-events-none opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />,
      }}
      {...props}
    />
  );
}
