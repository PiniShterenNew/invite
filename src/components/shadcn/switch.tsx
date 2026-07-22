"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// shadcn/ui Switch on Radix, skinned with our coral accent. The thumb is
// absolutely positioned with logical insets so it travels correctly in the
// dir="rtl" document (off = inline-start, on = inline-end).
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 disabled:opacity-50",
        "data-[state=checked]:bg-coral data-[state=unchecked]:bg-sand",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="absolute top-1 size-5 rounded-full bg-white shadow transition-all data-[state=checked]:inset-s-6 data-[state=unchecked]:inset-s-1" />
    </SwitchPrimitive.Root>
  );
}
