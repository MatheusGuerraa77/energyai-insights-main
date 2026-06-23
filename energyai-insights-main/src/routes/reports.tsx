import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { Eye, FileSpreadsheet, FileText, Table2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Relatórios — EnergyAI" }] }),
  component: ReportsPage,
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

async function carregarDashboardData(): Promise<DashboardData> {
  const response = await fetch("/data/dashboard_data.json");

  if (!response.ok) {
    throw new Error("Erro ao carregar dashboard_data.json");
  }

  return response.json();
}

function downloadFile(path: string, name: string) {
  const link = document.createElement("a");
  link.href = path;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

function gerarRelatorioJSON(dashboard: DashboardData | null) {
  if (!dashboard) {
    toast.error("Dados ainda não carregados");
    return;
  }

  const relatorio = {
    titulo: "Relatório Executivo EnergyAI",
    gerado_em: new Date().toISOString(),
    resumo: {
      modelo: dashboard.melhor_modelo,
      horizonte: dashboard.horizonte,
      status: dashboard.status_modelo,
      consumo_atual_kwh: dashboard.consumo_atual,
      previsao_24h_kwh: dashboard.previsao_24h,
      economia_estimada_reais: dashboard.economia_estimada,
    },
    metricas: {
      mae: dashboard.mae,
      rmse: dashboard.rmse,
      r2: dashboard.r2,
      mape: dashboard.mape,
      smape: dashboard.smape ?? null,
      acuracia: dashboard.acuracia,
    },
    conclusao:
      dashboard.acuracia >= 85
        ? "O modelo apresenta alta confiabilidade para apoiar decisões energéticas."
        : dashboard.acuracia >= 70
          ? "O modelo apresenta desempenho utilizável, mas pode ser aprimorado."
          : "O modelo precisa de novos ajustes antes de uso em produção.",
  };

  const blob = new Blob([JSON.stringify(relatorio, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  downloadFile(url, "relatorio_energyai.json");
  URL.revokeObjectURL(url);

  toast.success("Relatório executivo gerado");
}

function ReportsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        const data = await carregarDashboardData();
        setDashboard(data);
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar os dados reais do relatório.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  const reports = useMemo(() => {
    return [
      {
        name: "Resumo Executivo da IA",
        date: new Date().toLocaleDateString("pt-BR"),
        size: "JSON",
        action: () => downloadFile("/data/dashboard_data.json", "dashboard_data.json"),
      },
      {
        name: "Métricas dos Modelos",
        date: new Date().toLocaleDateString("pt-BR"),
        size: "CSV",
        action: () =>
          downloadFile("/data/metricas_modelos.csv", "metricas_modelos.csv"),
      },
      {
        name: "Previsões dos Modelos",
        date: new Date().toLocaleDateString("pt-BR"),
        size: "CSV",
        action: () =>
          downloadFile("/data/previsoes_modelos.csv", "previsoes_modelos.csv"),
      },
      {
        name: `Relatório Executivo ${dashboard?.melhor_modelo ?? "IA"}`,
        date: new Date().toLocaleDateString("pt-BR"),
        size: "Gerado",
        action: () => gerarRelatorioJSON(dashboard),
      },
    ];
  }, [dashboard]);

  const precisao = dashboard?.acuracia ?? 0;
  const erroPercentual = dashboard?.mape ?? 0;

  if (loading) {
    return (
      <Layout
        title="Relatórios"
        subtitle="Gere e exporte relatórios analíticos reais da IA"
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-3xl border border-border bg-card/50 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h2 className="text-xl font-semibold">Carregando relatórios...</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Buscando métricas reais do modelo.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Relatórios"
      subtitle="Gere e exporte relatórios analíticos reais da IA"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <GlassCard title="Exportar relatório">
          {erro && <p className="mb-3 text-sm text-red-400">{erro}</p>}

          <div className="grid gap-2 sm:grid-cols-3">
            {[
              {
                i: FileText,
                l: "Resumo JSON",
                t: "json",
                action: () => {
                  downloadFile("/data/dashboard_data.json", "dashboard_data.json");
                  toast.success("Resumo JSON baixado");
                },
              },
              {
                i: FileSpreadsheet,
                l: "Métricas CSV",
                t: "csv",
                action: () => {
                  downloadFile("/data/metricas_modelos.csv", "metricas_modelos.csv");
                  toast.success("Métricas CSV baixadas");
                },
              },
              {
                i: Table2,
                l: "Previsões CSV",
                t: "csv",
                action: () => {
                  downloadFile("/data/previsoes_modelos.csv", "previsoes_modelos.csv");
                  toast.success("Previsões CSV baixadas");
                },
              },
            ].map((b) => (
              <button
                key={b.l}
                onClick={b.action}
                className="group rounded-xl border border-border bg-card/40 p-4 text-left transition-colors hover:bg-card"
              >
                <b.i className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">Exportar {b.l}</p>
                <p className="text-[11px] text-muted-foreground">.{b.t}</p>
              </button>
            ))}
          </div>

          <button
            onClick={() => gerarRelatorioJSON(dashboard)}
            className="mt-4 w-full rounded-xl bg-[image:var(--gradient-primary)] px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01]"
          >
            Gerar relatório executivo real
          </button>

          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Relatórios disponíveis
            </p>

            {reports.map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {r.date} · {r.size}
                  </p>
                </div>

                <button
                  onClick={r.action}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/40 px-2.5 py-1.5 text-xs hover:bg-card"
                >
                  <Eye className="h-3.5 w-3.5" /> Baixar
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard
          title="Preview"
          description={`Relatório de Previsão — ${dashboard?.melhor_modelo ?? "IA"}`}
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-white p-8 text-slate-900 shadow-inner">
            <div className="border-b border-slate-200 pb-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                EnergyAI · Relatório executivo
              </p>
              <h2 className="mt-1 text-xl font-bold">Previsão de Consumo</h2>
              <p className="text-xs text-slate-500">
                Modelo: {dashboard?.melhor_modelo ?? "Carregando"}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-xs leading-relaxed text-slate-700">
                O modelo <strong>{dashboard?.melhor_modelo ?? "IA"}</strong>{" "}
                realizou a previsão de consumo energético com horizonte de{" "}
                <strong>{dashboard?.horizonte ?? "-"}</strong>. O consumo atual
                registrado foi de{" "}
                <strong>{formatNumber(dashboard?.consumo_atual)} kWh</strong>,
                enquanto a previsão consolidada atingiu{" "}
                <strong>{formatNumber(dashboard?.previsao_24h)} kWh</strong>. A
                precisão aproximada do modelo foi de{" "}
                <strong>{formatNumber(precisao)}%</strong>, com erro MAPE de{" "}
                <strong>{formatNumber(erroPercentual)}%</strong>.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-2">
                {[
                  ["Consumo", `${formatNumber(dashboard?.consumo_atual)} kWh`],
                  ["Previsto", `${formatNumber(dashboard?.previsao_24h)} kWh`],
                  ["Economia", formatCurrency(dashboard?.economia_estimada)],
                ].map(([l, v]) => (
                  <div key={l} className="rounded border border-slate-200 p-2 text-center">
                    <p className="text-[9px] uppercase text-slate-500">{l}</p>
                    <p className="text-sm font-bold">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded bg-gradient-to-tr from-slate-200 to-slate-100 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">
                  Métricas do modelo
                </p>

                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <p>
                    MAE: <strong>{formatNumber(dashboard?.mae, 4)}</strong>
                  </p>
                  <p>
                    RMSE: <strong>{formatNumber(dashboard?.rmse, 4)}</strong>
                  </p>
                  <p>
                    R²: <strong>{dashboard?.r2?.toFixed(4) ?? "-"}</strong>
                  </p>
                  <p>
                    MAPE: <strong>{formatNumber(dashboard?.mape)}%</strong>
                  </p>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-4 gap-1">
                {[
                  dashboard?.consumo_atual ?? 0,
                  dashboard?.previsao_24h ?? 0,
                  dashboard?.economia_estimada ?? 0,
                  dashboard?.acuracia ?? 0,
                  dashboard?.mae ?? 0,
                  dashboard?.rmse ?? 0,
                  dashboard?.mape ?? 0,
                  (dashboard?.r2 ?? 0) * 100,
                ].map((v, i) => (
                  <div
                    key={i}
                    className="rounded bg-slate-200"
                    style={{
                      height: `${Math.min(60, 18 + Number(v))}px`,
                    }}
                  />
                ))}
              </div>
            </div>

            <p className="absolute bottom-6 right-6 text-[9px] text-slate-400">
              Página 1 / 1
            </p>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}