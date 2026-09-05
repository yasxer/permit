import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * La marque, telle que la charte la définit : un carré arrondi bleu nuit, un
 * « P » blanc, et la route ambre en pointillé qui passe dessous.
 *
 * Les deux couleurs du signe sont écrites en dur plutôt que prises aux jetons
 * de thème : un logo qui change de couleur avec le thème n'est plus un logo.
 * Seul le mot « Permix » suit l'encre de la surface où il est posé, ce que la
 * charte prévoit — version claire sur fond blanc, version blanche sur nuit.
 */
export function Logo({
  className,
  showName = true,
  showTagline = false,
}: {
  className?: string;
  showName?: boolean;
  /** Ajoute « AUTO ÉCOLE » sous le nom, en capitales espacées. */
  showTagline?: boolean;
}) {
  const t = useTranslations("app");

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 32 32"
        className="size-8 shrink-0"
        role="img"
        aria-label={t("name")}
      >
        <rect width="32" height="32" rx="9" fill="#1C2333" />
        <path
          d="M11 22V7h5.4a4.6 4.6 0 0 1 0 9.2H11"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.5 25.8c5.5-2.6 15.5-2.6 21 0"
          fill="none"
          stroke="#F5A623"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="2.6 3.4"
        />
      </svg>

      {showName && (
        <span className="min-w-0">
          <span className="block font-heading text-[1.05rem] font-extrabold leading-none tracking-tight">
            {t("name")}
          </span>
          {showTagline && (
            <span className="tag-caps mt-1 block text-[0.6rem] font-semibold leading-none text-brand-ink">
              {t("tagline")}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
