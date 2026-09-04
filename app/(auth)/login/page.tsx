import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

/** Only same-origin paths may be used as a post-login destination. */
function safeNext(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const t = await getTranslations("auth");

  return (
    <div className="space-y-4">
      {searchParams.error === "link_expired" && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{t("linkExpired")}</AlertDescription>
        </Alert>
      )}
      <LoginForm next={safeNext(searchParams.next)} />
    </div>
  );
}
