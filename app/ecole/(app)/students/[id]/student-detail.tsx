"use client";

import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Droplet,
  Flag,
  KeyRound,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteEnrollment, useStudentFile } from "@/hooks/use-enrollments";
import { usePayments } from "@/hooks/use-payments";
import { formatCurrency, formatDate } from "@/lib/format";
import { STAGE_LABEL_KEYS, stageOf } from "@/lib/stages";

import { AddPaymentDialog } from "./add-payment-dialog";
import { CredentialsDialog } from "./credentials-dialog";
import { EditCandidateDialog } from "./edit-candidate-dialog";

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Phone;
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

function initials(name: string | null): string {
  const parts = (name ?? "?").trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

export function StudentDetail({ enrollmentId }: { enrollmentId: string }) {
  const t = useTranslations("ecole.students");
  const tc = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();

  const { data: file, isPending, isError } = useStudentFile(enrollmentId);
  const [showPayments, setShowPayments] = useState(false);
  const { data: payments = [], isPending: paymentsPending } = usePayments(
    enrollmentId,
    showPayments,
  );

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteEnrollment = useDeleteEnrollment();

  async function confirmDelete() {
    try {
      await deleteEnrollment.mutateAsync({ id: enrollmentId });
      toast.success(t("candidateDeleted"));
      router.push("/ecole/students");
    } catch (error) {
      console.error("delete candidate failed", error);
      const reason = (error as Error).message;
      toast.error(
        reason === "not_your_candidate"
          ? tErrors("forbidden")
          : tErrors("generic"),
      );
    }
  }

  if (isPending) {
    return (
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (isError || !file) {
    // The file we just deleted is gone from under its own page — that is the
    // redirect arriving, not a file that was never there.
    return deleteEnrollment.isSuccess ? (
      <Skeleton className="h-72" />
    ) : (
      <EmptyState title={tErrors("notFound")} />
    );
  }

  return (
    <>
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm" className="-ms-2">
            <Link href="/ecole/students">
              <ArrowLeft className="size-4 rtl-flip" />
              {tc("back")}
            </Link>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            {t("deleteCandidate")}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Avatar className="size-12">
            {file.candidate_photo_url && (
              <AvatarImage src={file.candidate_photo_url} alt="" />
            )}
            <AvatarFallback className="bg-primary/10 font-medium text-primary">
              {initials(file.candidate_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate font-heading text-2xl font-semibold tracking-tight">
              {file.candidate_name ?? "—"}
            </h1>
            {file.candidate_name_fr && (
              <p dir="ltr" className="truncate text-sm text-muted-foreground">
                {file.candidate_name_fr}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-mono font-semibold">
                {file.category_code}
              </Badge>
              {/* Where the exam results have left them. */}
              <Badge variant="outline">{t(STAGE_LABEL_KEYS[stageOf(file)])}</Badge>
              <StatusBadge status={file.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("personalInfo")}</CardTitle>
              {/* The candidate has no app to correct these from — the school
                  is the only one who can keep them right. */}
              <CardAction>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" />
                  {tc("edit")}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-8 sm:grid-cols-2">
                <Detail icon={Phone} label={t("phone")}>
                  <span dir="ltr">{file.candidate_phone ?? "—"}</span>
                </Detail>
                <Detail icon={CalendarDays} label={t("birthdate")}>
                  {formatDate(file.candidate_birthdate, locale)}
                </Detail>
                <Detail icon={MapPin} label={t("birthPlace")}>
                  {file.candidate_birth_place ?? "—"}
                </Detail>
                <Detail icon={Flag} label={t("nationality")}>
                  {file.candidate_nationality ?? "—"}
                </Detail>
                <Detail icon={Droplet} label={t("bloodGroup")}>
                  <span dir="ltr" className="font-mono">
                    {file.candidate_blood_group ?? "—"}
                  </span>
                </Detail>
                <Detail icon={MapPin} label={t("address")}>
                  {file.candidate_address ?? "—"}
                </Detail>
                <Detail icon={CalendarDays} label={tc("createdAt")}>
                  {formatDate(file.requested_at, locale)}
                </Detail>
              </dl>
            </CardContent>
          </Card>

          {showPayments && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("paymentHistory")}</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                {paymentsPending ? (
                  <div className="space-y-2 px-6">
                    {Array.from({ length: 3 }, (_, index) => (
                      <Skeleton key={index} className="h-9" />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <EmptyState icon={Banknote} title={t("noPayments")} />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="ps-6">{t("amount")}</TableHead>
                        <TableHead>{t("note")}</TableHead>
                        <TableHead className="pe-6 text-end">{tc("date")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="ps-6 font-medium tabular-nums">
                            {formatCurrency(payment.amount, locale)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {payment.note ?? "—"}
                          </TableCell>
                          <TableCell className="pe-6 text-end text-muted-foreground">
                            {formatDate(payment.paid_at, locale)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">{t("enrollmentInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">{t("totalPrice")}</dt>
                <dd className="font-medium tabular-nums">
                  {formatCurrency(file.total_price, locale)}
                </dd>
              </div>
              {file.perf_session_count > 0 && (
                <>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">
                      {t("perfSessions")}
                      {" · "}
                      {t("perfSessionsCount", { count: file.perf_session_count })}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {formatCurrency(file.perf_total, locale)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 border-t pt-3">
                    <dt className="text-muted-foreground">{t("amountDue")}</dt>
                    <dd className="font-medium tabular-nums">
                      {formatCurrency(file.amount_due, locale)}
                    </dd>
                  </div>
                </>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">{t("amountPaid")}</dt>
                <dd className="font-medium tabular-nums text-success">
                  {formatCurrency(file.amount_paid, locale)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t pt-3">
                <dt className="text-muted-foreground">{t("amountRemaining")}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {file.amount_remaining === 0 ? (
                    <span className="text-base text-success">{t("paidInFull")}</span>
                  ) : (
                    formatCurrency(file.amount_remaining, locale)
                  )}
                </dd>
              </div>
            </dl>

            <div className="space-y-1.5 border-t pt-4">
              <p className="text-xs text-muted-foreground">{t("credentials")}</p>
              <p dir="ltr" className="truncate font-mono text-sm">
                {file.candidate_email ?? "—"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setCredentialsOpen(true)}
              >
                <KeyRound className="size-4" />
                {t("editCredentials")}
              </Button>
            </div>

            <div className="space-y-2 pt-1">
              <Button className="w-full" onClick={() => setPaymentOpen(true)}>
                <Plus className="size-4" />
                {t("addPayment")}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPayments((value) => !value)}
                aria-expanded={showPayments}
              >
                <Wallet className="size-4" />
                {showPayments ? t("hidePayments") : t("viewPayments")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddPaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        enrollmentId={file.id}
        remaining={file.amount_remaining}
      />

      <EditCandidateDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        file={file}
      />

      <CredentialsDialog
        open={credentialsOpen}
        onOpenChange={setCredentialsOpen}
        candidateId={file.candidate_id}
        currentLogin={file.candidate_email}
      />

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteCandidateTitle")}
        message={t("deleteCandidateMessage", {
          name: file.candidate_name ?? "—",
        })}
        confirmLabel={tc("delete")}
        destructive
        pending={deleteEnrollment.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
