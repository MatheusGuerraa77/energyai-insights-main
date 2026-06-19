import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function GlassCard({
  title,
  description,
  action,
  children,
  className = "",
  delay = 0,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`rounded-2xl glass card-elevated p-5 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h3 className="truncate text-sm font-semibold tracking-tight">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.section>
  );
}
