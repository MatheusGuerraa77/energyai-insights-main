import { insights } from "@/lib/mock-data";
import { GlassCard } from "./GlassCard";
import { AlertTriangle, Info, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const ICONS = {
  warning: AlertTriangle,
  info: Info,
  success: Sparkles,
} as const;

const TONES = {
  warning: "text-warning bg-warning/10 border-warning/20",
  info: "text-info bg-info/10 border-info/20",
  success: "text-success bg-success/10 border-success/20",
} as const;

export function InsightsPanel({ delay = 0 }: { delay?: number }) {
  return (
    <GlassCard
      delay={delay}
      title="Insights da IA"
      description="Recomendações geradas em tempo real"
    >
      <ul className="space-y-2.5">
        {insights.map((it, i) => {
          const Icon = ICONS[it.type];
          return (
            <motion.li
              key={it.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + i * 0.05 }}
              className="flex gap-3 rounded-xl border border-border bg-card/40 p-3"
            >
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${TONES[it.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{it.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{it.description}</p>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
