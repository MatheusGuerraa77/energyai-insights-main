import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import {
  consumerSplit, consumptionSeries, monthlyData, radarData, scatterData,
} from "@/lib/mock-data";
import { Heatmap } from "@/components/Heatmap";

export const Route = createFileRoute("/analysis")({
  head: () => ({ meta: [{ title: "Análise de Dados — EnergyAI" }] }),
  component: AnalysisPage,
});

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

function AnalysisPage() {
  return (
    <Layout title="Análise de Dados" subtitle="Explore o dataset com múltiplas visualizações">
      <div className="space-y-6">
        <GlassCard title="Filtros">
          <div className="grid gap-3 md:grid-cols-5">
            {[
              { l: "Período", o: ["Últimos 7 dias", "30 dias", "12 meses", "Tudo"] },
              { l: "Cidade", o: ["São Paulo", "Rio", "BH", "Curitiba", "Todas"] },
              { l: "Ano", o: ["2026", "2025", "2024", "2023"] },
              { l: "Tipo consumidor", o: ["Todos", "Residencial", "Comercial", "Industrial"] },
              { l: "Temperatura", o: ["Toda", "< 20°C", "20-30°C", "> 30°C"] },
            ].map((f) => (
              <label key={f.l} className="block">
                <span className="mb-1 block text-xs text-muted-foreground">{f.l}</span>
                <select className="w-full rounded-lg border border-border bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary">
                  {f.o.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
            ))}
          </div>
        </GlassCard>

        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard title="Linha — Consumo 24h">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={consumptionSeries}>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="time" stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip {...tip} />
                  <Line dataKey="actual" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Barras — Consumo mensal">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="month" stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip {...tip} />
                  <Bar dataKey="consumo" fill={COLORS[1]} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Área — Tendência">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="a-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[2]} stopOpacity={0.6} />
                      <stop offset="100%" stopColor={COLORS[2]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" vertical={false} />
                  <XAxis dataKey="month" stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.72 0.025 260)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip {...tip} />
                  <Area type="monotone" dataKey="previsto" stroke={COLORS[2]} fill="url(#a-area)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Pizza — Tipo de consumidor">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={consumerSplit} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3}>
                    {consumerSplit.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Heatmap — Consumo semanal">
            <Heatmap />
          </GlassCard>

          <GlassCard title="Scatter — Temperatura x Consumo">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid stroke="oklch(1 0 0 / 6%)" />
                  <XAxis type="number" dataKey="temp" name="Temp" stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <YAxis type="number" dataKey="consumo" name="kWh" stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <ZAxis range={[40, 120]} />
                  <Tooltip {...tip} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter data={scatterData} fill={COLORS[3]} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Radar — Comparativo de modelos">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="oklch(1 0 0 / 10%)" />
                  <PolarAngleAxis dataKey="metric" stroke="oklch(0.72 0.025 260)" fontSize={11} />
                  <PolarRadiusAxis stroke="oklch(0.72 0.025 260)" fontSize={10} />
                  <Radar dataKey="A" stroke={COLORS[0]} fill={COLORS[0]} fillOpacity={0.3} />
                  <Radar dataKey="B" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.2} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard title="Boxplot — Distribuição diária">
            <div className="grid h-56 place-items-end">
              <div className="flex h-full w-full items-end justify-around gap-3 px-4">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, i) => {
                  const h = 40 + Math.random() * 50;
                  const off = Math.random() * 20;
                  return (
                    <div key={d} className="flex flex-col items-center gap-1.5">
                      <div className="relative w-6" style={{ height: `${h + off}%` }}>
                        <div className="absolute inset-x-0 top-0 h-px bg-muted-foreground" />
                        <div
                          className="absolute inset-x-1 rounded-sm"
                          style={{ top: `${off / 2}%`, bottom: 0, background: COLORS[i % COLORS.length], opacity: 0.7 }}
                        />
                        <div className="absolute inset-x-0 bottom-0 h-px bg-muted-foreground" />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}
