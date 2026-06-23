import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Save,
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
  consumo_atual: number;
  previsao_24h: number;
  economia_estimada: number;
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

  if (!response.ok) {
    throw new Error(`Erro ao carregar ${path}`);
  }

  return response.text();
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Erro ao carregar ${path}`);
  }

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
  return parseCSV(text).map((obj) => {
    const r2 = Number(obj.r2 ?? 0);
    const mape = Number(obj.mape ?? 0);

    return {
      modelo: obj.modelo ?? "Modelo",
      horizonte: obj.horizonte ?? "-",
      passos: Number(obj.passos ?? 0),
      mae: Number(obj.mae ?? 0),
      rmse: Number(obj.rmse ?? 0),
      r2,
      mape,
      smape: Number(obj.smape ?? 0),
      acuracia: Number(
        obj.acuracia ?? Math.max(0, r2 > 0 ? r2 * 100 : 100 - mape)
      ),
    };
  });
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
  const [selectedHorizonte, setSelectedHorizonte] = useState("");
  const [selectedModelo, setSelectedModelo] = useState("");
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

        const melhor =
          metricasParsed.find(
            (m) =>
              m.modelo === dashboardJson.melhor_modelo &&
              m.horizonte === dashboardJson.horizonte
          ) ??
          [...metricasParsed].sort((a, b) => b.acuracia - a.acuracia)[0];

        if (melhor) {
          setSelectedHorizonte(melhor.horizonte);
          setSelectedModelo(melhor.modelo);
        }
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar as métricas reais do treinamento.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  const horizontes = useMemo(() => {
    return Array.from(new Set(metrics.map((m) => m.horizonte)));
  }, [metrics]);

  const modelosDisponiveis = useMemo(() => {
    return metrics
      .filter((m) => m.horizonte === selectedHorizonte)
      .map((m) => m.modelo);
  }, [metrics, selectedHorizonte]);

  useEffect(() => {
    if (
      modelosDisponiveis.length > 0 &&
      !modelosDisponiveis.includes(selectedModelo)
    ) {
      setSelectedModelo(modelosDisponiveis[0]);
    }
  }, [modelosDisponiveis, selectedModelo]);

  const selectedMetric = useMemo(() => {
    return (
      metrics.find(
        (m) => m.horizonte === selectedHorizonte && m.modelo === selectedModelo
      ) ?? null
    );
  }, [metrics, selectedHorizonte, selectedModelo]);

  const rankingHorizonte = useMemo(() => {
    return metrics
      .filter((m) => m.horizonte === selectedHorizonte)
      .sort((a, b) => b.acuracia - a.acuracia)
      .map((m) => ({
        modelo: m.modelo,
        acuracia: Number(m.acuracia.toFixed(2)),
        rmse: Number(m.rmse.toFixed(2)),
      }));
  }, [metrics, selectedHorizonte]);

  const comparativoHorizontes = useMemo(() => {
    return horizontes.map((h) => {
      const melhor = metrics
        .filter((m) => m.horizonte === h)
        .sort((a, b) => b.acuracia - a.acuracia)[0];

      return {
        horizonte: formatHorizonte(h),
        acuracia: melhor ? Number(melhor.acuracia.toFixed(2)) : 0,
        rmse: melhor ? Number(melhor.rmse.toFixed(2)) : 0,
      };
    });
  }, [horizontes, metrics]);

  const metricasLinha = useMemo(() => {
    return metrics
      .filter((m) => m.modelo === selectedModelo)
      .sort((a, b) => a.passos - b.passos)
      .map((m) => ({
        horizonte: formatHorizonte(m.horizonte),
        acuracia: Number(m.acuracia.toFixed(2)),
        rmse: Number(m.rmse.toFixed(2)),
        mae: Number(m.mae.toFixed(2)),
      }));
  }, [metrics, selectedModelo]);

  const best = useMemo(() => {
    return [...metrics].sort((a, b) => b.acuracia - a.acuracia)[0] ?? null;
  }, [metrics]);

  if (loading) {
    return (
      <Layout
        title="Treinamento da IA"
        subtitle="Resultados reais do pipeline de treinamento"
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-3xl border border-border bg-card/50 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h2 className="text-xl font-semibold">Carregando treinamento...</h2>
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
      subtitle="Resultados reais dos modelos treinados no Python"
    >
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <GlassCard
            title="Status do treinamento"
            description="Pipeline finalizado com dados reais"
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                <CheckCircle2 className="h-3 w-3" />
                Online
              </span>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-xs text-muted-foreground">
                    Horizonte
                  </span>
                  <select
                    value={selectedHorizonte}
                    onChange={(e) => setSelectedHorizonte(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  >
                    {horizontes.map((h) => (
                      <option
                        key={h}
                        value={h}
                        className="bg-background text-foreground"
                      >
                        {formatHorizonte(h)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-xs text-muted-foreground">
                    Modelo
                  </span>
                  <select
                    value={selectedModelo}
                    onChange={(e) => setSelectedModelo(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  >
                    {modelosDisponiveis.map((m) => (
                      <option
                        key={m}
                        value={m}
                        className="bg-background text-foreground"
                      >
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Acurácia", `${formatNumber(selectedMetric?.acuracia)}%`],
                  ["MAE", formatNumber(selectedMetric?.mae, 4)],
                  ["RMSE", formatNumber(selectedMetric?.rmse, 4)],
                  ["R²", selectedMetric?.r2.toFixed(4) ?? "-"],
                  ["MAPE", `${formatNumber(selectedMetric?.mape)}%`],
                  ["sMAPE", `${formatNumber(selectedMetric?.smape)}%`],
                  ["Passos", String(selectedMetric?.passos ?? "-")],
                  ["Status", dashboard?.status_modelo ?? "Online"],
                ].map(([l, v]) => (
                  <div
                    key={l}
                    className="rounded-xl border border-border bg-card/40 px-3 py-2.5"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {l}
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold">{v}</p>
                  </div>
                ))}
              </div>

              {erro && <p className="text-sm text-red-400">{erro}</p>}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    downloadFile(
                      "/data/metricas_modelos.csv",
                      "metricas_modelos.csv"
                    );
                    toast.success("Métricas baixadas");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 text-sm font-medium hover:bg-card"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Baixar métricas
                </button>

                <button
                  onClick={() => {
                    downloadFile(
                      "/data/previsoes_modelos.csv",
                      "previsoes_modelos.csv"
                    );
                    toast.success("Previsões baixadas");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 text-sm font-medium hover:bg-card"
                >
                  <Download className="h-4 w-4" />
                  Baixar previsões
                </button>

                <button
                  onClick={() => toast.success("Modelo já está pronto para uso")}
                  className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  <Sparkles className="h-4 w-4" />
                  Usar modelo
                </button>
              </div>
            </div>
          </GlassCard>

          <GlassCard
            title="Melhor modelo"
            description="Ordenado pela maior acurácia"
            delay={0.1}
          >
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

            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["Total de resultados", metrics.length],
                ["Horizontes", horizontes.length],
                ["Modelos", new Set(metrics.map((m) => m.modelo)).size],
                ["Base", "continuous_dataset.csv"],
                ["Saída", "public/data"],
              ].map(([k, v]) => (
                <li
                  key={k}
                  className="flex items-center justify-between border-b border-border/60 pb-1.5 text-xs"
                >
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono font-medium">{v}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <GlassCard title="Ranking dos modelos no horizonte">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingHorizonte}>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis
                    dataKey="modelo"
                    stroke="oklch(0.72 0.025 260)"
                    fontSize={11}
                  />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <Tooltip {...tip} />
                  <Bar
                    dataKey="acuracia"
                    name="Acurácia (%)"
                    radius={[6, 6, 0, 0]}
                  >
                    {rankingHorizonte.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Comparativo entre horizontes">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparativoHorizontes}>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis
                    dataKey="horizonte"
                    stroke="oklch(0.72 0.025 260)"
                    fontSize={11}
                  />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="acuracia"
                    name="Melhor acurácia (%)"
                    fill={COLORS[0]}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Evolução do modelo por horizonte">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricasLinha}>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis
                    dataKey="horizonte"
                    stroke="oklch(0.72 0.025 260)"
                    fontSize={11}
                  />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="acuracia"
                    name="Acurácia"
                    stroke={COLORS[0]}
                    strokeWidth={2}
                    dot
                  />
                  <Line
                    type="monotone"
                    dataKey="rmse"
                    name="RMSE"
                    stroke={COLORS[1]}
                    strokeWidth={2}
                    dot
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Tabela de treinamentos">
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2">Modelo</th>
                    <th className="pb-2">Horizonte</th>
                    <th className="pb-2">MAE</th>
                    <th className="pb-2">RMSE</th>
                    <th className="pb-2">Acurácia</th>
                  </tr>
                </thead>

                <tbody>
                  {metrics.map((m, i) => (
                    <tr
                      key={`${m.modelo}-${m.horizonte}-${i}`}
                      className="border-b border-border/40"
                    >
                      <td className="py-2 font-medium">{m.modelo}</td>
                      <td className="py-2 text-muted-foreground">
                        {formatHorizonte(m.horizonte)}
                      </td>
                      <td className="py-2 font-mono">{m.mae.toFixed(4)}</td>
                      <td className="py-2 font-mono">{m.rmse.toFixed(4)}</td>
                      <td className="py-2 font-mono">
                        {m.acuracia.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </section>
      </div>
    </Layout>
  );
}