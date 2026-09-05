import * as React from "react"

import { cn } from "@/lib/utils"

/** Même creux que `Input`, en plus haut. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-lg border border-input bg-muted/50 px-3 py-2.5 text-base transition-[color,background-color,border-color,box-shadow] outline-none",
        "placeholder:text-muted-foreground/70",
        "hover:border-foreground/20",
        "focus-visible:border-ring focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-ring/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20",
        "md:text-sm dark:bg-input/25 dark:focus-visible:bg-input/40 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
