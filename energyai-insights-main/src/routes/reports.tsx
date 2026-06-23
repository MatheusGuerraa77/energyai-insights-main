import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import {
  Download,
  Eye,
  FileJson,
  FileSpreadsheet,
  FileText,
  Table2,
} from "lucide-react";
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
  datetime?: string;
  hora?: string;
  horizonte: string;
  modelo: string;
  real: number;
  previsto: number;
  erro_abs?: number;
};

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

function parseCSV(text: string) {
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
    const r2 = Number(obj.r2 ?? 0);
    const mape = Number(obj.mape ?? 0);

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
  return parseCSV(text).map((obj) => ({
    datetime: obj.datetime,
    hora: obj.hora,
    horizonte: obj.horizonte ?? "-",
    modelo: obj.modelo ?? "Modelo",
    real: Number(obj.real ?? 0),
    previsto: Number(obj.previsto ?? 0),
    erro_abs: Number(obj.erro_abs ?? Math.abs(Number(obj.real ?? 0) - Number(obj.previsto ?? 0))),
  }));
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

function formatHorizonte(value?: string) {
  return String(value ?? "-").replaceAll("_", " ");
}

function downloadFile(path: string, name: string) {
  const link = document.createElement("a");
  link.href = path;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function baixarJSON(nome: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  downloadFile(url, nome);
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [forecasts, setForecasts] = useState<ForecastRow[]>([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);

        const [dashboardJson, metricasCsv, previsoesCsv] = await Promise.all([
          getJson<DashboardData>("/data/dashboard_data.json"),
          getText("/data/metricas_modelos.csv"),
          getText("/data/previsoes_modelos.csv"),
        ]);

        setDashboard(dashboardJson);
        setMetrics(parseMetricasCSV(metricasCsv));
        setForecasts(parsePrevisoesCSV(previsoesCsv));
      } catch (error) {
        console.error(error);
        setErro("Não foi possível carregar os dados reais dos relatórios.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  const bestMetric = useMemo(() => {
    if (!metrics.length) return null;

    return (
      metrics.find(
        (m) =>
          m.modelo === dashboard?.melhor_modelo &&
          m.horizonte === dashboard?.horizonte
      ) ?? [...metrics].sort((a, b) => b.acuracia - a.acuracia)[0]
    );
  }, [metrics, dashboard]);

  const filteredForecasts = useMemo(() => {
    if (!bestMetric) return [];

    return forecasts.filter(
      (f) => f.modelo === bestMetric.modelo && f.horizonte === bestMetric.horizonte
    );
  }, [forecasts, bestMetric]);

  const previewRows = useMemo(() => {
    return filteredForecasts.slice(-12);
  }, [filteredForecasts]);

  const resumo = useMemo(() => {
    const base = filteredForecasts.slice(-24);

    const totalReal = base.reduce((acc, item) => acc + item.real, 0);
    const totalPrevisto = base.reduce((acc, item) => acc + item.previsto, 0);
    const erroMedio =
      base.length > 0
        ? base.reduce((acc, item) => acc + Math.abs(item.real - item.previsto), 0) /
          base.length
        : 0;

    return {
      totalReal,
      totalPrevisto,
      erroMedio,
      registros: filteredForecasts.length,
    };
  }, [filteredForecasts]);

  const relatorioExecutivo = useMemo(() => {
    return {
      titulo: "Relatório Executivo EnergyAI",
      gerado_em: new Date().toISOString(),
      modelo: bestMetric?.modelo ?? dashboard?.melhor_modelo ?? "-",
      horizonte: bestMetric?.horizonte ?? dashboard?.horizonte ?? "-",
      status: dashboard?.status_modelo ?? "-",
      resumo_24_registros: {
        consumo_real: Number(resumo.totalReal.toFixed(2)),
        consumo_previsto: Number(resumo.totalPrevisto.toFixed(2)),
        erro_medio: Number(resumo.erroMedio.toFixed(2)),
        economia_estimada: dashboard?.economia_estimada ?? 0,
      },
      metricas: {
        mae: bestMetric?.mae ?? dashboard?.mae ?? 0,
        rmse: bestMetric?.rmse ?? dashboard?.rmse ?? 0,
        r2: bestMetric?.r2 ?? dashboard?.r2 ?? 0,
        mape: bestMetric?.mape ?? dashboard?.mape ?? 0,
        smape: bestMetric?.smape ?? dashboard?.smape ?? 0,
        acuracia: bestMetric?.acuracia ?? dashboard?.acuracia ?? 0,
      },
    };
  }, [bestMetric, dashboard, resumo]);

  const reports = useMemo(() => {
    return [
      {
        name: "Resumo Executivo EnergyAI",
        date: new Date().toLocaleDateString("pt-BR"),
        size: "JSON",
        icon: FileJson,
        action: () => {
          baixarJSON("relatorio_energyai.json", relatorioExecutivo);
          toast.success("Relatório executivo gerado");
        },
      },
      {
        name: "Métricas dos Modelos",
        date: new Date().toLocaleDateString("pt-BR"),
        size: "CSV",
        icon: FileSpreadsheet,
        action: () => {
          downloadFile("/data/metricas_modelos.csv", "metricas_modelos.csv");
          toast.success("Métricas baixadas");
        },
      },
      {
        name: "Previsões dos Modelos",
        date: new Date().toLocaleDateString("pt-BR"),
        size: "CSV",
        icon: Table2,
        action: () => {
          downloadFile("/data/previsoes_modelos.csv", "previsoes_modelos.csv");
          toast.success("Previsões baixadas");
        },
      },
      {
        name: "Dashboard Data",
        date: new Date().toLocaleDateString("pt-BR"),
        size: "JSON",
        icon: FileText,
        action: () => {
          downloadFile("/data/dashboard_data.json", "dashboard_data.json");
          toast.success("Dashboard JSON baixado");
        },
      },
    ];
  }, [relatorioExecutivo]);

  if (loading) {
    return (
      <Layout title="Relatórios" subtitle="Gere e exporte relatórios analíticos reais">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-3xl border border-border bg-card/50 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h2 className="text-xl font-semibold">Carregando relatórios...</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Buscando dashboard, métricas e previsões reais.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Relatórios" subtitle="Gere e exporte relatórios analíticos reais">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Modelo", bestMetric?.modelo ?? "-"],
            ["Horizonte", formatHorizonte(bestMetric?.horizonte)],
            ["Acurácia", `${formatNumber(bestMetric?.acuracia)}%`],
            ["Registros", String(resumo.registros)],
          ].map(([label, value]) => (
            <GlassCard key={label}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="mt-2 truncate text-2xl font-bold">{value}</p>
            </GlassCard>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <GlassCard title="Central de exportação" description="Arquivos reais gerados pela IA">
            {erro && <p className="mb-3 text-sm text-red-400">{erro}</p>}

            <div className="grid gap-2 sm:grid-cols-2">
              {reports.map((r) => {
                const Icon = r.icon;

                return (
                  <button
                    key={r.name}
                    onClick={r.action}
                    className="group rounded-2xl border border-border bg-card/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
                    </div>

                    <p className="mt-4 text-sm font-semibold">{r.name}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {r.date} · {r.size}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Relatórios disponíveis
              </p>

              {reports.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between rounded-xl border border-border bg-card/40 px-3 py-2.5"
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
            title="Preview executivo"
            description={`Modelo ${bestMetric?.modelo ?? "-"} · ${formatHorizonte(
              bestMetric?.horizonte
            )}`}
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-white p-8 text-slate-900 shadow-inner">
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-100 blur-2xl" />
              <div className="relative border-b border-slate-200 pb-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  EnergyAI · Relatório executivo
                </p>
                <h2 className="mt-1 text-xl font-bold">Previsão de Consumo</h2>
                <p className="text-xs text-slate-500">
                  {new Date().toLocaleDateString("pt-BR")}
                </p>
              </div>

              <div className="relative mt-4 space-y-3">
                <p className="text-xs leading-relaxed text-slate-700">
                  O modelo <strong>{bestMetric?.modelo ?? "-"}</strong> foi
                  avaliado no horizonte de{" "}
                  <strong>{formatHorizonte(bestMetric?.horizonte)}</strong>. Nos
                  últimos registros analisados, o consumo real acumulado foi de{" "}
                  <strong>{formatNumber(resumo.totalReal)} kWh</strong> e a
                  previsão acumulada foi de{" "}
                  <strong>{formatNumber(resumo.totalPrevisto)} kWh</strong>.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[
                    ["Real", `${formatNumber(resumo.totalReal)} kWh`],
                    ["Previsto", `${formatNumber(resumo.totalPrevisto)} kWh`],
                    ["Erro médio", `${formatNumber(resumo.erroMedio)} kWh`],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded border border-slate-200 p-2 text-center">
                      <p className="text-[9px] uppercase text-slate-500">{l}</p>
                      <p className="text-sm font-bold">{v}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-500">
                    Métricas do modelo
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <p>MAE: <strong>{formatNumber(bestMetric?.mae, 4)}</strong></p>
                    <p>RMSE: <strong>{formatNumber(bestMetric?.rmse, 4)}</strong></p>
                    <p>R²: <strong>{bestMetric?.r2.toFixed(4) ?? "-"}</strong></p>
                    <p>MAPE: <strong>{formatNumber(bestMetric?.mape)}%</strong></p>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-12 items-end gap-1">
                  {previewRows.map((row, i) => {
                    const max = Math.max(...previewRows.map((r) => r.previsto), 1);
                    const h = 18 + (row.previsto / max) * 50;

                    return (
                      <div
                        key={`${row.modelo}-${row.horizonte}-${i}`}
                        className="rounded bg-slate-300"
                        style={{ height: `${h}px` }}
                        title={`${row.hora ?? i + 1} · ${formatNumber(row.previsto)} kWh`}
                      />
                    );
                  })}
                </div>
              </div>

              <p className="absolute bottom-6 right-6 text-[9px] text-slate-400">
                Página 1 / 1
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}