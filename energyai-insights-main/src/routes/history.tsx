import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { Eye, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Histórico — EnergyAI" }] }),
  component: HistoryPage,
});

type TrainingRow = {
  modelo: string;
  horizonte: string;
  passos: string;
  mae: string;
  rmse: string;
  r2: string;
  mape: string;
  smape?: string;
  acuracia?: string;
};

const statusTone: Record<string, string> = {
  Excelente: "bg-success/10 text-success border-success/20",
  Bom: "bg-info/10 text-info border-info/20",
  Atenção: "bg-warning/10 text-warning border-warning/20",
};

function parseCSV(text: string): TrainingRow[] {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim());

  return lines.filter(Boolean).map((line) => {
    const values = line.split(",").map((v) => v.trim());

    return headers.reduce((obj, header, index) => {
      obj[header as keyof TrainingRow] = values[index] ?? "";
      return obj;
    }, {} as TrainingRow);
  });
}

async function carregarHistorico(): Promise<TrainingRow[]> {
  const response = await fetch("/data/metricas_modelos.csv");

  if (!response.ok) {
    throw new Error("Não encontrou metricas_modelos.csv");
  }

  const csv = await response.text();
  return parseCSV(csv);
}

function getAcuracia(row: TrainingRow) {
  const acuracia = Number(row.acuracia ?? 0);
  const r2 = Number(row.r2 ?? 0);
  const mape = Number(row.mape ?? 0);

  if (acuracia > 0) return acuracia;
  if (r2 > 0) return r2 * 100;

  return Math.max(0, 100 - mape);
}

function getStatus(acuracia: number) {
  if (acuracia >= 85) return "Excelente";
  if (acuracia >= 70) return "Bom";
  return "Atenção";
}

function formatHorizonte(value: string) {
  return value?.replaceAll("_", " ") || "-";
}

function HistoryPage() {
  const [history, setHistory] = useState<TrainingRow[]>([]);
  const [selected, setSelected] = useState<TrainingRow | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const data = await carregarHistorico();

        const ordenado = [...data].sort(
          (a, b) => getAcuracia(b) - getAcuracia(a)
        );

        setHistory(ordenado);
        setSelected(ordenado[0] ?? null);
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar o histórico real da IA.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const resumo = useMemo(() => {
    const total = history.length;
    const melhor = history[0];
    const media =
      total > 0
        ? history.reduce((acc, item) => acc + getAcuracia(item), 0) / total
        : 0;

    return {
      total,
      melhor,
      media,
    };
  }, [history]);

  if (loading) {
    return (
      <Layout
        title="Histórico"
        subtitle="Todos os treinamentos realizados pela IA"
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-3xl border border-border bg-card/50 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h2 className="text-xl font-semibold">Carregando histórico...</h2>
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
      title="Histórico"
      subtitle="Todos os treinamentos realizados pela IA"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <GlassCard title="Treinamentos">
            <p className="text-3xl font-bold">{resumo.total}</p>
            <p className="text-sm text-muted-foreground">
              Modelos e horizontes registrados
            </p>
          </GlassCard>

          <GlassCard title="Melhor resultado">
            <p className="text-3xl font-bold text-gradient">
              {resumo.melhor ? `${getAcuracia(resumo.melhor).toFixed(2)}%` : "-"}
            </p>
            <p className="text-sm text-muted-foreground">
              {resumo.melhor
                ? `${resumo.melhor.modelo} · ${formatHorizonte(
                    resumo.melhor.horizonte
                  )}`
                : "Sem dados"}
            </p>
          </GlassCard>

          <GlassCard title="Média geral">
            <p className="text-3xl font-bold">{resumo.media.toFixed(2)}%</p>
            <p className="text-sm text-muted-foreground">
              Média de acurácia dos modelos
            </p>
          </GlassCard>
        </div>

        {selected && (
          <GlassCard
            title="Detalhes do treinamento selecionado"
            description={`${selected.modelo} · ${formatHorizonte(
              selected.horizonte
            )}`}
          >
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                ["Acurácia", `${getAcuracia(selected).toFixed(2)}%`],
                ["MAE", Number(selected.mae).toFixed(4)],
                ["RMSE", Number(selected.rmse).toFixed(4)],
                ["R²", Number(selected.r2).toFixed(4)],
                ["MAPE", `${Number(selected.mape).toFixed(2)}%`],
                ["sMAPE", `${Number(selected.smape ?? 0).toFixed(2)}%`],
                ["Passos", selected.passos],
                ["Status", getStatus(getAcuracia(selected))],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-border bg-card/40 px-3 py-3"
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        <GlassCard title="Histórico real dos modelos">
          {erro && <p className="mb-4 text-sm text-red-400">{erro}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Modelo</th>
                  <th className="pb-3 font-medium">Horizonte</th>
                  <th className="pb-3 font-medium">Passos</th>
                  <th className="pb-3 font-medium">MAE</th>
                  <th className="pb-3 font-medium">RMSE</th>
                  <th className="pb-3 font-medium">R²</th>
                  <th className="pb-3 font-medium">MAPE</th>
                  <th className="pb-3 font-medium">Acurácia</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium" />
                </tr>
              </thead>

              <tbody>
                {history.map((t, index) => {
                  const acuracia = getAcuracia(t);
                  const status = getStatus(acuracia);

                  return (
                    <tr
                      key={`${t.modelo}-${t.horizonte}-${index}`}
                      className="border-b border-border/40 transition-colors hover:bg-card/40"
                    >
                      <td className="py-3">
                        {index === 0 ? (
                          <span className="inline-flex items-center gap-1 text-warning">
                            <Trophy className="h-4 w-4" /> 1
                          </span>
                        ) : (
                          index + 1
                        )}
                      </td>

                      <td className="py-3">
                        <div className="font-medium">{t.modelo}</div>
                        <div className="text-[11px] text-muted-foreground">
                          treinamento #{index + 1}
                        </div>
                      </td>

                      <td className="py-3 text-muted-foreground">
                        {formatHorizonte(t.horizonte)}
                      </td>
                      <td className="py-3 font-mono">{t.passos}</td>
                      <td className="py-3 font-mono">
                        {Number(t.mae).toFixed(4)}
                      </td>
                      <td className="py-3 font-mono">
                        {Number(t.rmse).toFixed(4)}
                      </td>
                      <td className="py-3 font-mono">
                        {Number(t.r2).toFixed(4)}
                      </td>
                      <td className="py-3 font-mono">
                        {Number(t.mape).toFixed(2)}%
                      </td>
                      <td className="py-3 font-mono">
                        {acuracia.toFixed(2)}%
                      </td>

                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusTone[status]}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="py-3 text-right">
                        <button
                          onClick={() => setSelected(t)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/40 px-2.5 py-1.5 text-xs hover:bg-card"
                        >
                          <Eye className="h-3.5 w-3.5" /> Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}