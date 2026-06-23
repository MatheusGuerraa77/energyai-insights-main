import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/predictions")({
  head: () => ({ meta: [{ title: "Previsões — EnergyAI" }] }),
  component: PredictionsPage,
});

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
  smape: number;
  acuracia: number;
};

type ForecastRow = {
  horizonte: string;
  modelo: string;
  passo: number;
  hora?: string;
  data?: string;
  real: number;
  previsto: number;
};

const COLORS = [
  "oklch(0.72 0.15 230)",
  "oklch(0.72 0.18 295)",
  "oklch(0.74 0.17 155)",
  "oklch(0.8 0.16 75)",
];

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

function parseCSV(text: string): Record<string, string>[] {
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
    const mape = Number(obj.mape ?? 0);
    const r2 = Number(obj.r2 ?? 0);

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

function parsePrevisoesCSV(text: string): ForecastRow[] {
  return parseCSV(text).map((obj, index) => ({
    horizonte: obj.horizonte ?? "-",
    modelo: obj.modelo ?? "Modelo",
    passo: Number(obj.passo ?? obj.passos ?? index + 1),
    hora: obj.hora ?? obj.datetime ?? obj.data ?? String(index + 1),
    data: obj.data ?? obj.datetime ?? "",
    real: Number(obj.real ?? obj.y_real ?? obj.consumo_real ?? 0),
    previsto: Number(obj.previsto ?? obj.y_pred ?? obj.previsao ?? 0),
  }));
}

function formatHorizonte(h: string) {
  return h.replaceAll("_", " ");
}

function formatNumber(value?: number, digits = 2) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function PredictionsPage() {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [metricas, setMetricas] = useState<MetricRow[]>([]);
  const [previsoes, setPrevisoes] = useState<ForecastRow[]>([]);
  const [selectedHorizonte, setSelectedHorizonte] = useState("");
  const [selectedModelo, setSelectedModelo] = useState("");
  const [result, setResult] = useState<MetricRow | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarDadosIA() {
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
        setMetricas(metricasParsed);
        setPrevisoes(previsoesParsed);

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
          setResult(melhor);
        }
      } catch (error) {
        console.error(error);
        setErro(
          "Não foi possível carregar metricas_modelos.csv e previsoes_modelos.csv."
        );
      } finally {
        setLoading(false);
      }
    }

    carregarDadosIA();
  }, []);

  const horizontes = useMemo(() => {
    return Array.from(new Set(metricas.map((m) => m.horizonte)));
  }, [metricas]);

  const modelosDisponiveis = useMemo(() => {
    return metricas
      .filter((m) => m.horizonte === selectedHorizonte)
      .map((m) => m.modelo);
  }, [metricas, selectedHorizonte]);

  const metricaSelecionada = useMemo(() => {
    return (
      metricas.find(
        (m) => m.horizonte === selectedHorizonte && m.modelo === selectedModelo
      ) ?? null
    );
  }, [metricas, selectedHorizonte, selectedModelo]);

  useEffect(() => {
    if (!modelosDisponiveis.includes(selectedModelo) && modelosDisponiveis[0]) {
      setSelectedModelo(modelosDisponiveis[0]);
    }
  }, [modelosDisponiveis, selectedModelo]);

  const previsoesSelecionadas = useMemo(() => {
    return previsoes.filter(
      (p) => p.horizonte === selectedHorizonte && p.modelo === selectedModelo
    );
  }, [previsoes, selectedHorizonte, selectedModelo]);

  const chart = useMemo(() => {
    return previsoesSelecionadas.slice(-48).map((item, index) => ({
      h: item.hora ?? `${index + 1}`,
      real: Number(item.real.toFixed(2)),
      previsto: Number(item.previsto.toFixed(2)),
      erro: Number(Math.abs(item.real - item.previsto).toFixed(2)),
    }));
  }, [previsoesSelecionadas]);

  const previsaoCalculada = useMemo(() => {
    if (previsoesSelecionadas.length === 0) return 0;

    const ultimas = previsoesSelecionadas.slice(-24);
    const soma = ultimas.reduce((acc, item) => acc + item.previsto, 0);

    return Number(soma.toFixed(2));
  }, [previsoesSelecionadas]);

  const rankingHorizonte = useMemo(() => {
    return metricas
      .filter((m) => m.horizonte === selectedHorizonte)
      .sort((a, b) => b.acuracia - a.acuracia)
      .map((m) => ({
        name: m.modelo,
        acuracia: Number(m.acuracia.toFixed(2)),
        rmse: Number(m.rmse.toFixed(4)),
      }));
  }, [metricas, selectedHorizonte]);

  const comparativoHorizontes = useMemo(() => {
    return horizontes.map((h) => {
      const melhor = metricas
        .filter((m) => m.horizonte === h)
        .sort((a, b) => b.acuracia - a.acuracia)[0];

      return {
        horizonte: formatHorizonte(h),
        acuracia: melhor ? Number(melhor.acuracia.toFixed(2)) : 0,
      };
    });
  }, [horizontes, metricas]);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    setCalculating(true);

    setTimeout(() => {
      setResult(metricaSelecionada);
      setCalculating(false);
    }, 400);
  }

  if (loading) {
    return (
      <Layout
        title="Previsões"
        subtitle="Compare todos os horizontes e modelos treinados pela IA"
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-3xl border border-border bg-card/50 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h2 className="text-xl font-semibold">Carregando previsões...</h2>
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
      title="Previsões"
      subtitle="Compare todos os horizontes e modelos treinados pela IA"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <GlassCard
          title="Configuração da previsão"
          description="Escolha horizonte e modelo treinado"
        >
          <form onSubmit={handle} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">
                  Horizonte da previsão
                </span>

                <select
                  value={selectedHorizonte}
                  onChange={(e) => setSelectedHorizonte(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card/40 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                >
                  {horizontes.map((h) => (
                    <option key={h} value={h}>
                      {formatHorizonte(h)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs text-muted-foreground">
                  Modelo
                </span>

                <select
                  value={selectedModelo}
                  onChange={(e) => setSelectedModelo(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card/40 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                >
                  {modelosDisponiveis.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              {[
                ["Demanda atual", `${formatNumber(dashboard?.consumo_atual)} kWh`],
                ["Previsão acumulada", `${formatNumber(previsaoCalculada)} kWh`],
                ["MAE", metricaSelecionada?.mae.toFixed(4) ?? "-"],
                ["RMSE", metricaSelecionada?.rmse.toFixed(4) ?? "-"],
                ["R²", metricaSelecionada?.r2.toFixed(4) ?? "-"],
                ["MAPE", `${metricaSelecionada?.mape.toFixed(2) ?? "0.00"}%`],
                ["sMAPE", `${metricaSelecionada?.smape.toFixed(2) ?? "0.00"}%`],
                [
                  "Acurácia",
                  `${metricaSelecionada?.acuracia.toFixed(2) ?? "0.00"}%`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-border bg-card/40 px-3 py-2"
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {erro && <p className="text-sm text-red-400">{erro}</p>}

            <button
              type="submit"
              disabled={calculating || !metricaSelecionada}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-primary)] px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {calculating ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Calculando previsão…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar previsão com IA
                </>
              )}
            </button>
          </form>
        </GlassCard>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key={`${result.modelo}-${result.horizonte}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard title="Resultado da previsão">
                  <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                    <div className="relative grid h-32 w-32 place-items-center">
                      <svg className="h-32 w-32 -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="oklch(1 0 0 / 8%)"
                          strokeWidth="10"
                          fill="none"
                        />

                        <motion.circle
                          cx="64"
                          cy="64"
                          r="56"
                          stroke="url(#grad)"
                          strokeWidth="10"
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 56}
                          initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                          animate={{
                            strokeDashoffset:
                              2 *
                              Math.PI *
                              56 *
                              (1 - Math.min(result.acuracia, 100) / 100),
                          }}
                          transition={{ duration: 1 }}
                        />

                        <defs>
                          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={COLORS[0]} />
                            <stop offset="100%" stopColor={COLORS[1]} />
                          </linearGradient>
                        </defs>
                      </svg>

                      <div className="absolute inset-0 grid place-items-center text-center">
                        <div>
                          <p className="text-2xl font-bold">
                            {result.acuracia.toFixed(2)}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            acurácia
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Previsão — {formatHorizonte(result.horizonte)}
                      </p>

                      <p className="text-4xl font-bold tracking-tight text-gradient">
                        {formatNumber(previsaoCalculada)} kWh
                      </p>

                      <p className="mt-2 text-xs text-muted-foreground">
                        Modelo: <strong>{result.modelo}</strong> · RMSE:{" "}
                        <strong>{result.rmse.toFixed(4)}</strong> · MAPE:{" "}
                        <strong>{result.mape.toFixed(2)}%</strong>
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <div className="mt-4">
                  <GlassCard title="Curva real x prevista">
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chart}>
                          <CartesianGrid
                            stroke="oklch(1 0 0 / 6%)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="h"
                            stroke="oklch(0.72 0.025 260)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="oklch(0.72 0.025 260)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "oklch(0.21 0.025 265 / 0.95)",
                              border: "1px solid oklch(1 0 0 / 10%)",
                              borderRadius: 12,
                              fontSize: 12,
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Area
                            type="monotone"
                            dataKey="real"
                            name="Real"
                            stroke={COLORS[0]}
                            fill={COLORS[0]}
                            fillOpacity={0.18}
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="previsto"
                            name="Previsto"
                            stroke={COLORS[1]}
                            fill={COLORS[1]}
                            fillOpacity={0.16}
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GlassCard>
                  <div className="grid place-items-center py-16 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] glow">
                      <Sparkles className="h-6 w-6 text-primary-foreground" />
                    </div>

                    <h3 className="mt-4 text-base font-semibold">
                      Previsão ainda não gerada
                    </h3>

                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Escolha o horizonte e clique em{" "}
                      <strong>Gerar previsão com IA</strong>.
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <GlassCard title="Ranking dos modelos no horizonte selecionado">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankingHorizonte}>
                <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                <XAxis dataKey="name" stroke="oklch(0.72 0.025 260)" fontSize={11} />
                <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.025 265 / 0.95)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="acuracia" name="Acurácia (%)" radius={[6, 6, 0, 0]}>
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
                <XAxis dataKey="horizonte" stroke="oklch(0.72 0.025 260)" fontSize={11} />
                <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.025 265 / 0.95)",
                    border: "1px solid oklch(1 0 0 / 10%)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="acuracia"
                  name="Melhor acurácia (%)"
                  fill={COLORS[1]}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}