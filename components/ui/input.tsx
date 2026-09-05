import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Le champ est un creux, pas un cadre : un fond légèrement plus sourd que la
 * carte qui le porte, et une bordure discrète. Au focus il remonte au blanc et
 * prend l'anneau ambre — l'état actif se voit alors sans avoir besoin d'une
 * bordure épaisse.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-input bg-muted/50 px-3 py-1 text-base transition-[color,background-color,border-color,box-shadow] outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-muted-foreground/70",
        "hover:border-foreground/20",
        "focus-visible:border-ring focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-ring/25",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/20",
        "md:text-sm dark:bg-input/25 dark:focus-visible:bg-input/40 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
