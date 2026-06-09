import { cn } from "@quiniela-mundial-2026/ui/lib/utils";
import * as React from "react";

type AppSectionProps = React.ComponentProps<"section"> & {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  contentClassName?: string;
};

function AppSection({
  className,
  eyebrow,
  title,
  description,
  action,
  children,
  contentClassName,
  ...props
}: AppSectionProps) {
  return (
    <section
      data-slot="app-section"
      className={cn(
        "rounded-[1.5rem] border border-border/70 bg-card/95 px-4 py-5 shadow-[0_16px_42px_-28px_rgba(42,57,141,0.32)] sm:px-6 sm:py-6",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              {eyebrow ? (
                <p className="text-[0.7rem] font-bold tracking-[0.2em] text-primary uppercase">
                  {eyebrow}
                </p>
              ) : null}
              {action ? <div className="shrink-0 sm:hidden">{action}</div> : null}
            </div>
            <div className="space-y-1.5">
              <h2 className="text-balance font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
                {title}
              </h2>
              {description ? (
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          {action ? <div className="hidden shrink-0 sm:block">{action}</div> : null}
        </div>
        <div className={cn("space-y-4", contentClassName)}>{children}</div>
      </div>
    </section>
  );
}

export { AppSection };
