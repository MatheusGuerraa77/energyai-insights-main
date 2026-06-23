import { useEffect, useState } from "react";
import { GlassCard } from "./GlassCard";
import { AlertTriangle, Info, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const ICONS = {
  warning: AlertTriangle,
  info: Info,
  success: Sparkles,
} as const;

const TONES = {
  warning: "text-warning bg-warning/10 border-warning/20",
  info: "text-info bg-info/10 border-info/20",
  success: "text-success bg-success/10 border-success/20",
} as const;

type InsightType = "warning" | "info" | "success";

type Insight = {
  id: number;
  type: InsightType;
  title: string;
  description: string;
};

type DashboardData = {
  acuracia: number;
  mae: number;
  rmse: number;
  mape: number;
  melhor_modelo: string;
  status_modelo: string;
};

type InsightsPanelProps = {
  delay?: number;
};

function formatNumber(value: number, digits = 2) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function InsightsPanel({ delay = 0 }: InsightsPanelProps) {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        const response = await fetch("/data/dashboard_data.json");
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error("Erro ao carregar insights da IA:", error);
      }
    }

    carregarDados();
  }, []);

  const accuracy = data?.acuracia ?? 0;
  const mae = data?.mae ?? 0;
  const rmse = data?.rmse ?? 0;
  const mape = data?.mape ?? 0;
  const model = data?.melhor_modelo ?? "IA";
  const status = data?.status_modelo ?? "Indisponível";

  const insights: Insight[] = [
    {
      id: 1,
      type: accuracy >= 85 ? "success" : accuracy >= 70 ? "info" : "warning",
      title: `Acurácia do modelo: ${formatNumber(accuracy)}%`,
      description:
        accuracy >= 85
          ? "O modelo apresenta ótima precisão para previsão de consumo."
          : accuracy >= 70
            ? "O modelo está utilizável, mas ainda pode ser melhorado."
            : "A acurácia está baixa e exige novo treinamento ou ajuste nos dados.",
    },
    {
      id: 2,
      type: "info",
      title: `Melhor modelo: ${model}`,
      description: `Status atual: ${status}. O modelo está sendo avaliado com métricas reais da IA.`,
    },
    {
      id: 3,
      type: mape <= 15 ? "success" : mape <= 25 ? "info" : "warning",
      title: `MAPE: ${formatNumber(mape)}%`,
      description:
        mape <= 15
          ? "Erro percentual baixo, indicando boa estabilidade nas previsões."
          : mape <= 25
            ? "Erro moderado. O modelo pode ser usado com acompanhamento."
            : "Erro percentual alto. Recomendado revisar base, variáveis ou horizonte.",
    },
    {
      id: 4,
      type: rmse <= mae * 1.8 ? "success" : "warning",
      title: `MAE ${formatNumber(mae, 3)} · RMSE ${formatNumber(rmse, 3)}`,
      description:
        rmse <= mae * 1.8
          ? "Os erros estão equilibrados, sem grandes picos fora do padrão."
          : "O RMSE está alto em relação ao MAE, indicando possíveis picos de erro.",
    },
  ];

  return (
    <GlassCard
      delay={delay}
      title="Insights da IA"
      description="Recomendações geradas com métricas reais"
    >
      <ul className="space-y-2.5">
        {insights.map((it, i) => {
          const Icon = ICONS[it.type];

          return (
            <motion.li
              key={it.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + i * 0.05 }}
              className="flex gap-3 rounded-xl border border-border bg-card/40 p-3"
            >
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${TONES[it.type]}`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium">{it.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {it.description}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </GlassCard>
  );
}