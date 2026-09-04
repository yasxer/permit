"use client";

import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmModal } from "@/components/shared/confirm-modal";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { useCategories, useDeleteCategory } from "@/hooks/use-categories";
import type { CategoryRow } from "@/types";

import { CategoryDialog } from "./category-dialog";

export function CategoriesTable() {
  const t = useTranslations("admin.categories");
  const tc = useTranslations("common");
  const tErrors = useTranslations("errors");

  const { data = [], isPending } = useCategories();
  const remove = useDeleteCategory();

  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);

  const columns: Column<CategoryRow>[] = [
    {
      id: "code",
      header: t("code"),
      headerClassName: "w-24",
      cell: (category) => (
        <span className="font-mono text-sm font-semibold">{category.code}</span>
      ),
    },
    { id: "fr", header: t("labelFr"), cell: (category) => category.label_fr },
    {
      id: "ar",
      header: t("labelAr"),
      hideBelow: "md",
      cell: (category) => (
        <span lang="ar" dir="rtl">
          {category.label_ar}
        </span>
      ),
    },
    {
      id: "en",
      header: t("labelEn"),
      hideBelow: "lg",
      cell: (category) => category.label_en,
    },
    {
      id: "actions",
      header: <span className="sr-only">{tc("actions")}</span>,
      headerClassName: "w-px",
      className: "w-px whitespace-nowrap",
      cell: (category) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label={tc("edit")}
            onClick={() => {
              setEditing(category);
              setDialogOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={tc("delete")}
            onClick={() => setDeleting(category)}
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
      // A category still referenced by an enrollment is blocked by the FK.
      toast.error(tErrors("generic"));
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
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
        rows={data}
        getRowId={(category) => category.id}
        isLoading={isPending}
        caption={t("title")}
        empty={{ icon: Tags, title: t("empty") }}
      />

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
      />

      <ConfirmModal
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteTitle")}
        message={deleting ? t("deleteMessage", { code: deleting.code }) : undefined}
        confirmLabel={tc("delete")}
        destructive
        pending={remove.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
