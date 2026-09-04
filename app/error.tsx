"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Catches render-time failures below the root layout. The raw message is
 * deliberately not shown — it can carry query fragments and ids — but it is
 * logged so it is still recoverable from the browser console.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const tc = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
        <CircleAlert className="size-6" aria-hidden />
      </span>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{tc("error")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{t("generic")}</p>
        {error.digest && (
          <p className="pt-1 font-mono text-xs text-muted-foreground">
            {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset}>{tc("retry")}</Button>
    </div>
  );
}
