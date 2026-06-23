import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/charts")({
  head: () => ({ meta: [{ title: "Gráficos da IA — EnergyAI" }] }),
  component: ChartsPage,
});

const graficos = [
  "grafico_energyai_v2_1_hora.png",
  "grafico_energyai_v2_6_horas.png",
  "grafico_energyai_v2_12_horas.png",
  "grafico_energyai_v2_24_horas.png",
  "grafico_energyai_v3_1_hora.png",
  "grafico_energyai_v3_6_horas.png",
  "grafico_energyai_v3_12_horas.png",
  "grafico_energyai_v3_24_horas.png",
  "grafico_energyai_v4_1_hora.png",
  "grafico_energyai_v4_6_horas.png",
  "grafico_energyai_v4_12_horas.png",
  "grafico_energyai_v4_24_horas.png",
  "grafico_energyai_v5_1_hora.png",
  "grafico_energyai_v5_6_horas.png",
  "grafico_energyai_v5_12_horas.png",
  "grafico_energyai_v5_24_horas.png",
  "grafico_energyai_v6_1_hora.png",
  "grafico_energyai_v6_6_horas.png",
  "grafico_energyai_v6_12_horas.png",
  "grafico_energyai_v6_24_horas.png",
  "grafico_energyai_v7_1_hora.png",
  "grafico_energyai_v7_6_horas.png",
  "grafico_energyai_v7_12_horas.png",
];

function getVersao(nome: string) {
  return nome.match(/v\d+/)?.[0].toUpperCase() ?? "Outros";
}

function getHorizonte(nome: string) {
  if (nome.includes("1_hora")) return "1 hora";
  if (nome.includes("6_horas")) return "6 horas";
  if (nome.includes("12_horas")) return "12 horas";
  if (nome.includes("24_horas")) return "24 horas";
  return "Outro";
}

function getTitulo(nome: string) {
  return `${getVersao(nome)} · ${getHorizonte(nome)}`;
}

function ChartsPage() {
  const [versao, setVersao] = useState("Todos");
  const [horizonte, setHorizonte] = useState("Todos");

  const versoes = useMemo(() => {
    return ["Todos", ...Array.from(new Set(graficos.map(getVersao)))];
  }, []);

  const horizontes = ["Todos", "1 hora", "6 horas", "12 horas", "24 horas"];

  const filtrados = useMemo(() => {
    return graficos.filter((g) => {
      const matchVersao = versao === "Todos" || getVersao(g) === versao;
      const matchHorizonte =
        horizonte === "Todos" || getHorizonte(g) === horizonte;

      return matchVersao && matchHorizonte;
    });
  }, [versao, horizonte]);

  return (
    <Layout
      title="Gráficos da IA"
      subtitle="Comparação visual dos modelos EnergyAI por versão e horizonte"
    >
      <div className="space-y-6">
        <GlassCard title="Filtros">
          <div className="flex flex-wrap gap-3">
            <select
              value={versao}
              onChange={(e) => setVersao(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {versoes.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <select
              value={horizonte}
              onChange={(e) => setHorizonte(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {horizontes.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </GlassCard>

        <section className="grid gap-4 lg:grid-cols-2">
          {filtrados.map((grafico) => (
            <GlassCard
              key={grafico}
              title={getTitulo(grafico)}
              description={grafico}
            >
              <div className="overflow-hidden rounded-xl border border-border bg-white p-2">
                <img
                  src={`/graficos/${grafico}`}
                  alt={getTitulo(grafico)}
                  className="h-auto w-full rounded-lg"
                  loading="lazy"
                />
              </div>
            </GlassCard>
          ))}
        </section>
      </div>
    </Layout>
  );
}