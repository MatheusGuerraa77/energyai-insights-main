import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { Heatmap } from "@/components/Heatmap";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

export const Route = createFileRoute("/analysis")({
  head: () => ({ meta: [{ title: "Análise de Dados — EnergyAI" }] }),
  component: AnalysisPage,
});

const COLORS = [
  "oklch(0.72 0.15 230)",
  "oklch(0.72 0.18 295)",
  "oklch(0.74 0.17 155)",
  "oklch(0.8 0.16 75)",
  "oklch(0.65 0.18 25)",
];

const tip = {
  contentStyle: {
    background: "oklch(0.21 0.025 265 / 0.95)",
    border: "1px solid oklch(1 0 0 / 10%)",
    borderRadius: 12,
    fontSize: 12,
  },
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

type MetricRow = {
  modelo: string;
  horizonte: string;
  passos: number;
  mae: number;
  rmse: number;
  r2: number;
  mape: number;
  smape?: number;
  acuracia: number;
};

type PredictionRow = {
  modelo: string;
  horizonte: string;
  passo: number;
  hora?: string;
  data?: string;
  real: number;
  previsto: number;
};

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Erro ao carregar ${path}`);
  return response.json();
}

async function getText(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Erro ao carregar ${path}`);
  return response.text();
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

function normalizeText(value?: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ");
}

function normalizeHorizon(value?: string) {
  const text = normalizeText(value);

  if (text.includes("1") && (text.includes("hora") || text.includes("hour") || text === "1h")) {
    return "1 hora";
  }

  if (text.includes("6") && (text.includes("hora") || text.includes("hour") || text === "6h")) {
    return "6 horas";
  }

  if (text.includes("12") && (text.includes("hora") || text.includes("hour") || text === "12h")) {
    return "12 horas";
  }

  if (text.includes("24") && (text.includes("hora") || text.includes("hour") || text === "24h")) {
    return "24 horas";
  }

  if (text.includes("minuto") || text.includes("minute") || text.includes("min")) {
    return "1 minuto";
  }

  return text;
}

function sameModel(a?: string, b?: string) {
  return normalizeText(a) === normalizeText(b);
}

function sameHorizon(a?: string, b?: string) {
  return normalizeHorizon(a) === normalizeHorizon(b);
}

