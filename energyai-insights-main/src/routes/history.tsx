import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { trainingHistory } from "@/lib/mock-data";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Histórico — EnergyAI" }] }),
  component: HistoryPage,
});

const statusTone: Record<string, string> = {
  Sucesso: "bg-success/10 text-success border-success/20",
  Falhou: "bg-destructive/10 text-destructive border-destructive/20",
  "Em andamento": "bg-info/10 text-info border-info/20",
};

function HistoryPage() {
  return (
    <Layout title="Histórico" subtitle="Todos os treinamentos realizados">
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 font-medium">Modelo</th>
                <th className="pb-3 font-medium">Data</th>
                <th className="pb-3 font-medium">Tempo</th>
                <th className="pb-3 font-medium">Loss</th>
                <th className="pb-3 font-medium">MAE</th>
                <th className="pb-3 font-medium">RMSE</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {trainingHistory.map((t) => (
                <tr key={t.id} className="border-b border-border/40 transition-colors hover:bg-card/40">
                  <td className="py-3">
                    <div className="font-medium">{t.model}</div>
                    <div className="text-[11px] text-muted-foreground">#{t.id}</div>
                  </td>
                  <td className="py-3 text-muted-foreground">{t.date}</td>
                  <td className="py-3 font-mono">{t.duration}</td>
                  <td className="py-3 font-mono">{t.loss.toFixed(4)}</td>
                  <td className="py-3 font-mono">{t.mae}</td>
                  <td className="py-3 font-mono">{t.rmse}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusTone[t.status]}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/40 px-2.5 py-1.5 text-xs hover:bg-card">
                      <Eye className="h-3.5 w-3.5" /> Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </Layout>
  );
}
