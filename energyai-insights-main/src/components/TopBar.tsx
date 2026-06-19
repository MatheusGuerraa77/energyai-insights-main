import { Bell, Search, Command } from "lucide-react";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-border">
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-1.5 text-xs text-muted-foreground">
          <Search className="h-3.5 w-3.5" />
          <span>Buscar…</span>
          <kbd className="ml-2 inline-flex items-center gap-1 rounded border border-border bg-background/60 px-1.5 py-0.5 text-[10px]">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </div>

        <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-card/40 hover:bg-card transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>

        <div className="grid h-9 w-9 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-xs font-semibold text-primary-foreground">
          AL
        </div>
      </div>
    </header>
  );
}
