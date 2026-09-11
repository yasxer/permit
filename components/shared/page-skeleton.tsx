import { Skeleton } from "@/components/ui/skeleton";

/**
 * Ce qui s'affiche entre le clic et la page : l'en-tête nuit et des cartes
 * vides, aux cotes de `PageShell`, pour que rien ne saute quand le contenu
 * arrive.
 *
 * Il sert de `loading.tsx` aux espaces connectés. Sans lui, Next ne précharge
 * pas les routes dynamiques et un clic sur un onglet ne fait rien tant que le
 * serveur n'a pas répondu ; avec lui, la navigation bascule sur-le-champ.
 */
export function PageSkeleton() {
  return (
    <div aria-busy="true">
      <div className="dark bg-sidebar px-[18px] pt-[max(0.75rem,env(safe-area-inset-top))] pb-[18px] lg:hidden">
        <div className="flex items-center gap-3">
          <Skeleton className="size-[1.875rem] shrink-0 rounded-[9px] bg-white/10" />
          <Skeleton className="h-5 w-40 bg-white/10" />
        </div>
      </div>

      <div className="dark hidden bg-sidebar lg:block">
        <div className="mx-auto w-full max-w-[90rem] space-y-3 px-8 pt-2 pb-14">
          <Skeleton className="h-3 w-48 bg-white/10" />
          <Skeleton className="h-9 w-72 bg-white/10" />
          <Skeleton className="h-4 w-96 max-w-full bg-white/10" />
        </div>
      </div>

      <div className="-mt-2.5 rounded-t-[20px] bg-background lg:-mt-10 lg:rounded-none lg:bg-transparent">
        <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-3.5 px-4 pt-4 pb-28 sm:px-6 lg:gap-5 lg:px-8 lg:pt-0 lg:pb-12">
          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl sm:h-32" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
