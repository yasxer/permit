"use client";

import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { AddCandidateDialog } from "./add-candidate-dialog";

export function AddCandidateButton({ schoolId }: { schoolId: string }) {
  const t = useTranslations("ecole.students");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        {t("addCandidate")}
      </Button>
      <AddCandidateDialog open={open} onOpenChange={setOpen} schoolId={schoolId} />
    </>
  );
}
