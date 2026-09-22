"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { withdrawApplication } from "@/app/(dashboard)/talent/casting/actions"
import { ApplyModal } from "@/components/features/applications/ApplyModal"
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

interface CastingApplyButtonProps {
  castingCallId: string
  castingCallTitle?: string
  initialApp: { id: string; status: string; applied_at: string } | null
  userRole: string | null
}

export function CastingApplyButton({
  castingCallId,
  castingCallTitle = "Casting Call",
  initialApp,
  userRole,
}: CastingApplyButtonProps) {
  const [app, setApp] = useState(initialApp)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState("")

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)

  // Check if they are already applied (and not withdrawn)
  const isApplied = app && app.status !== "withdrawn"

  const handleWithdraw = () => {
    if (!app) return
    if (!confirm("Are you sure you want to withdraw your application? This will remove you from the applicants list.")) return

    setErrorMsg("")
    startTransition(async () => {
      try {
        await withdrawApplication(app.id)
        setApp(null)
      } catch (err) {
        const errorVal = err as Error
        setErrorMsg(errorVal.message || "Failed to withdraw.")
      }
    })
  }

  // Case 1: Guest (Non-registered or not logged in)
  if (!userRole) {
    return (
      <div className="space-y-3 bg-brand-500/[0.03] border border-brand-500/20 p-4 rounded-2xl text-center">
        <div className="space-y-1">
          <p className="text-xs font-bold text-foreground">Talent Application Gate</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            This audition is publicly visible. Only registered talent with a profile portfolio can apply.
          </p>
        </div>
        <div className="space-y-2 pt-1">
          <a
            href={`/auth/login?next=/casting/${castingCallId}`}
            className="block w-full"
          >
            <Button className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold h-11 rounded-xl shadow-md shadow-brand-500/10 cursor-pointer text-xs">
              Log in to Apply
            </Button>
          </a>
          <a
            href={`/auth/register?role=talent&next=/casting/${castingCallId}`}
            className="block w-full"
          >
            <Button
              variant="outline"
              className="w-full border-border/80 text-foreground font-semibold h-9 rounded-xl hover:bg-muted text-xs cursor-pointer"
            >
              Register as Talent (Free)
            </Button>
          </a>
        </div>
      </div>
    )
  }

  // Case 2: Not Talent (e.g. Producer/Admin)
  if (userRole !== "talent") {
    return (
      <div className="space-y-2">
        <Button
          disabled
          className="w-full bg-muted text-muted-foreground font-semibold h-12 rounded-xl cursor-not-allowed border border-border/50 text-xs"
        >
          Casting Available for Talent Accounts Only
        </Button>
        <p className="text-[10px] text-muted-foreground text-center capitalize">
          Your active session role is: <strong className="text-foreground">{userRole}</strong>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-3.5 bg-destructive/10 text-destructive text-xs rounded-xl border border-destructive/20 flex items-start gap-1.5 animate-in fade-in-50">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isApplied ? (
        /* Applied State */
        <div className="bg-emerald-500/5 border border-emerald-500/25 p-4 rounded-xl space-y-3">
          <div className="flex items-start gap-2.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">Application Submitted</p>
              <p className="text-[10px] mt-0.5 opacity-85">
                You applied on{" "}
                {new Date(app.applied_at).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <Button
            onClick={handleWithdraw}
            disabled={isPending}
            className="w-full bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold h-10 rounded-xl cursor-pointer transition-all border border-destructive/20 text-xs"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Withdraw Application"
            )}
          </Button>
        </div>
      ) : (
        /* Not Applied State */
        <>
          <Button
            onClick={() => setModalOpen(true)}
            disabled={isPending}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold h-12 rounded-xl shadow-md shadow-brand-500/10 cursor-pointer text-sm"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              "Apply Now"
            )}
          </Button>

          <ApplyModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            castingCallId={castingCallId}
            castingCallTitle={castingCallTitle}
            onSuccess={(newApp) => {
              setApp(newApp)
            }}
          />
        </>
      )}
    </div>
  )
}
