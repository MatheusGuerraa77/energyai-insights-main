import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/training")({
  head: () => ({ meta: [{ title: "Treinamento IA — EnergyAI" }] }),
  component: TrainingPage,
});

type MetricRow = {
  modelo: string;
  horizonte: string;
  passos: number;
  mae: number;
  rmse: number;
  r2: number;
  mape: number;
  smape: number;
  acuracia: number;
};

type DashboardData = {
  status_modelo: string;
  melhor_modelo: string;
  horizonte: string;
  mae: number;
  rmse: number;
  r2: number;
  mape: number;
  smape?: number;
  acuracia: number;
};

const COLORS = [
  "oklch(0.72 0.15 230)",
  "oklch(0.72 0.18 295)",
  "oklch(0.74 0.17 155)",
  "oklch(0.8 0.16 75)",
];

const tip = {
  contentStyle: {
    background: "oklch(0.21 0.025 265 / 0.95)",
    border: "1px solid oklch(1 0 0 / 10%)",
    borderRadius: 12,
    fontSize: 12,
  },
};

async function getText(path: string) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Erro ao carregar ${path}`);
  return response.text();
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Erro ao carregar ${path}`);
  return response.json();
}

function parseCSV(text: string) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim());

  return lines.filter(Boolean).map((line) => {
    const values = line.split(",").map((v) => v.trim());

    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
  });
}

function parseMetricasCSV(text: string): MetricRow[] {
  return parseCSV(text).map((obj) => ({
    modelo: obj.modelo ?? "Modelo",
    horizonte: obj.horizonte ?? "-",
    passos: Number(obj.passos ?? 0),
    mae: Number(obj.mae ?? 0),
    rmse: Number(obj.rmse ?? 0),
    r2: Number(obj.r2 ?? 0),
    mape: Number(obj.mape ?? 0),
    smape: Number(obj.smape ?? 0),
    acuracia: Number(obj.acuracia ?? 0),
  }));
}

function formatNumber(value?: number, digits = 2) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatHorizonte(value?: string) {
  return String(value ?? "-").replaceAll("_", " ");
}

