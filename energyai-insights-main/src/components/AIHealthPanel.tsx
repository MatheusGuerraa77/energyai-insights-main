import { aiHealth } from "@/lib/mock-data";
import { Activity, Database, Gauge, Server, Sparkles, Timer } from "lucide-react";
import { GlassCard } from "./GlassCard";

const rows = [
  { icon: Gauge, label: "Precisão do modelo", value: `${aiHealth.accuracy}%`, tone: "success" },
  { icon: Timer, label: "Último treinamento", value: aiHealth.lastTrained, tone: "info" },
  { icon: Server, label: "Status", value: aiHealth.status, tone: "success" },
  { icon: Sparkles, label: "Versão", value: aiHealth.version, tone: "info" },
  { icon: Activity, label: "Previsões realizadas", value: aiHealth.predictionsCount.toLocaleString("pt-BR"), tone: "info" },
  { icon: Timer, label: "Tempo médio resposta", value: `${aiHealth.avgResponse} ms`, tone: "info" },
  { icon: Database, label: "Dataset", value: aiHealth.dataset, tone: "info" },
  { icon: Gauge, label: "Qualidade dos dados", value: `${aiHealth.dataQuality}/100`, tone: "success" },
] as const;

export function AIHealthPanel({ delay = 0 }: { delay?: number }) {
  return (
    <GlassCard
      delay={delay}
      title="Painel de Saúde da IA"
      description={`Atualizado em ${aiHealth.lastUpdate}`}
      action={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          Operacional
        </span>
      }
    >
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <li
              key={r.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/40 px-3 py-2.5"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                  {r.label}
                </p>
                <p className="truncate text-sm font-semibold">{r.value}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
