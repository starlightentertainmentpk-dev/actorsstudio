"use client"

import React, { useState } from "react"
import { PipelineCandidate } from "@/types/pipeline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import {
  Video,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  X,
  UploadCloud,
  CheckCircle2,
} from "lucide-react"

interface RequestSelfTapeModalProps {
  candidate: PipelineCandidate
  projectTitle: string
  isOpen: boolean
  onClose: () => void
  onRequestSelfTape: (data: {
    casting_call_id: string
    casting_call_title: string
    casting_role_id?: string | null
    role_name?: string
    talent_id: string
    instructions: string
    sides_script_url?: string | null
    deadline_at: string
    client_id?: string | null
  }) => Promise<any>
}

export function RequestSelfTapeModal({
  candidate,
  projectTitle,
  isOpen,
  onClose,
  onRequestSelfTape,
}: RequestSelfTapeModalProps) {
  const { toast } = useToast()

  // Calculate default 48h deadline formatted for datetime-local input
  const defaultDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const pad = (n: number) => (n < 10 ? `0${n}` : n)
  const defaultDeadlineStr = `${defaultDeadline.getFullYear()}-${pad(
    defaultDeadline.getMonth() + 1
  )}-${pad(defaultDeadline.getDate())}T${pad(defaultDeadline.getHours())}:${pad(
    defaultDeadline.getMinutes()
  )}`

  const [instructions, setInstructions] = useState(
    `Please record Scene 14 audition for ${candidate.role?.role_name || "the character"}.\n\nFraming notes:\n- Medium close-up (chest to top of head)\n- Eye-level framing, natural daylight or clean frontal ring light\n- Horizontal orientation only\n- Deliver lines with natural pacing and emotional truth\n- Slate at beginning: State your name, height, and represented agency`
  )
  const [deadlineAt, setDeadlineAt] = useState(defaultDeadlineStr)
  const [sidesScriptUrl, setSidesScriptUrl] = useState(
    "/scripts/audition-sides-scene14.pdf"
  )
  const [uploadedSidesName, setUploadedSidesName] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedSidesName(file.name)
      setSidesScriptUrl(`/scripts/${file.name}`)
      toast({
        title: "Sides Attached",
        description: `Script '${file.name}' attached to this self-tape request.`,
        type: "success",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!instructions.trim() || instructions.length < 10) {
      toast({
        title: "Instructions Required",
        description: "Please provide clear scene instructions and framing notes (min 10 chars).",
        type: "error",
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onRequestSelfTape({
        casting_call_id: candidate.casting_call_id,
        casting_call_title: projectTitle,
        casting_role_id: candidate.casting_role_id,
        role_name: candidate.role?.role_name,
        talent_id: candidate.talent_id,
        instructions,
        sides_script_url: sidesScriptUrl,
        deadline_at: new Date(deadlineAt).toISOString(),
        client_id: candidate.client_id,
      })

      toast({
        title: "Self-Tape Requested",
        description: `Self-tape request dispatched to ${candidate.talent.full_name} with 48h deadline.`,
        type: "success",
      })
      onClose()
    } catch (err: any) {
      toast({
        title: "Request Failed",
        description: err.message || "Could not submit self-tape request.",
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Request Audition Self-Tape
              </h3>
              <p className="text-xs text-muted-foreground">
                Dispatches a direct video audition brief to the talent with script sides and deadline.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Candidate Info Summary Card */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-accent/30">
          {candidate.talent.avatar_url ? (
            <img
              src={candidate.talent.avatar_url}
              alt={candidate.talent.full_name}
              className="h-12 w-12 rounded-lg object-cover border border-border/80"
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
              {candidate.talent.full_name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">
                {candidate.talent.full_name}
              </h4>
              <Badge variant="outline" className="text-[10px] bg-brand-500/10 text-brand-300 border-brand-500/30">
                {candidate.role?.role_name || "General Pool"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Project: <span className="text-foreground font-medium">{projectTitle}</span>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Instructions */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center justify-between">
              <span>Scene Instructions & Framing Notes</span>
              <span className="text-[10px] text-muted-foreground">Required</span>
            </label>
            <textarea
              rows={5}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
              placeholder="Specify scene number, emotional beats, framing requirements (close-up/full body), slate instructions..."
              required
            />
          </div>

          {/* Script Sides / PDF attachment */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center justify-between">
              <span>Sides Script / Material (PDF)</span>
              <span className="text-[10px] text-muted-foreground">Downloadable by talent</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FileText className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={uploadedSidesName || sidesScriptUrl}
                  onChange={(e) => setSidesScriptUrl(e.target.value)}
                  placeholder="Link or path to PDF sides (e.g. /scripts/scene14.pdf)"
                  className="pl-8 text-xs"
                />
              </div>
              <label className="cursor-pointer shrink-0">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-accent/60 hover:bg-accent text-foreground text-xs font-medium transition-colors">
                  <UploadCloud className="h-3.5 w-3.5 text-purple-400" />
                  Upload PDF
                </span>
              </label>
            </div>
            {uploadedSidesName && (
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-3 w-3" />
                {uploadedSidesName} ready for talent to download.
              </p>
            )}
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <label className="font-medium text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Submission Deadline
              </span>
              <span className="text-[10px] text-muted-foreground">Default: 48 Hours</span>
            </label>
            <Input
              type="datetime-local"
              value={deadlineAt}
              onChange={(e) => setDeadlineAt(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 flex items-start gap-2.5 text-purple-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-purple-400" />
            <p className="text-[11px] leading-relaxed">
              When submitted, the talent will receive an instant notification in their portal at <span className="font-mono text-purple-200">/talent/self-tapes</span> to download sides, record scenes, and upload directly to secure private storage.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium gap-1.5"
            >
              <Video className="h-3.5 w-3.5" />
              {isSubmitting ? "Dispatching..." : "Send Self-Tape Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
