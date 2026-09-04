"use client";

import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SlotsGrid } from "./slots-grid";
import { TemplateGrid } from "./template-grid";

export function PlanningTabs({ schoolId }: { schoolId: string }) {
  const t = useTranslations("ecole.planning");

  return (
    <Tabs defaultValue="template" className="gap-5">
      <TabsList className="self-start">
        <TabsTrigger value="template">{t("tabTemplate")}</TabsTrigger>
        <TabsTrigger value="slots">{t("tabSlots")}</TabsTrigger>
      </TabsList>

      <TabsContent value="template">
        <TemplateGrid schoolId={schoolId} />
      </TabsContent>
      <TabsContent value="slots">
        <SlotsGrid schoolId={schoolId} />
      </TabsContent>
    </Tabs>
  );
}
