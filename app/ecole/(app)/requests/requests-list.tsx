"use client";

import { Check, Inbox, Phone, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAcceptEnrollment,
  useRejectEnrollment,
  useStudentFiles,
} from "@/hooks/use-enrollments";
import { formatDate } from "@/lib/format";
import type { EnrollmentStatus, StudentFileRow } from "@/types";

type Decision = { file: StudentFileRow; action: "accept" | "reject" };

/** Only the states a request can be in — 'completed' belongs to /completed. */
const FILTERS: (EnrollmentStatus | "all")[] = [
  "pending",
  "active",
  "rejected",
  "all",
];

function initials(name: string | null): string {
  const parts = (name ?? "?").trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

export function RequestsList({ schoolId }: { schoolId: string }) {
  const t = useTranslations("ecole.requests");
  const tc = useTranslations("common");
  const tStatus = useTranslations("status");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const [status, setStatus] = useState<EnrollmentStatus | "all">("pending");
  const [decision, setDecision] = useState<Decision | null>(null);

  const { data = [], isPending } = useStudentFiles(schoolId, status);
  const accept = useAcceptEnrollment();
  const reject = useRejectEnrollment();

  async function confirm() {
    if (!decision) return;
    const { file, action } = decision;
    try {
      if (action === "accept") {
        await accept.mutateAsync({ id: file.id });
        toast.success(t("accepted"));
      } else {
        await reject.mutateAsync({ id: file.id });
        toast.success(t("rejected"));
      }
      setDecision(null);
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as EnrollmentStatus | "all")}
        >
          <SelectTrigger className="w-44" aria-label={tc("filter")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((value) => (
              <SelectItem key={value} value={value}>
                {value === "all" ? tc("all") : tStatus(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon={Inbox} title={t("empty")} />
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((file) => (
            <li key={file.id}>
              <Card className="h-full">
                <CardContent className="flex h-full flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-11">
                      {file.candidate_photo_url && (
                        <AvatarImage src={file.candidate_photo_url} alt="" />
                      )}
                      <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                        {initials(file.candidate_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {file.candidate_name ?? "—"}
                      </p>
                      {file.candidate_phone && (
                        <p
                          dir="ltr"
                          className="flex items-center gap-1.5 text-sm text-muted-foreground"
                        >
                          <Phone className="size-3.5 shrink-0" aria-hidden />
                          {file.candidate_phone}
                        </p>
                      )}
                    </div>

                    <StatusBadge status={file.status} />
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        {t("category")}
                      </dt>
                      <dd className="font-mono font-semibold">
                        {file.category_code}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        {t("requestedAt")}
                      </dt>
                      <dd className="font-medium">
                        {formatDate(file.requested_at, locale)}
                      </dd>
                    </div>
                  </dl>

                  {file.status === "pending" && (
                    <div className="mt-auto flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => setDecision({ file, action: "accept" })}
                      >
                        <Check className="size-4" />
                        {t("accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setDecision({ file, action: "reject" })}
                      >
                        <X className="size-4" />
                        {t("reject")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={decision !== null}
        onOpenChange={(open) => !open && setDecision(null)}
        title={decision?.action === "reject" ? t("rejectTitle") : t("acceptTitle")}
        message={
          decision
            ? decision.action === "reject"
              ? t("rejectMessage", { name: decision.file.candidate_name ?? "—" })
              : t("acceptMessage", { name: decision.file.candidate_name ?? "—" })
            : undefined
        }
        confirmLabel={decision?.action === "reject" ? t("reject") : t("accept")}
        destructive={decision?.action === "reject"}
        pending={accept.isPending || reject.isPending}
        onConfirm={confirm}
      />
    </>
  );
}
