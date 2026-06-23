import { useEffect, useState } from "react";
import {
  Activity,
  Database,
  Gauge,
  Server,
  Sparkles,
  Timer,
} from "lucide-react";
import { GlassCard } from "./GlassCard";

type DashboardData = {
  acuracia: number;
  mae: number;
  rmse: number;
  mape: number;
  status_modelo: string;
  melhor_modelo: string;
  horizonte: string;
};

type AIHealthPanelProps = {
  delay?: number;
};

function formatNumber(value: number, digits = 2) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function AIHealthPanel({ delay = 0 }: AIHealthPanelProps) {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/data/dashboard_data.json");
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error("Erro ao carregar saúde da IA:", error);
      }
    }

    loadData();
  }, []);

  const accuracy = data?.acuracia ?? 0;
  const mae = data?.mae ?? 0;
  const rmse = data?.rmse ?? 0;
  const mape = data?.mape ?? 0;
  const status = data?.status_modelo ?? "Indisponível";
  const model = data?.melhor_modelo ?? "IA";
  const horizonte = data?.horizonte ?? "-";

  const isOperational =
    status.toLowerCase().includes("online") ||
    status.toLowerCase().includes("treinado");

  const rows = [
    { icon: Gauge, label: "Acurácia do modelo", value: `${formatNumber(accuracy)}%` },
    { icon: Timer, label: "Último treinamento", value: new Date().toLocaleDateString("pt-BR") },
    { icon: Server, label: "Status", value: status },
    { icon: Sparkles, label: "Melhor modelo", value: model },
    { icon: Activity, label: "Horizonte", value: horizonte },
    { icon: Timer, label: "MAE", value: formatNumber(mae, 4) },
    { icon: Activity, label: "RMSE", value: formatNumber(rmse, 4) },
    { icon: Gauge, label: "MAPE", value: `${formatNumber(mape)}%` },
    { icon: Database, label: "Dataset", value: "Energia treinada" },
  ];

  return (
    <GlassCard
      delay={delay}
      title="Painel de Saúde da IA"
      description={`Atualizado em ${new Date().toLocaleString("pt-BR")}`}
      action={
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            isOperational
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning"
          }`}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                isOperational ? "bg-success" : "bg-warning"
              }`}
            />
            <span
              className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                isOperational ? "bg-success" : "bg-warning"
              }`}
            />
          </span>
          {isOperational ? "Operacional" : "Atenção"}
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