import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none tracking-normal",
  {
    variants: {
      variant: {
        default:
          "border-brand-500/20 bg-brand-500/10 text-brand-600 dark:text-brand-300 font-semibold",
        secondary:
          "border-border/60 bg-muted/70 text-muted-foreground",
        success:
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold",
        warning:
          "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold",
        destructive:
          "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300 font-semibold",
        purple:
          "border-purple-500/25 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold",
        cyan:
          "border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold",
        outline:
          "border-border/80 text-foreground bg-transparent",
      },
      size: {
        default: "text-xs px-2.5 py-0.5",
        sm: "text-[10px] px-2 py-0.5 font-medium leading-tight",
        lg: "text-xs px-3 py-1 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