function downloadFile(path: string, name: string) {
  const link = document.createElement("a");
  link.href = path;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function TrainingPage() {
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedHorizonte, setSelectedHorizonte] = useState("1_hora");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);

        const [metricasCsv, dashboardJson] = await Promise.all([
          getText("/data/metricas_modelos.csv"),
          getJson<DashboardData>("/data/dashboard_data.json"),
        ]);

        const metricasParsed = parseMetricasCSV(metricasCsv);

        setMetrics(metricasParsed);
        setDashboard(dashboardJson);

        if (dashboardJson.horizonte) {
          setSelectedHorizonte(dashboardJson.horizonte);
        }
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar os treinamentos da IA.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  const horizontes = useMemo(() => {
    return ["1_hora", "6_horas", "12_horas", "24_horas"].filter((h) =>
      metrics.some((m) => m.horizonte === h)
    );
  }, [metrics]);

  const rankingHorizonte = useMemo(() => {
    return metrics
      .filter((m) => m.horizonte === selectedHorizonte)
      .sort((a, b) => b.acuracia - a.acuracia);
  }, [metrics, selectedHorizonte]);

  const best = useMemo(() => {
    return [...metrics].sort((a, b) => b.acuracia - a.acuracia)[0] ?? null;
  }, [metrics]);

  const melhorPorHorizonte = useMemo(() => {
    return horizontes.map((h) => {
      const melhor = metrics
        .filter((m) => m.horizonte === h)
        .sort((a, b) => b.acuracia - a.acuracia)[0];

      return {
        horizonte: formatHorizonte(h),
        acuracia: Number((melhor?.acuracia ?? 0).toFixed(2)),
        rmse: Number((melhor?.rmse ?? 0).toFixed(2)),
        mae: Number((melhor?.mae ?? 0).toFixed(2)),
        mape: Number((melhor?.mape ?? 0).toFixed(2)),
      };
    });
  }, [horizontes, metrics]);

  const linhasTodosTreinamentos = useMemo(() => {
    return metrics
      .map((m) => ({
        ...m,
        horizonteLabel: formatHorizonte(m.horizonte),
      }))
      .sort((a, b) => a.passos - b.passos || b.acuracia - a.acuracia);
  }, [metrics]);

  if (loading) {
    return (
      <Layout title="Treinamento da IA" subtitle="Carregando todos os modelos treinados">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-3xl border border-border bg-card/50 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h2 className="text-xl font-semibold">Carregando treinamentos...</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Lendo metricas_modelos.csv.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Treinamento da IA"
      subtitle="Resultados reais dos modelos de 1h, 6h, 12h e 24h"
    >
      <div className="space-y-6">
        {erro && <p className="text-sm text-red-400">{erro}</p>}

        <section className="grid gap-4 md:grid-cols-4">
          {horizontes.map((h) => {
            const melhor = metrics
              .filter((m) => m.horizonte === h)
              .sort((a, b) => b.acuracia - a.acuracia)[0];

            return (
              <button
                key={h}
                onClick={() => setSelectedHorizonte(h)}
                className={`rounded-2xl text-left transition-all hover:-translate-y-0.5 ${
                  selectedHorizonte === h ? "ring-2 ring-primary" : ""
                }`}
              >
                <GlassCard>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Horizonte
                  </p>
                  <p className="mt-1 text-2xl font-bold">{formatHorizonte(h)}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Melhor modelo
                  </p>
                  <p className="font-semibold">{melhor?.modelo ?? "-"}</p>
                  <p className="mt-2 text-xl font-bold text-gradient">
                    {formatNumber(melhor?.acuracia)}%
                  </p>
                </GlassCard>
              </button>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <GlassCard
            title={`Ranking dos modelos — ${formatHorizonte(selectedHorizonte)}`}
            description="Comparando ExtraTrees, RandomForest, HistGradientBoosting e Ensemble"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                <CheckCircle2 className="h-3 w-3" />
                {dashboard?.status_modelo ?? "Online"}
              </span>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {rankingHorizonte.map((m) => (
                <div
                  key={`${m.modelo}-${m.horizonte}`}
                  className="rounded-xl border border-border bg-card/40 px-3 py-3"
                >
                  <p className="text-sm font-semibold">{m.modelo}</p>
                  <p className="mt-2 text-[10px] uppercase text-muted-foreground">
                    Acurácia
                  </p>
                  <p className="font-mono text-lg font-bold">
                    {formatNumber(m.acuracia)}%
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <p>MAE: {formatNumber(m.mae, 2)}</p>
                    <p>RMSE: {formatNumber(m.rmse, 2)}</p>
                    <p>R²: {m.r2.toFixed(4)}</p>
                    <p>MAPE: {formatNumber(m.mape)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard title="Melhor resultado geral" description="Maior acurácia">
            <div className="grid place-items-center rounded-2xl border border-border bg-card/40 p-5 text-center">
              <Trophy className="h-10 w-10 text-warning" />
              <p className="mt-3 text-2xl font-bold text-gradient">
                {best?.modelo ?? "-"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatHorizonte(best?.horizonte)}
              </p>
              <p className="mt-3 text-3xl font-bold">
                {formatNumber(best?.acuracia)}%
              </p>
              <p className="text-xs text-muted-foreground">acurácia</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  downloadFile("/data/metricas_modelos.csv", "metricas_modelos.csv");
                  toast.success("Métricas baixadas");
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-xs hover:bg-card"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Baixar métricas
              </button>

              <button
                onClick={() => {
                  downloadFile("/data/previsoes_modelos.csv", "previsoes_modelos.csv");
                  toast.success("Previsões baixadas");
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-xs hover:bg-card"
              >
                <Download className="h-4 w-4" />
                Baixar previsões
              </button>

              <button
                onClick={() => toast.success("Modelo pronto para uso")}
                className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-primary)] px-3 py-2 text-xs font-semibold text-primary-foreground"
              >
                <Sparkles className="h-4 w-4" />
                Usar modelo
              </button>
            </div>
          </GlassCard>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <GlassCard title="Acurácia por modelo no horizonte selecionado">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingHorizonte}>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="modelo" stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <Tooltip {...tip} />
                  <Bar dataKey="acuracia" name="Acurácia (%)" radius={[6, 6, 0, 0]}>
                    {rankingHorizonte.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Melhores resultados por horizonte">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={melhorPorHorizonte}>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="horizonte" stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="acuracia" name="Acurácia" stroke={COLORS[0]} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="mape" name="MAPE" stroke={COLORS[1]} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="rmse" name="RMSE" stroke={COLORS[2]} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </section>

        <GlassCard title="Todos os treinamentos" description="Tabela completa de 1h, 6h, 12h e 24h">
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2">Horizonte</th>
                  <th className="pb-2">Modelo</th>
                  <th className="pb-2">MAE</th>
                  <th className="pb-2">RMSE</th>
                  <th className="pb-2">R²</th>
                  <th className="pb-2">MAPE</th>
                  <th className="pb-2">sMAPE</th>
                  <th className="pb-2">Acurácia</th>
                </tr>
              </thead>

              <tbody>
                {linhasTodosTreinamentos.map((m, i) => (
                  <tr
                    key={`${m.modelo}-${m.horizonte}-${i}`}
                    className="border-b border-border/40"
                  >
                    <td className="py-2 text-muted-foreground">
                      {m.horizonteLabel}
                    </td>
                    <td className="py-2 font-medium">{m.modelo}</td>
                    <td className="py-2 font-mono">{m.mae.toFixed(4)}</td>
                    <td className="py-2 font-mono">{m.rmse.toFixed(4)}</td>
                    <td className="py-2 font-mono">{m.r2.toFixed(4)}</td>
                    <td className="py-2 font-mono">{m.mape.toFixed(2)}%</td>
                    <td className="py-2 font-mono">{m.smape.toFixed(2)}%</td>
                    <td className="py-2 font-mono font-bold">
                      {m.acuracia.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}