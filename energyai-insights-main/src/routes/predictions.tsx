import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { predictionsService } from "@/services/predictions.service";
import type { PredictionInput, PredictionResult } from "@/types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/predictions")({
  head: () => ({ meta: [{ title: "Previsões — EnergyAI" }] }),
  component: PredictionsPage,
});

const fields = [
  { name: "temperature", label: "Temperatura (°C)", default: 24 },
  { name: "humidity", label: "Umidade (%)", default: 65 },
  { name: "windSpeed", label: "Velocidade do vento (km/h)", default: 12 },
  { name: "hour", label: "Hora (0-23)", default: 19 },
  { name: "prevConsumption", label: "Consumo anterior (kWh)", default: 480 },
] as const;

const selects = [
  { name: "weekday", label: "Dia da semana", options: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] },
  { name: "month", label: "Mês", options: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"] },
  { name: "consumerType", label: "Tipo de consumidor", options: ["Residencial", "Comercial", "Industrial", "Rural"] },
] as const;

function PredictionsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [form, setForm] = useState<Record<string, string | number | boolean>>({
    temperature: 24, humidity: 65, windSpeed: 12, hour: 19, prevConsumption: 480,
    weekday: "Sexta", month: "Jun", consumerType: "Residencial", holiday: false,
  });

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await predictionsService.predict(form as unknown as PredictionInput);
    setResult(r);
    setLoading(false);
  };

  const chartData = result
    ? Array.from({ length: 12 }, (_, i) => ({
        h: `+${i}h`,
        v: Math.round(result.value * (0.9 + 0.2 * Math.sin((i / 12) * Math.PI * 2) + Math.random() * 0.03)),
      }))
    : [];

  return (
    <Layout title="Previsões" subtitle="Gere previsões de consumo com a rede neural treinada">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <GlassCard title="Parâmetros de entrada" description="Preencha as variáveis do modelo">
          <form onSubmit={handle} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <label key={f.name} className="block">
                  <span className="mb-1 block text-xs text-muted-foreground">{f.label}</span>
                  <input
                    type="number"
                    defaultValue={f.default}
                    onChange={(e) => setForm((s) => ({ ...s, [f.name]: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-border bg-card/40 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                  />
                </label>
              ))}
              {selects.map((s) => (
                <label key={s.name} className="block">
                  <span className="mb-1 block text-xs text-muted-foreground">{s.label}</span>
                  <select
                    onChange={(e) => setForm((st) => ({ ...st, [s.name]: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-card/40 px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                  >
                    {s.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
              ))}
              <label className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  onChange={(e) => setForm((s) => ({ ...s, holiday: e.target.checked }))}
                  className="h-4 w-4 rounded border-border bg-transparent accent-primary"
                />
                Feriado
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--gradient-primary)] px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Calculando previsão…
                </>
              ) : (
                <><Sparkles className="h-4 w-4" /> Prever Consumo</>
              )}
            </button>
          </form>
        </GlassCard>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <GlassCard title="Resultado da previsão">
                  <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                    <div className="relative grid h-32 w-32 place-items-center">
                      <svg className="h-32 w-32 -rotate-90">
                        <circle cx="64" cy="64" r="56" stroke="oklch(1 0 0 / 8%)" strokeWidth="10" fill="none" />
                        <motion.circle
                          cx="64" cy="64" r="56"
                          stroke="url(#grad)" strokeWidth="10" strokeLinecap="round" fill="none"
                          strokeDasharray={2 * Math.PI * 56}
                          initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - result.confidence / 100) }}
                          transition={{ duration: 1 }}
                        />
                        <defs>
                          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="oklch(0.72 0.15 230)" />
                            <stop offset="100%" stopColor="oklch(0.72 0.18 295)" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 grid place-items-center text-center">
                        <div>
                          <p className="text-2xl font-bold">{result.confidence}%</p>
                          <p className="text-[10px] text-muted-foreground">confiança</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Previsão</p>
                      <p className="text-4xl font-bold tracking-tight text-gradient">{result.value} kWh</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Faixa esperada: <strong>{result.rangeMin}</strong> – <strong>{result.rangeMax}</strong> kWh · Probabilidade {result.probability}%
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <div className="mt-4">
                  <GlassCard title="Curva prevista (12h)">
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="g-pred2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="oklch(0.72 0.18 295)" stopOpacity={0.6} />
                              <stop offset="100%" stopColor="oklch(0.72 0.18 295)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                          <XAxis dataKey="h" stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: "oklch(0.21 0.025 265 / 0.95)",
                              border: "1px solid oklch(1 0 0 / 10%)",
                              borderRadius: 12,
                              fontSize: 12,
                            }}
                          />
                          <Area type="monotone" dataKey="v" stroke="oklch(0.72 0.18 295)" fill="url(#g-pred2)" strokeWidth={2} />
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
                    <h3 className="mt-4 text-base font-semibold">Nenhuma previsão gerada</h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Preencha os parâmetros ao lado e clique em <strong>Prever Consumo</strong> para visualizar o resultado da IA.
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
