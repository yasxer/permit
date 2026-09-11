"use client";

import {
  ArrowLeft,
  Building2,
  Car,
  CalendarDays,
  Check,
  Mail,
  MapPin,
  Phone,
  User,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { PageShell } from "@/components/shared/page-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useApproveSchool,
  useRejectSchool,
  useSchool,
  useSchoolPrices,
} from "@/hooks/use-schools";
import { DAY_KEYS, formatCurrency, formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import type { CategoryRow } from "@/types";

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Building2;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

/** Category label in the reader's language, falling back to the code. */
function categoryLabel(category: CategoryRow | null, locale: string): string {
  if (!category) return "—";
  const byLocale: Record<Locale, string> = {
    ar: category.label_ar,
    fr: category.label_fr,
    en: category.label_en,
  };
  return byLocale[locale as Locale] ?? category.code;
}

export function SchoolDetail({ schoolId }: { schoolId: string }) {
  const t = useTranslations("admin.schools");
  const tp = useTranslations("ecole.profile");
  const tc = useTranslations("common");
  const tNav = useTranslations("nav");
  const tUsers = useTranslations("admin.users");
  const tDays = useTranslations("days");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();

  const { data: school, isPending, isError } = useSchool(schoolId);
  const { data: prices = [] } = useSchoolPrices(schoolId);
  const approve = useApproveSchool();
  const reject = useRejectSchool();
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  if (isPending) {
    return (
      <PageShell kicker={tNav("autoEcoles")} title={<span className="block h-8 w-64 max-w-full animate-pulse rounded-md bg-white/12" />}>
        <div className="grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </PageShell>
    );
  }

  if (isError || !school) {
    return (
      <PageShell kicker={tNav("autoEcoles")} title={tNav("autoEcoles")}>
        <EmptyState icon={Building2} title={tErrors("notFound")} />
      </PageShell>
    );
  }

  const totalExams = school.success_passed + school.success_failed;
  const successRate =
    totalExams > 0 ? Math.round((school.success_passed / totalExams) * 100) : null;

  async function confirm() {
    if (!action || !school) return;
    try {
      if (action === "approve") {
        await approve.mutateAsync({ id: school.id });
        toast.success(t("approved"));
      } else {
        await reject.mutateAsync({ id: school.id });
        toast.success(t("rejected"));
      }
      setAction(null);
      router.refresh();
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <PageShell
      kicker={tNav("autoEcoles")}
      title={school.name ?? t("detailsTitle")}
      description={<StatusBadge status={school.status} />}
      actions={
        <>
          <Button asChild variant="outline" className="border-sidebar-border text-sidebar-foreground hover:bg-white/8">
            <Link href="/admin/auto-ecoles">
              <ArrowLeft className="size-4 rtl-flip" />
              {tc("back")}
            </Link>
          </Button>
          {school.status !== "approved" && (
            <Button onClick={() => setAction("approve")}>
              <Check className="size-4" />
              {t("approve")}
            </Button>
          )}
          {school.status !== "rejected" && (
            <Button
              variant="outline"
              className="border-sidebar-border text-sidebar-foreground hover:bg-white/8"
              onClick={() => setAction("reject")}
            >
              <X className="size-4" />
              {t("reject")}
            </Button>
          )}
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("detailsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-8 sm:grid-cols-2">
              <Detail icon={User} label={t("director")}>
                {school.director_name ?? "—"}
              </Detail>
              <Detail icon={Phone} label={t("phone")}>
                <span dir="ltr">{school.phone ?? "—"}</span>
              </Detail>
              <Detail icon={Mail} label={tUsers("email")}>
                <span dir="ltr">{school.owner?.email ?? "—"}</span>
              </Detail>
              <Detail icon={MapPin} label={t("address")}>
                {school.address ?? "—"}
                {school.wilaya && (
                  <span className="text-muted-foreground">
                    {" · "}
                    {locale === "ar"
                      ? school.wilaya.name_ar
                      : locale === "en"
                        ? school.wilaya.name_en
                        : school.wilaya.name_fr}
                  </span>
                )}
              </Detail>
              <Detail icon={Car} label={tp("teachingCar")}>
                {school.teaching_car ?? "—"}
              </Detail>
              <Detail icon={CalendarDays} label={tp("examDay")}>
                {school.exam_day === null ? "—" : tDays(DAY_KEYS[school.exam_day])}
              </Detail>
              <Detail icon={Wallet} label={tp("perfPricePerHour")}>
                {school.perf_price_per_hour === null
                  ? "—"
                  : formatCurrency(school.perf_price_per_hour, locale)}
              </Detail>
              <Detail icon={CalendarDays} label={tc("createdAt")}>
                {formatDate(school.created_at, locale)}
              </Detail>
            </dl>

            {school.status === "rejected" && school.rejection_reason && (
              <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/9 px-3.5 py-3 text-[0.8125rem]">
                {school.rejection_reason}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          {school.photo_url && (
            <Card className="overflow-hidden py-0">
              <div className="relative aspect-video w-full bg-muted">
                <Image
                  src={school.photo_url}
                  alt={school.name ?? ""}
                  fill
                  sizes="(max-width: 1024px) 100vw, 20rem"
                  className="object-cover"
                />
              </div>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{tp("successStats")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">{tp("passedCount")}</span>
                <span className="font-medium tabular-nums text-success">
                  {school.success_passed}
                </span>
              </div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">{tp("failedCount")}</span>
                <span className="font-medium tabular-nums text-destructive">
                  {school.success_failed}
                </span>
              </div>
              {successRate !== null && (
                <div className="flex items-baseline justify-between border-t pt-3 text-sm">
                  <span className="text-muted-foreground">%</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {successRate}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tp("prices")}</CardTitle>
            </CardHeader>
            <CardContent>
              {prices.length === 0 ? (
                <p className="text-sm text-muted-foreground">{tc("empty")}</p>
              ) : (
                <ul className="space-y-2.5">
                  {prices.map((row, index) => {
                    const category = row.category as unknown as CategoryRow | null;
                    return (
                      <li
                        key={category?.id ?? `price-${index}`}
                        className="flex items-baseline justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="font-medium">{category?.code}</span>
                          <span className="ms-2 truncate text-xs text-muted-foreground">
                            {categoryLabel(category, locale)}
                          </span>
                        </span>
                        <span className="shrink-0 font-medium tabular-nums">
                          {formatCurrency(row.price, locale)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={action !== null}
        onOpenChange={(open) => !open && setAction(null)}
        title={action === "reject" ? t("rejectTitle") : t("approveTitle")}
        message={
          action === "reject"
            ? t("rejectMessage", { name: school.name ?? "—" })
            : t("approveMessage", { name: school.name ?? "—" })
        }
        confirmLabel={action === "reject" ? t("reject") : t("approve")}
        destructive={action === "reject"}
        pending={approve.isPending || reject.isPending}
        onConfirm={confirm}
      />
    </PageShell>
  );
}
