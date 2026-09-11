import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Rien à montrer, et pourquoi.
 *
 * Un rond en aplat sourd, un titre, une phrase : l'icône dit de quoi la liste
 * aurait parlé, la phrase dit ce qui la remplira. Une page vide sans cette
 * phrase se lit comme une panne.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-8 text-center",
        className,
      )}
    >
      <span className="grid size-13 place-items-center rounded-full bg-primary/7 text-primary">
        <Icon className="size-6" strokeWidth={1.6} aria-hidden />
      </span>
      <div className="space-y-1.5">
        <p className="font-heading text-[1.0625rem] font-semibold">{title}</p>
        {description && (
          <p className="max-w-[34ch] text-[0.8125rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
