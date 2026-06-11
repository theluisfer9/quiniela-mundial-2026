import { Button } from "@quiniela-mundial-2026/ui/components/button";
import { Languages } from "lucide-react";

import { useI18n, type AppLocale } from "@/lib/i18n";

const locales: AppLocale[] = ["es", "en"];

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-[0.9rem] bg-background/75 p-1 ring-1 ring-border/60 sm:gap-1" aria-label={t.common.language}>
      <Languages aria-hidden="true" className="ml-1 hidden size-4 text-muted-foreground sm:block" />
      {locales.map((nextLocale) => (
        <Button
          key={nextLocale}
          type="button"
          variant={locale === nextLocale ? "default" : "ghost"}
          size="sm"
          className="h-8 min-w-8 rounded-[0.75rem] px-1.5 text-xs font-bold sm:min-w-9 sm:px-2"
          aria-pressed={locale === nextLocale}
          onClick={() => setLocale(nextLocale)}
        >
          {nextLocale === "es" ? t.common.spanish : t.common.english}
        </Button>
      ))}
    </div>
  );
}
