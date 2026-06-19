import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { Eye, FileSpreadsheet, FileText, Table2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Relatórios — EnergyAI" }] }),
  component: ReportsPage,
});

const reports = [
  { name: "Consumo Mensal — Junho/2026", date: "19/06/2026", size: "2,1 MB" },
  { name: "Performance do Modelo LSTM v1.0.3", date: "18/06/2026", size: "812 KB" },
  { name: "Análise de Pico Industrial", date: "16/06/2026", size: "1,4 MB" },
  { name: "Comparativo Trimestral", date: "10/06/2026", size: "3,2 MB" },
];

function ReportsPage() {
  return (
    <Layout title="Relatórios" subtitle="Gere e exporte relatórios analíticos">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <GlassCard title="Exportar relatório">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { i: FileText, l: "PDF", t: "pdf" },
              { i: FileSpreadsheet, l: "Excel", t: "xlsx" },
              { i: Table2, l: "CSV", t: "csv" },
            ].map((b) => (
              <button
                key={b.l}
                onClick={() => toast.success(`Relatório ${b.l} gerado`)}
                className="group rounded-xl border border-border bg-card/40 p-4 text-left transition-colors hover:bg-card"
              >
                <b.i className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">Exportar {b.l}</p>
                <p className="text-[11px] text-muted-foreground">.{b.t}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Relatórios recentes
            </p>
            {reports.map((r) => (
              <div key={r.name} className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.date} · {r.size}</p>
                </div>
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/40 px-2.5 py-1.5 text-xs hover:bg-card">
                  <Eye className="h-3.5 w-3.5" /> Ver
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Preview" description="Relatório de Consumo Mensal — Junho/2026">
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-white p-8 text-slate-900 shadow-inner">
            <div className="border-b border-slate-200 pb-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                EnergyAI · Relatório executivo
              </p>
              <h2 className="mt-1 text-xl font-bold">Consumo Mensal</h2>
              <p className="text-xs text-slate-500">Junho · 2026</p>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs leading-relaxed text-slate-700">
                O consumo total de energia em junho de 2026 atingiu
                <strong> 11.400 kWh</strong>, representando um aumento de
                <strong> 7,5%</strong> em relação ao mês anterior. O modelo neural
                LSTM v1.0.3 manteve precisão média de <strong>97,2%</strong>.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2">
                {[["Consumo", "11.400"], ["Previsto", "11.250"], ["Erro", "1,3%"]].map(([l, v]) => (
                  <div key={l} className="rounded border border-slate-200 p-2 text-center">
                    <p className="text-[9px] uppercase text-slate-500">{l}</p>
                    <p className="text-sm font-bold">{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 h-24 rounded bg-gradient-to-tr from-slate-200 to-slate-100" />
              <div className="mt-2 grid grid-cols-4 gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded bg-slate-200" style={{ height: `${20 + Math.random() * 30}px` }} />
                ))}
              </div>
            </div>
            <p className="absolute bottom-6 right-6 text-[9px] text-slate-400">Página 1 / 8</p>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}
