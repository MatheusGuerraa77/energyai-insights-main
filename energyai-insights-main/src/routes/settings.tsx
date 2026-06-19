import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GlassCard } from "@/components/GlassCard";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — EnergyAI" }] }),
  component: SettingsPage,
});

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        on ? "bg-[image:var(--gradient-primary)]" : "bg-secondary"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/40 px-3 py-2.5">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

function SettingsPage() {
  return (
    <Layout title="Configurações" subtitle="Preferências e integrações do sistema">
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard title="Aparência">
          <div className="space-y-3">
            <Row label="Tema">
              <select className="rounded-lg border border-border bg-card/40 px-3 py-1.5 text-sm">
                <option>Dark (padrão)</option>
                <option>Light</option>
                <option>System</option>
              </select>
            </Row>
            <Row label="Idioma">
              <select className="rounded-lg border border-border bg-card/40 px-3 py-1.5 text-sm">
                <option>Português (BR)</option>
                <option>English</option>
                <option>Español</option>
              </select>
            </Row>
            <Row label="Densidade da interface">
              <select className="rounded-lg border border-border bg-card/40 px-3 py-1.5 text-sm">
                <option>Confortável</option>
                <option>Compacta</option>
              </select>
            </Row>
          </div>
        </GlassCard>

        <GlassCard title="Notificações">
          <div className="space-y-3">
            <Row label="Alertas de consumo"><Toggle defaultChecked /></Row>
            <Row label="Conclusão de treinamento"><Toggle defaultChecked /></Row>
            <Row label="Drift do modelo"><Toggle /></Row>
            <Row label="E-mails semanais"><Toggle defaultChecked /></Row>
          </div>
        </GlassCard>

        <GlassCard title="Integrações futuras (API)">
          <div className="space-y-3">
            <Row label="API URL">
              <input defaultValue="https://api.energyai.io" className="w-64 rounded-lg border border-border bg-card/40 px-3 py-1.5 text-sm" />
            </Row>
            <Row label="Token de acesso">
              <input type="password" defaultValue="••••••••••••" className="w-64 rounded-lg border border-border bg-card/40 px-3 py-1.5 text-sm" />
            </Row>
            <Row label="Webhook"><Toggle /></Row>
          </div>
        </GlassCard>

        <GlassCard title="Banco de Dados">
          <div className="space-y-3">
            <Row label="Provedor">
              <select className="rounded-lg border border-border bg-card/40 px-3 py-1.5 text-sm">
                <option>PostgreSQL</option>
                <option>MySQL</option>
                <option>SQLite</option>
              </select>
            </Row>
            <Row label="Host">
              <input defaultValue="db.energyai.io" className="w-64 rounded-lg border border-border bg-card/40 px-3 py-1.5 text-sm" />
            </Row>
            <Row label="Backup automático"><Toggle defaultChecked /></Row>
          </div>
        </GlassCard>

        <GlassCard title="Treinamento automático" className="lg:col-span-2">
          <div className="grid gap-3 md:grid-cols-3">
            <Row label="Schedule">
              <select className="rounded-lg border border-border bg-card/40 px-3 py-1.5 text-sm">
                <option>Diário (03:00)</option>
                <option>Semanal</option>
                <option>Manual</option>
              </select>
            </Row>
            <Row label="Retreinar com novos dados"><Toggle defaultChecked /></Row>
            <Row label="Threshold de drift">
              <input defaultValue="5%" className="w-24 rounded-lg border border-border bg-card/40 px-3 py-1.5 text-sm" />
            </Row>
          </div>
        </GlassCard>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={() => toast.success("Configurações salvas")}
          className="rounded-lg bg-[image:var(--gradient-primary)] px-5 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          Salvar configurações
        </button>
      </div>
    </Layout>
  );
}