function parseMetricasCSV(text: string): MetricRow[] {
  return parseCSV(text).map((obj) => {
    const mape = Number(obj.mape ?? 0);
    const r2 = Number(obj.r2 ?? 0);

    return {
      modelo: obj.modelo ?? "-",
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

function parsePrevisoesCSV(text: string): PredictionRow[] {
  return parseCSV(text).map((obj, index) => ({
    modelo: obj.modelo ?? obj.model ?? "Modelo",
    horizonte: obj.horizonte ?? obj.horizon ?? "-",
    passo: Number(obj.passo ?? obj.passos ?? obj.step ?? index + 1),
    hora: obj.hora ?? obj.datetime ?? obj.data ?? obj.timestamp ?? String(index + 1),
    data: obj.data ?? obj.datetime ?? obj.timestamp ?? "",
    real: Number(obj.real ?? obj.y_real ?? obj.consumo_real ?? obj.actual ?? 0),
    previsto: Number(obj.previsto ?? obj.y_pred ?? obj.previsao ?? obj.predicted ?? 0),
  }));
}

function formatNumber(value?: number, digits = 2) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatHorizonte(value: string) {
  return normalizeHorizon(value)
    .replaceAll("_", " ")
    .replace(/^1 hora$/, "1 hora")
    .replace(/^6 horas$/, "6 horas")
    .replace(/^12 horas$/, "12 horas")
    .replace(/^24 horas$/, "24 horas");
}

function AnalysisPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [selectedHorizonte, setSelectedHorizonte] = useState("");
  const [selectedModelo, setSelectedModelo] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);

        const [dashboardJson, metricasCsv, previsoesCsv] = await Promise.all([
          getJson<DashboardData>("/data/dashboard_data.json"),
          getText("/data/metricas_modelos.csv"),
          getText("/data/previsoes_modelos.csv"),
        ]);

        const metricasParsed = parseMetricasCSV(metricasCsv);
        const previsoesParsed = parsePrevisoesCSV(previsoesCsv);

        setDashboard(dashboardJson);
        setMetrics(metricasParsed);
        setPredictions(previsoesParsed);

        const melhor =
          metricasParsed.find(
            (m) =>
              sameModel(m.modelo, dashboardJson.melhor_modelo) &&
              sameHorizon(m.horizonte, dashboardJson.horizonte)
          ) ??
          [...metricasParsed].sort((a, b) => b.acuracia - a.acuracia)[0];

        if (melhor) {
          setSelectedHorizonte(melhor.horizonte);
          setSelectedModelo(melhor.modelo);
        }
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar todos os dados reais da IA.");
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
      .filter((m) => sameHorizon(m.horizonte, selectedHorizonte))
      .map((m) => m.modelo);
  }, [metrics, selectedHorizonte]);

  useEffect(() => {
    if (
      modelosDisponiveis.length > 0 &&
      !modelosDisponiveis.some((m) => sameModel(m, selectedModelo))
    ) {
      setSelectedModelo(modelosDisponiveis[0]);
    }
  }, [modelosDisponiveis, selectedModelo]);

  const metricaSelecionada = useMemo(() => {
    return (
      metrics.find(
        (m) =>
          sameHorizon(m.horizonte, selectedHorizonte) &&
          sameModel(m.modelo, selectedModelo)
      ) ?? null
    );
  }, [metrics, selectedHorizonte, selectedModelo]);

  const previsoesFiltradas = useMemo(() => {
    return predictions.filter(
      (p) =>
        sameHorizon(p.horizonte, selectedHorizonte) &&
        sameModel(p.modelo, selectedModelo)
    );
  }, [predictions, selectedHorizonte, selectedModelo]);

  const series = useMemo(() => {
    return previsoesFiltradas.slice(-500).map((item, index) => {
      const erroAbs = Math.abs(item.real - item.previsto);
      const erroPercentual = item.real > 0 ? (erroAbs / item.real) * 100 : 0;

      return {
        time: item.hora ?? String(index + 1),
        modelo: item.modelo,
        horizonte: item.horizonte,
        real: Number(item.real.toFixed(3)),
        previsto: Number(item.previsto.toFixed(3)),
        erro: Number(erroAbs.toFixed(3)),
        erroPercentual: Number(erroPercentual.toFixed(2)),
      };
    });
  }, [previsoesFiltradas]);

  const resumoBars = useMemo(() => {
    const totalReal = series.reduce((s, item) => s + item.real, 0);
    const totalPrevisto = series.reduce((s, item) => s + item.previsto, 0);
    const erro = Math.abs(totalReal - totalPrevisto);

    return [
      { name: "Real", valor: Number(totalReal.toFixed(2)) },
      { name: "Previsto", valor: Number(totalPrevisto.toFixed(2)) },
      { name: "Erro", valor: Number(erro.toFixed(2)) },
    ];
  }, [series]);

  const distribuicaoIndicadores = useMemo(() => {
    return [
      { name: "Consumo real", value: Math.max(resumoBars[0]?.valor ?? 1, 1) },
      { name: "Consumo previsto", value: Math.max(resumoBars[1]?.valor ?? 1, 1) },
      { name: "Erro", value: Math.max(resumoBars[2]?.valor ?? 1, 1) },
    ];
  }, [resumoBars]);

  const rankingModelos = useMemo(() => {
    return metrics
      .filter((m) => sameHorizon(m.horizonte, selectedHorizonte))
      .sort((a, b) => b.acuracia - a.acuracia)
      .slice(0, 8)
      .map((m) => ({
        name: m.modelo,
        acuracia: Number(m.acuracia.toFixed(2)),
      }));
  }, [metrics, selectedHorizonte]);

  const radarData = useMemo(() => {
    const m = metricaSelecionada;

    return [
      { metric: "Acurácia", Modelo: m?.acuracia ?? 0, Referência: 80 },
      { metric: "R²", Modelo: Math.max(0, (m?.r2 ?? 0) * 100), Referência: 75 },
      { metric: "MAE", Modelo: Math.max(0, 100 - (m?.mae ?? 0) * 20), Referência: 70 },
      { metric: "RMSE", Modelo: Math.max(0, 100 - (m?.rmse ?? 0) * 20), Referência: 70 },
      { metric: "MAPE", Modelo: Math.max(0, 100 - (m?.mape ?? 0)), Referência: 80 },
    ];
  }, [metricaSelecionada]);

  if (loading) {
    return (
      <Layout title="Análise de Dados" subtitle="Visualização dos dados reais gerados pela IA">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-3xl border border-border bg-card/50 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h2 className="text-xl font-semibold">Carregando análise...</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Lendo métricas e previsões reais da IA.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Análise de Dados"
      subtitle="Escolha o horizonte e o modelo para atualizar todos os gráficos"
    >
      <div className="space-y-6">
        <GlassCard title="Configuração da análise">
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="mb-1 block text-xs text-muted-foreground">
                Horizonte
              </span>
              <select
                value={selectedHorizonte}
                onChange={(e) => setSelectedHorizonte(e.target.value)}
                className="w-full rounded-lg border border-border bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {horizontes.map((h) => (
                  <option key={h} value={h}>
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
                className="w-full rounded-lg border border-border bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {modelosDisponiveis.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}
        </GlassCard>

        <GlassCard title="Resumo do modelo selecionado">
          <div className="grid gap-3 md:grid-cols-5">
            {[
              ["Modelo", selectedModelo || "Carregando"],
              ["Horizonte", formatHorizonte(selectedHorizonte)],
              ["Acurácia", `${formatNumber(metricaSelecionada?.acuracia)}%`],
              ["R²", metricaSelecionada?.r2?.toFixed(4) ?? "-"],
              ["Registros", String(previsoesFiltradas.length)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card/40 px-3 py-3"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 truncate text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard title="Consumo real x previsto">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series}>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="time" interval="preserveStartEnd" minTickGap={60} stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line dataKey="real" name="Real" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                  <Line dataKey="previsto" name="Previsto" stroke={COLORS[1]} strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Resumo acumulado">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resumoBars}>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="name" stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <Tooltip {...tip} />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                    {resumoBars.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Tendência prevista">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="time" interval="preserveStartEnd" minTickGap={60} stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <Tooltip {...tip} />
                  <Area type="monotone" dataKey="previsto" name="Previsto" stroke={COLORS[2]} fill={COLORS[2]} fillOpacity={0.25} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Distribuição real x previsto x erro">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribuicaoIndicadores} dataKey="value" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={3}>
                    {distribuicaoIndicadores.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Heatmap — Consumo semanal">
            <Heatmap data={previsoesFiltradas} />
          </GlassCard>

          <GlassCard title="Dispersão — Real x Previsto">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" />
                  <XAxis type="number" dataKey="real" name="Real" stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <YAxis type="number" dataKey="previsto" name="Previsto" stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <ZAxis range={[40, 120]} />
                  <Tooltip {...tip} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={series.slice(-300)} fill={COLORS[3]} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Ranking dos modelos no horizonte">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingModelos} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" horizontal={false} />
                  <XAxis type="number" stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="oklch(0.72 0.025 260)" fontSize={10} width={140} />
                  <Tooltip {...tip} />
                  <Bar dataKey="acuracia" name="Acurácia %" fill={COLORS[0]} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Radar — Desempenho do modelo">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="oklch(1 0 0 / 10%)" />
                  <PolarAngleAxis dataKey="metric" stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <PolarRadiusAxis stroke="oklch(0.72 0.025 260)" fontSize={10} />
                  <Radar dataKey="Modelo" name="Modelo IA" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.3} />
                  <Radar dataKey="Referência" name="Referência" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.2} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}