import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  change,
  icon,
  delay = 0,
}: {
  label: string;
  value: string;
  change?: number;
  icon?: ReactNode;
  delay?: number;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl glass card-elevated p-5"
    >
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: "var(--gradient-primary)" }}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon && (
          <div className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card/60 text-primary">
            {icon}
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">{value}</p>
      {typeof change === "number" && change !== 0 && (
        <div
          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            positive
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {positive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {Math.abs(change)}%
          <span className="text-muted-foreground">vs ontem</span>
        </div>
      )}
    </motion.div>
  );
}
