import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  CheckCircle2,
  Download,
  Play,
  RotateCw,
  Save,
  Sparkles,
} from "lucide-react";
import {
  CartesianGrid,
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

interface Metrics {
  epoch: number;
  loss: number;
  valLoss: number;
  mae: number;
  rmse: number;
}

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

const TOTAL_EPOCHS = 30;

async function carregarDashboardData(): Promise<DashboardData> {
  const response = await fetch("/data/dashboard_data.json");

  if (!response.ok) {
    throw new Error("Erro ao carregar dashboard_data.json");
  }

  return response.json();
}

function TrainingPage() {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [metrics, setMetrics] = useState<Metrics[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [erro, setErro] = useState("");

  const tRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        const data = await carregarDashboardData();
        setDashboard(data);
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar as métricas reais da IA.");
      }
    }

    carregarDados();
  }, []);

  const start = () => {
    setRunning(true);
    setCompleted(false);
    setMetrics([]);
    setElapsed(0);

    let e = 0;

    const finalMae = dashboard?.mae ?? 0.4;
    const finalRmse = dashboard?.rmse ?? 0.8;

    tRef.current = setInterval(() => {
      e += 1;

      setElapsed((p) => p + 0.4);

      setMetrics((prev) => {
        const decay = Math.exp(-e / 8);

        const loss = Math.max(0.001, finalRmse * decay + 0.01);
        const valLoss = Math.max(0.001, finalRmse * decay + 0.015);
        const mae = finalMae + 10 * decay;
        const rmse = finalRmse + 12 * decay;

        return [...prev, { epoch: e, loss, valLoss, mae, rmse }];
      });

      if (e >= TOTAL_EPOCHS) {
        if (tRef.current) clearInterval(tRef.current);

        setRunning(false);
        setCompleted(true);
        toast.success("Treinamento simulado concluído com métricas reais!");
      }
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (tRef.current) clearInterval(tRef.current);
    };
  }, []);

  const last = metrics[metrics.length - 1];
  const progress = (metrics.length / TOTAL_EPOCHS) * 100;
  const remaining = Math.max(0, (TOTAL_EPOCHS - metrics.length) * 0.18);

  const architecture = useMemo(() => {
    return [
      ["Modelo", dashboard?.melhor_modelo ?? "Carregando"],
      ["Horizonte", dashboard?.horizonte ?? "Carregando"],
      ["Status", dashboard?.status_modelo ?? "Carregando"],
      ["Loss Function", "MSE/RMSE"],
      ["MAE Final", dashboard?.mae?.toFixed(4) ?? "—"],
      ["RMSE Final", dashboard?.rmse?.toFixed(4) ?? "—"],
      ["MAPE", dashboard ? `${dashboard.mape}%` : "—"],
      ["Acurácia", dashboard ? `${dashboard.acuracia}%` : "—"],
    ];
  }, [dashboard]);

  return (
    <Layout
      title="Treinamento da IA"
      subtitle="Visualização do processo de treinamento com métricas reais"
    >
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <GlassCard
            title="Status do treinamento"
            description={
              running
                ? "Treinamento em execução…"
                : completed
                  ? "Modelo treinado e pronto para uso"
                  : "Aguardando início"
            }
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">
                <Brain className="h-3 w-3 text-primary" />
                {dashboard?.melhor_modelo ?? "Modelo IA"}
              </span>
            }
          >
            <div className="space-y-4">
              {erro && <p className="text-sm text-red-400">{erro}</p>}

              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Epoch {metrics.length} de {TOTAL_EPOCHS}
                  </span>
                  <span>{progress.toFixed(0)}%</span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full bg-[image:var(--gradient-primary)]"
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { l: "Loss", v: last?.loss.toFixed(4) ?? "—" },
                  { l: "Val Loss", v: last?.valLoss.toFixed(4) ?? "—" },
                  { l: "MAE", v: last?.mae.toFixed(4) ?? dashboard?.mae?.toFixed(4) ?? "—" },
                  { l: "RMSE", v: last?.rmse.toFixed(4) ?? dashboard?.rmse?.toFixed(4) ?? "—" },
                  { l: "MAPE", v: dashboard ? `${dashboard.mape}%` : "—" },
                  { l: "R²", v: dashboard?.r2?.toFixed(4) ?? "—" },
                  { l: "Acurácia", v: dashboard ? `${dashboard.acuracia}%` : "—" },
                  {
                    l: "Tempo",
                    v: `${elapsed.toFixed(1)}s / ~${(
                      elapsed + remaining
                    ).toFixed(1)}s`,
                  },
                ].map((m) => (
                  <div
                    key={m.l}
                    className="rounded-xl border border-border bg-card/40 px-3 py-2.5"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {m.l}
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold">
                      {m.v}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={start}
                  disabled={running || !dashboard}
                  className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
                >
                  {running ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Treinando…
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" /> Visualizar Treinamento
                    </>
                  )}
                </button>

                {completed && (
                  <>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 text-sm font-medium hover:bg-card">
                      <Save className="h-4 w-4" /> Modelo Salvo
                    </button>

                    <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 text-sm font-medium hover:bg-card">
                      <Download className="h-4 w-4" /> Exportar Relatório
                    </button>

                    <button
                      onClick={start}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 text-sm font-medium hover:bg-card"
                    >
                      <RotateCw className="h-4 w-4" /> Revisualizar
                    </button>

                    <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/40 px-4 py-2 text-sm font-medium hover:bg-card">
                      <Sparkles className="h-4 w-4" /> Usar Modelo
                    </button>
                  </>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard
            title="Arquitetura"
            description="Modelo treinado em Python"
            delay={0.1}
          >
            <ul className="space-y-2 text-sm">
              {architecture.map(([k, v]) => (
                <li
                  key={k}
                  className="flex items-center justify-between border-b border-border/60 pb-1.5 text-xs"
                >
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono font-medium text-right">{v}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {[
            { key: "loss", title: "Loss", color: "oklch(0.72 0.15 230)" },
            {
              key: "valLoss",
              title: "Validation Loss",
              color: "oklch(0.72 0.18 295)",
            },
            { key: "mae", title: "MAE", color: "oklch(0.74 0.17 155)" },
            { key: "rmse", title: "RMSE", color: "oklch(0.8 0.16 75)" },
          ].map((c, i) => (
            <GlassCard key={c.key} title={c.title} delay={i * 0.05}>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid
                      stroke="oklch(1 0 0 / 6%)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="epoch"
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

                    <Line
                      type="monotone"
                      dataKey={c.key}
                      stroke={c.color}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          ))}
        </section>

        <AnimatePresence>
          {completed && dashboard && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <GlassCard
                title="Treinamento concluído"
                description="Modelo salvo e pronto para uso no dashboard"
                action={
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                    <CheckCircle2 className="h-3 w-3" /> Sucesso
                  </span>
                }
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["Melhor Modelo", dashboard.melhor_modelo],
                    ["Horizonte", dashboard.horizonte],
                    ["Tempo Total", `${elapsed.toFixed(1)}s`],
                    ["Data / Hora", new Date().toLocaleString("pt-BR")],
                  ].map(([l, v]) => (
                    <div
                      key={l}
                      className="rounded-xl border border-border bg-card/40 px-3 py-3"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {l}
                      </p>
                      <p className="mt-1 text-sm font-semibold">{v}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}