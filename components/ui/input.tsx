import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Le champ de la charte : fond de carte, bordure franche #D1D5DB, rayon 12.
 * Au focus, la bordure passe à l'ambre et l'anneau de 3 px l'accompagne —
 * l'état actif se voit sans épaissir le trait.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 py-1 text-base transition-[color,background-color,border-color,box-shadow] outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-muted-foreground/70",
        "hover:border-foreground/30",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/28",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
