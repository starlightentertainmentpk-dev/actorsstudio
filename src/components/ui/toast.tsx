"use client"

import * as React from "react"
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastItem {
  id: string
  title: string
  description?: string
  type?: ToastType
}

interface ToastContextType {
  toasts: ToastItem[]
  toast: (options: { title: string; description?: string; type?: ToastType; duration?: number }) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback(
    ({
      title,
      description,
      type = "info",
      duration = 4000,
    }: {
      title: string
      description?: string
      type?: ToastType
      duration?: number
    }) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newItem: ToastItem = { id, title, description, type }
      setToasts((prev) => [...prev, newItem])

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id)
        }, duration)
      }
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    return {
      toast: () => {},
      dismiss: () => {},
      toasts: [],
    }
  }
  return context
}

export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-destructive shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
    info: <Info className="h-4 w-4 text-brand-500 shrink-0" />,
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-border/80 bg-card/95 backdrop-blur-md shadow-xl text-card-foreground transition-all animate-in slide-in-from-bottom-2 fade-in"
          )}
        >
          {icons[t.type || "info"]}
          <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-semibold text-foreground leading-tight">
              {t.title}
            </h4>
            {t.description && (
              <p className="text-[11px] text-muted-foreground leading-normal">
                {t.description}
              </p>
            )}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
