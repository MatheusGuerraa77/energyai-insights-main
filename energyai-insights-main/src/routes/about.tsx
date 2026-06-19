import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { Github, Globe } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "Sobre — EnergyAI" }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <Layout title="Sobre o Projeto" subtitle="Visão, arquitetura e equipe">
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard title="Objetivo" className="lg:col-span-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            O <strong className="text-foreground">EnergyAI</strong> é uma plataforma SaaS de previsão
            inteligente de consumo de energia elétrica utilizando redes neurais recorrentes (LSTM).
            Auxilia distribuidoras, indústrias e comércios a otimizar custos, prever picos de
            demanda e tomar decisões baseadas em dados.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Sustentabilidade", "Smart Grid", "MLOps", "Forecasting", "Energy Analytics"].map((t) => (
              <span key={t} className="rounded-full border border-border bg-card/40 px-3 py-1 text-[11px] text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Links">
          <div className="space-y-2">
            <a href="#" className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm hover:bg-card">
              <Github className="h-4 w-4" /> Repositório GitHub
            </a>
            <a href="#" className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm hover:bg-card">
              <Globe className="h-4 w-4" /> Landing oficial
            </a>
          </div>
        </GlassCard>

        <GlassCard title="Tecnologias">
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {["React 19", "TypeScript", "TanStack Start", "TailwindCSS v4", "Framer Motion", "Recharts", "Shadcn/UI", "Python", "FastAPI", "TensorFlow", "PostgreSQL", "Docker"].map((t) => (
              <li key={t} className="rounded-lg border border-border bg-card/40 px-3 py-1.5 text-center text-xs">
                {t}
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard title="Arquitetura" className="lg:col-span-2">
          <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 p-4 text-[11px] leading-relaxed text-muted-foreground">
{`┌────────────┐    HTTPS    ┌─────────────┐    SQL    ┌────────────┐
│  Frontend  │ ──────────▶ │   FastAPI   │ ────────▶ │ PostgreSQL │
│  React UI  │ ◀────────── │   Python    │ ◀──────── │   Cluster  │
└────────────┘   JSON      └─────┬───────┘           └────────────┘
                                  │
                                  ▼
                          ┌──────────────┐
                          │ Modelo LSTM  │
                          │  TensorFlow  │
                          └──────────────┘`}
          </pre>
        </GlassCard>

        <GlassCard title="Fluxo do sistema">
          <ol className="space-y-2 text-sm">
            {[
              "Ingestão de dados em tempo real",
              "Pré-processamento e normalização",
              "Inferência via modelo LSTM",
              "Pós-processamento e cache",
              "Distribuição via API e Dashboard",
            ].map((s, i) => (
              <li key={s} className="flex items-start gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-[11px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ol>
        </GlassCard>

        <GlassCard title="Cronograma" className="lg:col-span-2">
          <div className="space-y-3">
            {[
              ["Fase 1", "Levantamento e dataset", "Concluída"],
              ["Fase 2", "Modelagem LSTM", "Concluída"],
              ["Fase 3", "Frontend SaaS", "Em andamento"],
              ["Fase 4", "Integração FastAPI", "Planejada"],
              ["Fase 5", "Deploy e monitoramento", "Planejada"],
            ].map(([f, d, s]) => (
              <div key={f} className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{f}</p>
                  <p className="text-xs text-muted-foreground">{d}</p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] ${
                  s === "Concluída"
                    ? "border-success/20 bg-success/10 text-success"
                    : s === "Em andamento"
                      ? "border-info/20 bg-info/10 text-info"
                      : "border-border bg-card/60 text-muted-foreground"
                }`}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Equipe">
          {["Ana Souza · Data Science", "Lucas Martins · Backend", "Júlia Reis · Frontend", "Pedro Lima · MLOps"].map((m, i) => (
            <div key={m} className="flex items-center gap-3 py-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-xs font-semibold text-primary-foreground">
                {m.split(" ")[0][0]}{m.split(" ")[1][0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{m.split(" · ")[0]}</p>
                <p className="text-[11px] text-muted-foreground">{m.split(" · ")[1]}</p>
              </div>
              {i === 0 && (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">Lead</span>
              )}
            </div>
          ))}
        </GlassCard>
      </div>
    </Layout>
  );
}
