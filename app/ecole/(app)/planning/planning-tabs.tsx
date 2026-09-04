"use client";

import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SessionGrid } from "./session-grid";

export function PlanningTabs({ schoolId }: { schoolId: string }) {
  const t = useTranslations("ecole.planning");

  // One grid per resource — the car and the classroom are booked the same way,
  // they just cannot be booked against each other.
  return (
    <Tabs defaultValue="driving" className="gap-5">
      <TabsList className="self-start">
        <TabsTrigger value="driving">{t("conduite")}</TabsTrigger>
        <TabsTrigger value="code">{t("code")}</TabsTrigger>
      </TabsList>

      <TabsContent value="driving">
        <SessionGrid schoolId={schoolId} resource="driving" />
      </TabsContent>
      <TabsContent value="code">
        <SessionGrid schoolId={schoolId} resource="code" />
      </TabsContent>
    </Tabs>
  );
}
