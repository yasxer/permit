import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/** Two letters from the display name. */
export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? "?").trim().split(/\s+/);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

/**
 * Le candidat tel qu'il apparaît partout : l'avatar, le nom en latin, le nom
 * en arabe dessous.
 *
 * Les deux noms cohabitent parce que le dossier officiel est en arabe et que
 * la salle parle latin ; en montrer un seul oblige à ouvrir la fiche pour
 * vérifier qu'on tient bien la bonne personne.
 */
export function CandidateIdentity({
  nameFr,
  nameAr,
  photoUrl,
  size = "default",
  className,
}: {
  nameFr: string | null;
  nameAr: string | null;
  photoUrl?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const primary = nameFr ?? nameAr ?? "—";
  const secondary = nameFr && nameAr && nameFr !== nameAr ? nameAr : null;

  const avatarSize = { sm: "size-9", default: "size-9", lg: "size-11" }[size];
  const nameSize = { sm: "text-sm", default: "text-sm", lg: "text-[0.9375rem]" }[size];

  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Avatar className={cn("shrink-0", avatarSize)}>
        {photoUrl && <AvatarImage src={photoUrl} alt="" />}
        <AvatarFallback className="bg-primary/7 text-xs font-semibold text-primary">
          {initialsOf(primary)}
        </AvatarFallback>
      </Avatar>

      <span className="flex min-w-0 flex-col">
        <span className={cn("truncate font-semibold", nameSize)}>{primary}</span>
        {secondary && (
          <span
            lang="ar"
            dir="rtl"
            className="truncate text-[0.8125rem] text-muted-foreground"
          >
            {secondary}
          </span>
        )}
      </span>
    </span>
  );
}
