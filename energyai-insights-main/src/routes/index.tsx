import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { GlassCard } from "@/components/GlassCard";
import { InsightsPanel } from "@/components/InsightsPanel";
import { AIHealthPanel } from "@/components/AIHealthPanel";
import { Heatmap } from "@/components/Heatmap";
import { consumptionSeries, kpis, monthlyData } from "@/lib/mock-data";
import { Activity, Bolt, Sparkles, Wallet } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EnergyAI — Sistema Inteligente de Previsão de Energia" },
      { name: "description", content: "Dashboard SaaS de previsão de consumo de energia elétrica com redes neurais e IA." },
      { property: "og:title", content: "EnergyAI — Sistema Inteligente de Previsão de Energia" },
      { property: "og:description", content: "Plataforma de forecast energético com IA, dashboards e analytics em tempo real." },
    ],
  }),
  component: DashboardPage,
});

const ICONS = [Bolt, Sparkles, Wallet, Activity];

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

function DashboardPage() {
  return (
    <Layout title="EnergyAI" subtitle="Sistema Inteligente de Previsão do Consumo de Energia">
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-2xl glass card-elevated p-6 md:p-8">
          <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-bg)" }} />
          <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Modelo v1.0.3 · Online
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                <span className="text-gradient">EnergyAI</span> — previsão neural em tempo real
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Visão consolidada do consumo, previsões e saúde do modelo preditivo de energia.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-lg bg-[image:var(--gradient-primary)] px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]">
                Nova previsão
              </button>
              <button className="rounded-lg border border-border bg-card/40 px-4 py-2 text-sm font-medium hover:bg-card">
                Exportar relatório
              </button>
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
          <GlassCard className="xl:col-span-2" title="Consumo histórico vs previsto" description="Últimas 24 horas (kWh)" delay={0.1}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={consumptionSeries}>
                  <defs>
                    <linearGradient id="g-actual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.15 230)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.72 0.15 230)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-pred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.18 295)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.72 0.18 295)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="time" stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip {...tipStyle} />
                  <Area type="monotone" dataKey="actual" name="Real" stroke="oklch(0.72 0.15 230)" fill="url(#g-actual)" strokeWidth={2} />
                  <Area type="monotone" dataKey="predicted" name="Previsto" stroke="oklch(0.72 0.18 295)" fill="url(#g-pred)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <InsightsPanel delay={0.15} />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <GlassCard title="Consumo mensal" description="kWh por mês" delay={0.1}>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="month" stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip {...tipStyle} />
                  <Bar dataKey="consumo" fill="oklch(0.7 0.18 260)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Real x Previsto" description="Acurácia por hora" delay={0.15}>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={consumptionSeries}>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="time" stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip {...tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="actual" stroke="oklch(0.72 0.15 230)" strokeWidth={2} dot={false} name="Real" />
                  <Line type="monotone" dataKey="predicted" stroke="oklch(0.72 0.18 295)" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Previsto" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Mapa de calor por horário" description="Consumo médio semanal" delay={0.2}>
            <Heatmap />
          </GlassCard>
        </section>

        <AIHealthPanel delay={0.25} />
      </div>
    </Layout>
  );
}
