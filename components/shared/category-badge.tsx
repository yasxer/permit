import { cn } from "@/lib/utils";

/**
 * Le code de catégorie, en JetBrains Mono : c'est une référence, pas un mot —
 * le mono le dit sans avoir à l'écrire.
 *
 * « B » est plein bleu nuit, les autres sont posées en clair : dans une liste
 * algérienne, quatre dossiers sur cinq sont des B, et l'œil cherche justement
 * ceux qui ne le sont pas.
 */
export function CategoryBadge({
  code,
  size = "default",
  className,
}: {
  code: string;
  size?: "default" | "sm";
  className?: string;
}) {
  const filled = code === "B";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center font-mono font-medium leading-none",
        size === "sm"
          ? "rounded-[7px] px-[7px] py-[3px] text-[0.6875rem]"
          : "rounded-lg px-2 py-1 text-xs",
        filled
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-muted text-foreground",
        className,
      )}
    >
      {code}
    </span>
  );
}
