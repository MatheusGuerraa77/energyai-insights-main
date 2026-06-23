import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { GlassCard } from "@/components/GlassCard";
import { InsightsPanel } from "@/components/InsightsPanel";
import { AIHealthPanel } from "@/components/AIHealthPanel";
import { Heatmap } from "@/components/Heatmap";
import {
  Activity,
  BarChart3,
  Bolt,
  Download,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";
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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EnergyAI — Sistema Inteligente de Previsão de Energia" },
      {
        name: "description",
        content:
          "Dashboard SaaS de previsão de consumo de energia elétrica com IA.",
      },
    ],
  }),
  component: DashboardPage,
});

const ICONS = [Bolt, Sparkles, Wallet, Activity];

const COLORS = [
  "oklch(0.72 0.15 230)",
  "oklch(0.72 0.18 295)",
  "oklch(0.74 0.17 155)",
  "oklch(0.8 0.16 75)",
];

const tipStyle = {
  contentStyle: {
    background: "oklch(0.21 0.025 265 / 0.95)",
    border: "1px solid oklch(1 0 0 / 10%)",
    borderRadius: 12,
    fontSize: 12,
    backdropFilter: "blur(12px)",
  },
  labelStyle: { color: "oklch(0.72 0.025 260)" },
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

type ChartData = {
  hora: string;
  real: number;
  previsto: number;
};

type ConsumptionPoint = {
  time: string;
  actual: number;
  predicted: number;
  erro: number;
};

async function carregarDashboardData(): Promise<DashboardData> {
  const response = await fetch("/data/dashboard_data.json");

  if (!response.ok) {
    throw new Error("Erro ao carregar dashboard_data.json");
  }

  return response.json();
}

async function carregarChartData(): Promise<ChartData[]> {
  const response = await fetch("/data/chart_data.json");

  if (!response.ok) {
    throw new Error("Erro ao carregar chart_data.json");
  }

  return response.json();
}

function formatNumber(value?: number, digits = 2) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatCurrency(value?: number) {
  return Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function downloadFile(path: string, name: string) {
  const link = document.createElement("a");
  link.href = path;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function DashboardPage() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDadosIA() {
      try {
        setLoading(true);
        setErro("");

        const [dashboardJson, chartJson] = await Promise.all([
          carregarDashboardData(),
          carregarChartData(),
        ]);

        setDashboard(dashboardJson);
        setChartData(chartJson);
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar os dados reais da IA.");
      } finally {
        setLoading(false);
      }
    }

    carregarDadosIA();
  }, []);

  const consumptionSeries: ConsumptionPoint[] = useMemo(() => {
    return chartData.map((item) => {
      const real = Number(item.real ?? 0);
      const previsto = Number(item.previsto ?? 0);
      const erroAbs = Math.abs(real - previsto);

      return {
        time: item.hora,
        actual: Number(real.toFixed(3)),
        predicted: Number(previsto.toFixed(3)),
        erro: Number(erroAbs.toFixed(3)),
      };
    });
  }, [chartData]);

  const resumoBars = useMemo(() => {
    const totalReal = chartData.reduce(
      (total, item) => total + Number(item.real ?? 0),
      0
    );

    const totalPrevisto = chartData.reduce(
      (total, item) => total + Number(item.previsto ?? 0),
      0
    );

    const erroTotal = Math.abs(totalReal - totalPrevisto);

    return [
      { name: "Real", valor: Number(totalReal.toFixed(2)) },
      { name: "Previsto", valor: Number(totalPrevisto.toFixed(2)) },
      { name: "Erro", valor: Number(erroTotal.toFixed(2)) },
    ];
  }, [chartData]);

  const metricasBars = useMemo(() => {
    if (!dashboard) return [];

    return [
      { name: "MAE", valor: Number(dashboard.mae.toFixed(3)) },
      { name: "RMSE", valor: Number(dashboard.rmse.toFixed(3)) },
      { name: "MAPE", valor: Number(dashboard.mape.toFixed(2)) },
    ];
  }, [dashboard]);

  const kpis = useMemo(() => {
    return [
      {
        label: "Consumo atual",
        value: `${formatNumber(dashboard?.consumo_atual)} kWh`,
        change: dashboard?.acuracia ?? 0,
      },
      {
        label: "Previsão 24h",
        value: `${formatNumber(dashboard?.previsao_24h)} kWh`,
        change: dashboard?.acuracia ?? 0,
      },
      {
        label: "Economia estimada",
        value: formatCurrency(dashboard?.economia_estimada),
        change: dashboard?.economia_estimada ?? 0,
      },
      {
        label: "Status do modelo",
        value: dashboard?.status_modelo ?? "Carregando",
        change: dashboard?.acuracia ?? 0,
      },
    ];
  }, [dashboard]);

  if (loading) {
    return (
      <Layout
        title="EnergyAI"
        subtitle="Sistema Inteligente de Previsão do Consumo de Energia"
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-3xl border border-border bg-card/50 p-8 text-center shadow-2xl backdrop-blur">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h2 className="text-xl font-semibold">Carregando IA...</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Buscando dados reais gerados pelo modelo Python.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="EnergyAI"
      subtitle="Sistema Inteligente de Previsão do Consumo de Energia"
    >
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card/50 p-6 shadow-2xl md:p-8">
          <div
            className="absolute inset-0 opacity-40"
            style={{ background: "var(--gradient-bg)" }}
          />

          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-info/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                Modelo IA · {dashboard?.status_modelo ?? "Indisponível"}
              </span>

              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
                <span className="text-gradient">EnergyAI</span> prevê consumo
                elétrico com IA
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                Dashboard conectado aos arquivos reais gerados pelo modelo em
                Python. Visualize consumo, previsão, erro, acurácia e saúde do
                modelo em uma interface SaaS premium.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  `Modelo: ${dashboard?.melhor_modelo ?? "IA"}`,
                  `Horizonte: ${dashboard?.horizonte ?? "-"}`,
                  `R²: ${dashboard?.r2?.toFixed(4) ?? "-"}`,
                  `MAPE: ${formatNumber(dashboard?.mape)}%`,
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border bg-background/40 px-3 py-1 text-[11px] text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-background/40 p-4 backdrop-blur">
                  <p className="text-xs text-muted-foreground">Precisão</p>
                  <p className="mt-1 text-2xl font-bold text-primary">
                    {formatNumber(dashboard?.acuracia)}%
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background/40 p-4 backdrop-blur">
                  <p className="text-xs text-muted-foreground">MAE</p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatNumber(dashboard?.mae, 3)}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-background/40 p-4 backdrop-blur">
                  <p className="text-xs text-muted-foreground">RMSE</p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatNumber(dashboard?.rmse, 3)}
                  </p>
                </div>
              </div>

              {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate({ to: "/predictions" })}
                  className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  <Zap className="h-4 w-4" />
                  Nova previsão
                </button>

                <button
                  onClick={() =>
                    downloadFile(
                      "/data/dashboard_data.json",
                      "dashboard_data.json"
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 text-sm font-medium hover:bg-card"
                >
                  <Download className="h-4 w-4" />
                  Exportar dados
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/40 p-4 backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Performance
                  </p>
                  <p className="text-lg font-semibold">
                    {formatNumber(dashboard?.acuracia)}% de precisão
                  </p>
                </div>

                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>

              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={consumptionSeries}>
                    <CartesianGrid
                      stroke="oklch(1 0 0 / 6%)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="time"
                      stroke="oklch(0.72 0.025 260)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="oklch(0.72 0.025 260)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip {...tipStyle} />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      name="Real"
                      stroke={COLORS[0]}
                      fill={COLORS[0]}
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="predicted"
                      name="Previsto"
                      stroke={COLORS[1]}
                      fill={COLORS[1]}
                      fillOpacity={0.16}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k, i) => {
            const Icon = ICONS[i];

            return (
              <StatCard
                key={k.label}
                label={k.label}
                value={k.value}
                change={k.change}
                icon={<Icon className="h-4 w-4" />}
                delay={i * 0.05}
              />
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <GlassCard
            className="xl:col-span-2"
            title="Consumo real vs previsto"
            description="Série temporal carregada da IA"
            delay={0.1}
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={consumptionSeries}>
                  <CartesianGrid
                    stroke="oklch(1 0 0 / 6%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
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
                  <Tooltip {...tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    name="Real"
                    stroke={COLORS[0]}
                    fill={COLORS[0]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
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

          <InsightsPanel delay={0.15} />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <GlassCard
            title="Resumo acumulado"
            description="Real, previsto e erro total"
            delay={0.1}
          >
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resumoBars}>
                  <CartesianGrid
                    stroke="oklch(1 0 0 / 6%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
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
                  <Tooltip {...tipStyle} />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                    {resumoBars.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard
            title="Erro por horário"
            description="Diferença real x previsto"
            delay={0.15}
          >
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={consumptionSeries}>
                  <CartesianGrid
                    stroke="oklch(1 0 0 / 6%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
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
                  <Tooltip {...tipStyle} />
                  <Line
                    type="monotone"
                    dataKey="erro"
                    stroke={COLORS[3]}
                    strokeWidth={2}
                    dot={false}
                    name="Erro"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard
            title="Métricas do modelo"
            description="Indicadores reais da IA"
            delay={0.2}
          >
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricasBars}>
                  <CartesianGrid
                    stroke="oklch(1 0 0 / 6%)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
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
                  <Tooltip {...tipStyle} />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                    {metricasBars.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <GlassCard
            className="xl:col-span-2"
            title="Mapa de calor por horário"
            description="Padrão de consumo baseado nas previsões"
            delay={0.15}
          >
            <Heatmap />
          </GlassCard>

          <AIHealthPanel delay={0.25} />
        </section>
      </div>
    </Layout>
  );
}