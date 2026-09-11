import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Une seule échelle de statut dans toute l'application — cinq tons, pas un de
 * plus : au-delà, la couleur cesse d'être un signal et redevient de la
 * décoration.
 */
const TONES = {
  neutral: "border-transparent bg-muted text-muted-foreground",
  positive: "border-transparent bg-success/13 text-success",
  warning: "border-transparent bg-brand/12 text-warning",
  negative: "border-transparent bg-destructive/13 text-destructive",
  /** « Terminé » : l'encre, mais en teinte — c'est un état, pas une alerte. */
  ink: "border-transparent bg-primary/10 text-primary",
} as const;

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  pending: "warning",
  approved: "positive",
  accepted: "positive",
  active: "positive",
  passed: "positive",
  available: "positive",
  completed: "ink",
  scheduled: "neutral",
  notSet: "neutral",
  rejected: "negative",
  failed: "negative",
  unavailable: "negative",
  // Ni réussite ni échec : l'absence et l'annulation sortent de l'échelle.
  cancelled: "neutral",
  absent: "neutral",
};

export function StatusBadge({
  status,
  className,
}: {
  /** A key in the `status` message namespace. */
  status: string;
  className?: string;
}) {
  const t = useTranslations("status");
  const tone = STATUS_TONE[status] ?? "neutral";

  return (
    <Badge className={cn("font-medium", TONES[tone], className)}>
      {t(status)}
    </Badge>
  );
}
