import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Every status the app shows, mapped onto one of four tones. */
const TONES = {
  neutral: "border-transparent bg-muted text-muted-foreground",
  positive: "border-transparent bg-success/12 text-success",
  warning: "border-transparent bg-warning/15 text-warning",
  negative: "border-transparent bg-destructive/10 text-destructive",
} as const;

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  pending: "warning",
  approved: "positive",
  accepted: "positive",
  active: "positive",
  passed: "positive",
  available: "positive",
  completed: "neutral",
  scheduled: "neutral",
  notSet: "neutral",
  rejected: "negative",
  failed: "negative",
  cancelled: "negative",
  unavailable: "negative",
  absent: "warning",
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
