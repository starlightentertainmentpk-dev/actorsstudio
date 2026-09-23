import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-lg border border-border/80 bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 outline-none",
            "focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-9",
            error && "border-destructive focus:border-destructive focus:ring-destructive/15 text-destructive",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          {...props}
        />
        {typeof error === "string" && (
          <p className="text-[11px] font-medium text-destructive mt-1">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
