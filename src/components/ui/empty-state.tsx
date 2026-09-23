import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import Link from "next/link"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-xl transition-all",
        compact ? "p-6" : "p-8 sm:p-10",
        !className?.includes("border-none") && !className?.includes("bg-transparent") && "border border-border/50 bg-card/50 backdrop-blur-xs",
        className
      )}
    >
      <div className={cn(
        "flex items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-3.5 ring-4 ring-brand-500/5",
        compact ? "h-10 w-10" : "h-12 w-12"
      )}>
        <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-foreground font-heading tracking-tight">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
        {description}
      </p>
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-4">
          {actionHref ? (
            <Link href={actionHref}>
              <Button size="sm" variant="default" className="font-semibold text-xs shadow-xs">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button size="sm" onClick={onAction} className="font-semibold text-xs shadow-xs">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

