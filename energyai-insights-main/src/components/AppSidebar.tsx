import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Brain,
  Sparkles,
  BarChart3,
  History,
  FileText,
  Settings,
  Info,
  UserCircle,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/training", label: "Treinamento IA", icon: Brain },
  { to: "/predictions", label: "Previsões", icon: Sparkles },
  { to: "/analysis", label: "Análise de Dados", icon: BarChart3 },
  { to: "/history", label: "Histórico", icon: History },
  { to: "/reports", label: "Relatórios", icon: FileText },
  { to: "/settings", label: "Configurações", icon: Settings },
  { to: "/about", label: "Sobre o Projeto", icon: Info },
  { to: "/profile", label: "Perfil", icon: UserCircle },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 flex-col glass-strong border-r border-border">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)] glow">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold tracking-tight">EnergyAI</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Neural Forecast
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="relative group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-sidebar-accent/60"
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-sidebar-accent border border-border"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon
                    className={`relative h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`}
                  />
                  <span className={`relative truncate ${active ? "text-foreground" : ""}`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="m-3 rounded-xl glass p-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <p className="text-xs font-medium">Modelo Online</p>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">v1.0.3 · 97,2% acurácia</p>
      </div>
    </aside>
  );
}
