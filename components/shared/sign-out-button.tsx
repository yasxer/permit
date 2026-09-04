import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A real form POST rather than a click handler: it works without JavaScript
 * and cannot be triggered by a cross-site GET.
 */
export async function SignOutButton({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const t = await getTranslations("nav");

  return (
    <form action="/api/auth/signout" method="post" className={cn(className)}>
      <Button type="submit" variant={variant} className="w-full">
        <LogOut className="rtl-flip" />
        {t("logout")}
      </Button>
    </form>
  );
}
