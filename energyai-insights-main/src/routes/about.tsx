import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import {
  Brain,
  Database,
  Github,
  Globe,
  LineChart,
  Network,
  Server,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "Sobre — EnergyAI" }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <Layout title="Sobre o Projeto" subtitle="Visão, arquitetura e funcionamento da IA">
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard title="Objetivo do EnergyAI" className="lg:col-span-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            O <strong className="text-foreground">EnergyAI</strong> é um sistema inteligente para previsão
            de consumo de energia elétrica. O projeto utiliza dados históricos de consumo,
            técnicas de pré-processamento, engenharia de atributos e modelos de aprendizado de
            máquina para prever o comportamento energético e apoiar a tomada de decisão.
          </p>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A solução une uma IA treinada em <strong className="text-foreground">Python</strong> com um
            dashboard moderno em <strong className="text-foreground">React/TypeScript</strong>, permitindo
            visualizar métricas como MAE, RMSE, MAPE, R², consumo atual, previsão e economia estimada.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Previsão de Consumo",
              "Machine Learning",
              "Energy Analytics",
              "Dashboard SaaS",
              "Séries Temporais",
              "IA Aplicada",
            ].map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-card/40 px-3 py-1 text-[11px] text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Links">
          <div className="space-y-2">
            <a
              href="https://github.com/MatheusGuerraa77/energyai-insights-main"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm hover:bg-card"
            >
              <Github className="h-4 w-4" /> GitHub do projeto
            </a>

            <a
              href="#"
              className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2 text-sm hover:bg-card"
            >
              <Globe className="h-4 w-4" /> Dashboard EnergyAI
            </a>
          </div>
        </GlassCard>

        <GlassCard title="Tecnologias">
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {[
              "React",
              "TypeScript",
              "TanStack Router",
              "TailwindCSS",
              "Recharts",
              "Framer Motion",
              "Python",
              "Pandas",
              "Scikit-learn",
              "TensorFlow",
              "LSTM",
              "JSON/CSV",
            ].map((t) => (
              <li
                key={t}
                className="rounded-lg border border-border bg-card/40 px-3 py-1.5 text-center text-xs"
              >
                {t}
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard title="Modelos utilizados" className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: Brain,
                title: "LSTM",
                desc: "Rede neural recorrente usada para capturar padrões temporais do consumo.",
              },
              {
                icon: Network,
                title: "Random Forest",
                desc: "Modelo de ensemble usado como comparação robusta para regressão.",
              },
              {
                icon: Zap,
                title: "Extra Trees",
                desc: "Modelo baseado em árvores extremamente aleatórias para melhorar generalização.",
              },
              {
                icon: LineChart,
                title: "HistGradientBoosting",
                desc: "Modelo de boosting escolhido por desempenho e eficiência no treinamento.",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-border bg-card/40 p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold">{item.title}</p>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard title="Pipeline da IA">
          <ol className="space-y-2 text-sm">
            {[
              "Carregamento do dataset",
              "Tratamento de dados ausentes",
              "Criação de variáveis temporais",
              "Geração de lags e médias móveis",
              "Treinamento dos modelos",
              "Avaliação por MAE, RMSE, MAPE e R²",
              "Exportação para JSON/CSV",
              "Visualização no dashboard",
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

        <GlassCard title="Arquitetura" className="lg:col-span-2">
          <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 p-4 text-[11px] leading-relaxed text-muted-foreground">
{`┌────────────────────┐
│ Dataset de Energia  │
│ household_power.csv │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Python / Pandas     │
│ Limpeza + Features  │
└─────────┬──────────┘
          │
          ▼
┌──────────────────────────────┐
│ Modelos de IA                 │
│ LSTM, RF, ExtraTrees, HGB      │
└─────────┬────────────────────┘
          │
          ▼
┌────────────────────┐
│ Métricas e Previsões│
│ JSON + CSV          │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Frontend React      │
│ Dashboard Lovable   │
└────────────────────┘`}
          </pre>
        </GlassCard>

        <GlassCard title="Arquivos gerados">
          <ul className="space-y-2 text-sm">
            {[
              ["dashboard_data.json", "Resumo executivo da IA"],
              ["chart_data.json", "Série real x previsto"],
              ["metricas_modelos.csv", "Comparação dos modelos"],
              ["previsoes_modelos.csv", "Previsões completas"],
            ].map(([file, desc]) => (
              <li
                key={file}
                className="rounded-lg border border-border bg-card/40 px-3 py-2"
              >
                <p className="font-mono text-xs font-semibold">{file}</p>
                <p className="text-[11px] text-muted-foreground">{desc}</p>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard title="Cronograma" className="lg:col-span-2">
          <div className="space-y-3">
            {[
              ["Fase 1", "Escolha do dataset e estudo do problema", "Concluída"],
              ["Fase 2", "Treinamento dos modelos em Python", "Concluída"],
              ["Fase 3", "Geração de métricas e arquivos JSON/CSV", "Concluída"],
              ["Fase 4", "Integração com dashboard Lovable/React", "Concluída"],
              ["Fase 5", "Melhoria de acurácia e refinamento visual", "Em andamento"],
            ].map(([f, d, s]) => (
              <div
                key={f}
                className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium">{f}</p>
                  <p className="text-xs text-muted-foreground">{d}</p>
                </div>

                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] ${
                    s === "Concluída"
                      ? "border-success/20 bg-success/10 text-success"
                      : "border-info/20 bg-info/10 text-info"
                  }`}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard title="Equipe">
          {[
            ["Arthur Arantes", "Desenvolvimento IA e Dashboard"],
            ["Python", "Modelagem e treinamento"],
            ["React", "Interface e visualização"],
            ["EnergyAI", "Projeto acadêmico"],
          ].map(([nome, papel], i) => (
            <div key={nome} className="flex items-center gap-3 py-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-xs font-semibold text-primary-foreground">
                {nome.slice(0, 2).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{nome}</p>
                <p className="text-[11px] text-muted-foreground">{papel}</p>
              </div>

              {i === 0 && (
                <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  Lead
                </span>
              )}
            </div>
          ))}
        </GlassCard>

        <GlassCard title="Diferenciais" className="lg:col-span-3">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              ["IA Real", "Modelos treinados em Python com métricas reais."],
              ["Dashboard SaaS", "Interface moderna, responsiva e profissional."],
              ["Comparação de Modelos", "Avaliação entre LSTM e modelos de ensemble."],
              ["Exportação", "Relatórios em JSON e CSV para análise externa."],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card/40 p-4"
              >
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
}