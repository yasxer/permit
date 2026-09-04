"use client";

import { CircleHelp, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmModal } from "@/components/shared/confirm-modal";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useDeleteQuestion,
  useQuestions,
  type QuestionWithOptions,
} from "@/hooks/use-questions";
import { localeLabels, locales } from "@/i18n/config";
import { formatDate } from "@/lib/format";
import type { ContentLang, QuestionType } from "@/types";

import { QuestionDialog } from "./question-dialog";

const TABS: { value: QuestionType; labelKey: string }[] = [
  { value: "question", labelKey: "tabQuestions" },
  { value: "plaque", labelKey: "tabPlaques" },
  { value: "carrefour", labelKey: "tabCarrefours" },
];

export function QuestionsManager() {
  const t = useTranslations("admin.questions");
  const tc = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale();

  const [type, setType] = useState<QuestionType>("question");
  const [lang, setLang] = useState<ContentLang | "all">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const [editing, setEditing] = useState<QuestionWithOptions | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<QuestionWithOptions | null>(null);

  const { data = [], isPending } = useQuestions(type, lang);
  const remove = useDeleteQuestion();

  const rows = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((question) =>
      question.body.toLowerCase().includes(needle),
    );
  }, [data, debouncedSearch]);

  const columns: Column<QuestionWithOptions>[] = [
    {
      id: "body",
      header: t("question"),
      cell: (question) => (
        <div className="flex items-center gap-3">
          {question.image_url && (
            <span className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
              <Image
                src={question.image_url}
                alt=""
                fill
                sizes="2.5rem"
                className="object-cover"
              />
            </span>
          )}
          <span className="line-clamp-2 max-w-md" lang={question.lang}>
            {question.body}
          </span>
        </div>
      ),
    },
    {
      id: "options",
      header: t("options"),
      hideBelow: "md",
      cell: (question) => (
        <span className="tabular-nums text-muted-foreground">
          {question.options.length}
        </span>
      ),
    },
    {
      id: "lang",
      header: t("language"),
      hideBelow: "sm",
      cell: (question) => (
        <Badge variant="secondary" className="font-medium">
          {localeLabels[question.lang]}
        </Badge>
      ),
    },
    {
      id: "source",
      header: t("source"),
      hideBelow: "lg",
      cell: (question) => (
        <span className="text-muted-foreground">
          {question.source === "api" ? t("sourceApi") : t("sourceManual")}
        </span>
      ),
    },
    {
      id: "created",
      header: tc("createdAt"),
      hideBelow: "lg",
      cell: (question) => formatDate(question.created_at, locale),
    },
    {
      id: "actions",
      header: <span className="sr-only">{tc("actions")}</span>,
      headerClassName: "w-px",
      className: "w-px whitespace-nowrap",
      cell: (question) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label={tc("edit")}
            onClick={() => {
              setEditing(question);
              setDialogOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={tc("delete")}
            onClick={() => setDeleting(question)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync({ id: deleting.id });
      toast.success(t("deleted"));
      setDeleting(null);
    } catch {
      toast.error(tErrors("generic"));
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={type} onValueChange={(value) => setType(value as QuestionType)}>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {t(tab.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          {t("addTitle")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(question) => question.id}
        isLoading={isPending}
        caption={t("title")}
        search={{ value: search, onChange: setSearch }}
        filters={
          <Select
            value={lang}
            onValueChange={(value) => setLang(value as ContentLang | "all")}
          >
            <SelectTrigger className="w-40" aria-label={t("language")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc("all")}</SelectItem>
              {locales.map((value) => (
                <SelectItem key={value} value={value}>
                  {localeLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        empty={{ icon: CircleHelp, title: t("empty") }}
      />

      <QuestionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        question={editing}
        defaultType={type}
      />

      <ConfirmModal
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteTitle")}
        message={t("deleteMessage")}
        confirmLabel={tc("delete")}
        destructive
        pending={remove.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
