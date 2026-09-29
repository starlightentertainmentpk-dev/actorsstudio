import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-border/80 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 outline-none",
            "focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15",
            "disabled:cursor-not-allowed disabled:opacity-50",
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
Textarea.displayName = "Textarea"

export { Textarea }
