import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * La marque telle que la charte la pose dans la barre : un carré ambre, un
 * « P » bleu nuit en Poppins 800, puis le mot « Permix ».
 *
 * Les deux couleurs du signe sont écrites en dur — un logo qui change de
 * couleur avec le thème n'est plus un logo. Seul le mot suit l'encre de la
 * surface où il est posé (blanc sur nuit, nuit sur blanc), ce que la charte
 * prévoit.
 */
export function Logo({
  className,
  showName = true,
  showTagline = false,
  size = "default",
}: {
  className?: string;
  showName?: boolean;
  /** Ajoute « AUTO ÉCOLE » sous le nom, en capitales espacées. */
  showTagline?: boolean;
  /** `md` : le carré de 30 px de l'en-tête mobile. */
  size?: "default" | "md" | "lg";
}) {
  const t = useTranslations("app");

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className={cn(
          "grid shrink-0 place-items-center rounded-lg bg-[#F5A623] font-heading font-extrabold leading-none text-[#1C2333]",
          size === "lg"
            ? "size-10 text-xl"
            : size === "md"
              ? "size-[1.875rem] rounded-[9px] text-[0.9375rem]"
              : "size-7 text-[0.9375rem]",
        )}
      >
        P
      </span>

      {showName ? (
        <span className="min-w-0">
          <span
            className={cn(
              "block font-heading font-bold leading-none tracking-[-0.01em]",
              size === "lg" ? "text-xl" : "text-[1.0625rem]",
            )}
          >
            {t("name")}
          </span>
          {showTagline && (
            <span className="tag-caps mt-1.5 block text-[0.6rem] font-semibold leading-none text-brand-ink">
              {t("tagline")}
            </span>
          )}
        </span>
      ) : (
        <span className="sr-only">{t("name")}</span>
      )}
    </span>
  );
}
