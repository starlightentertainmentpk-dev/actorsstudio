import { CheckCircle2 } from "lucide-react"

export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (!verified) return null
  return (
    <span className="inline-flex items-center gap-1 bg-brand-500/10 text-brand-400 border border-brand-500/30 rounded-full px-2 py-0.5 text-xs font-medium">
      <CheckCircle2 className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400" />
      Verified
    </span>
  )
}
