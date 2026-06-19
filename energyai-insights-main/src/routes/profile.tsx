import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { Mail, MapPin, Shield } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Perfil — EnergyAI" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <Layout title="Perfil" subtitle="Informações da conta e preferências">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <GlassCard>
          <div className="flex flex-col items-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-[image:var(--gradient-primary)] text-xl font-bold text-primary-foreground glow">
              AL
            </div>
            <h3 className="mt-3 text-base font-semibold">Ana Lima</h3>
            <p className="text-xs text-muted-foreground">Data Scientist · Admin</p>
            <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
              {[["84k", "Previsões"], ["14", "Treinos"], ["97%", "Acurácia"]].map(([v, l]) => (
                <div key={l} className="rounded-lg border border-border bg-card/40 py-2">
                  <p className="text-sm font-bold">{v}</p>
                  <p className="text-[10px] text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard title="Dados pessoais">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Nome completo", "Ana Carolina Lima"],
                ["E-mail", "ana.lima@energyai.io"],
                ["Telefone", "+55 (11) 99999-0000"],
                ["Cargo", "Data Scientist"],
                ["Departamento", "Inteligência Artificial"],
                ["Localização", "São Paulo, BR"],
              ].map(([l, v]) => (
                <label key={l} className="block">
                  <span className="mb-1 block text-xs text-muted-foreground">{l}</span>
                  <input defaultValue={v} className="w-full rounded-lg border border-border bg-card/40 px-3 py-2 text-sm outline-none focus:border-primary" />
                </label>
              ))}
            </div>
          </GlassCard>

          <GlassCard title="Segurança">
            <div className="space-y-2 text-sm">
              {[
                { icon: Shield, l: "Autenticação 2FA", v: "Ativada" },
                { icon: Mail, l: "E-mail verificado", v: "Sim" },
                { icon: MapPin, l: "Último acesso", v: "Hoje, 14:32 · São Paulo" },
              ].map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.l} className="flex items-center gap-3 rounded-lg border border-border bg-card/40 px-3 py-2.5">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="flex-1">{r.l}</span>
                    <span className="text-muted-foreground">{r.v}</span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </Layout>
  );
}
