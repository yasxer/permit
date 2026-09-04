import { CarFront } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  showName = true,
}: {
  className?: string;
  showName?: boolean;
}) {
  const t = useTranslations("app");

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <CarFront className="size-[1.1rem]" aria-hidden />
      </span>
      {showName && (
        <span className="text-[0.98rem] font-semibold tracking-tight">
          {t("name")}
        </span>
      )}
    </span>
  );
}
