"use client"

import { useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { applyToCastingCall } from "@/app/(dashboard)/talent/casting/actions"
import { Button } from "@/components/ui/button"
import { X, Send, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react"

interface ApplyModalProps {
  isOpen: boolean
  onClose: () => void
  castingCallId: string
  castingCallTitle: string
  onSuccess?: (appData: any) => void
}

export function ApplyModal({
  isOpen,
  onClose,
  castingCallId,
  castingCallTitle,
  onSuccess,
}: ApplyModalProps) {
  const [coverNote, setCoverNote] = useState("")
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState("")
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Fetch talent verification status and existing applications for this user
  const { data: checkData, isLoading: checkLoading } = useQuery({
    queryKey: ["apply-modal-talent-check", castingCallId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { user: null, profile: null, applied: false, role: null }

      // Get user role
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (userData?.role !== "talent") {
        return { user, profile: null, applied: false, role: userData?.role || null }
      }

      // Get profile
      const { data: profile } = await supabase
        .from("talent_profiles")
        .select("id, verification_status")
        .eq("user_id", user.id)
        .single()

      if (!profile) return { user, profile: null, applied: false, role: "talent" }

      // Get application
      const { data: existing } = await supabase
        .from("applications")
        .select("status")
        .eq("casting_call_id", castingCallId)
        .eq("talent_id", profile.id)
        .maybeSingle()

      const applied = existing && existing.status !== "withdrawn"

      return { user, profile, applied, role: "talent" }
    },
    enabled: isOpen && !!castingCallId,
  })

  if (!isOpen) return null

  const isApproved = checkData?.profile?.verification_status === "approved"
  const isApplied = checkData?.applied
  const hasProfile = !!checkData?.profile
  const isTalent = checkData?.role === "talent"

  // Validation messages
  let inlineError = ""
  if (!checkLoading) {
    if (!checkData?.user) {
      inlineError = "You must be logged in to apply."
    } else if (!isTalent) {
      inlineError = `Your account role is '${checkData.role}'. Casting calls are only available for Talent accounts.`
    } else if (!hasProfile) {
      inlineError = "Talent profile not found. Please complete your onboarding first."
    } else if (!isApproved) {
      inlineError = `Your profile status is '${checkData?.profile?.verification_status}'. Only approved talent can apply.`
    } else if (isApplied) {
      inlineError = "You have already applied to this casting call."
    }
  }

  const handleApply = () => {
    if (inlineError) return
    setErrorMsg("")
    startTransition(async () => {
      try {
        const res = await applyToCastingCall(castingCallId, coverNote)
        setSuccess(true)
        // Invalidate queries so dashboards/pages auto-refresh
        queryClient.invalidateQueries({ queryKey: ["talent-profile"] })
        queryClient.invalidateQueries({ queryKey: ["applications-count"] })
        queryClient.invalidateQueries({ queryKey: ["talent-applications"] })
        queryClient.invalidateQueries({ queryKey: ["apply-modal-talent-check", castingCallId] })
        
        if (onSuccess) onSuccess(res)
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to apply.")
      }
    })
  }

  const handleClose = () => {
    setCoverNote("")
    setErrorMsg("")
    setSuccess(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border/80 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/40 pb-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {success ? "Success!" : "Apply for Casting"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-[280px] truncate" title={castingCallTitle}>
              {castingCallTitle}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">Application Submitted!</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-[250px] mx-auto">
                Your portfolio has been sent to the producer. We will notify you of any status updates.
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs mt-2 px-6 py-2 rounded-xl transition-all cursor-pointer"
            >
              Done
            </Button>
          </div>
        ) : checkLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <p className="text-xs text-muted-foreground">Checking application status...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inlineError && (
              <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-xl border border-destructive/20 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{inlineError}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-xl border border-destructive/20 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Cover Note (Optional)
                </label>
                <span className={`text-[10px] ${coverNote.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                  {coverNote.length}/500 chars
                </span>
              </div>
              <textarea
                rows={4}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                disabled={!!inlineError || isPending}
                placeholder={
                  inlineError 
                    ? "Application is locked"
                    : "Write a short note stating why you're a great fit for this role..."
                }
                className="w-full p-3 rounded-xl border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none disabled:opacity-50"
              />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Your full verified digital talent profile and media assets will be automatically shared with the producer when you submit this.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <Button
                variant="ghost"
                onClick={handleClose}
                disabled={isPending}
                className="h-9 rounded-lg font-semibold cursor-pointer border border-border/50 text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={!!inlineError || isPending || coverNote.length > 500}
                className="bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md shadow-brand-500/10 h-9 rounded-lg cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> Submit Application
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
