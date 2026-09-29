"use client"

import React, { useState } from "react"
import { useSelfTapes } from "@/hooks/useSelfTapes"
import { SelfTapeRequest } from "@/types/self-tape"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import {
  Video,
  UploadCloud,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Download,
  Calendar,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  Info,
  ShieldCheck,
  Eye,
  Film,
} from "lucide-react"

export default function TalentSelfTapesPage() {
  const { toast } = useToast()
  const {
    requests,
    pendingRequests,
    submittedRequests,
    isLoading,
    submitSelfTape,
    isSubmitting,
  } = useSelfTapes("t-zara-noor")

  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending")
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  // Upload state per request
  const [uploadingRequestId, setUploadingRequestId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadStage, setUploadStage] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [talentNotes, setTalentNotes] = useState<string>("")
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null)

  // Watch submitted modal state
  const [activeWatchRequest, setActiveWatchRequest] = useState<SelfTapeRequest | null>(null)

  // Format countdown string
  const formatDeadlineCountdown = (deadlineStr: string) => {
    const diff = new Date(deadlineStr).getTime() - Date.now()
    if (diff <= 0) return { label: "Expired", isUrgent: true, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" }
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 24) {
      return {
        label: `Due in ${hours} hours`,
        isUrgent: true,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      }
    }
    return {
      label: `Due in ${days} day${days > 1 ? "s" : ""} (${hours}h)`,
      isUrgent: false,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    }
  }

  // Handle local file selection
  const handleFileSelect = (reqId: string, file: File) => {
    setSelectedRequestId(reqId)
    setSelectedFile(file)
    const localUrl = URL.createObjectURL(file)
    setPreviewVideoUrl(localUrl)
    toast({
      title: "Video Ready",
      description: `Selected '${file.name}' (${(file.size / (1024 * 1024)).toFixed(1)} MB). Ready to upload.`,
      type: "success",
    })
  }

  // Simulate chunked upload with progress bar
  const handlePerformUpload = async (request: SelfTapeRequest) => {
    setUploadingRequestId(request.id)
    setUploadProgress(5)
    setUploadStage("Validating media encoding...")

    const sampleVideoUrl =
      previewVideoUrl ||
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"

    try {
      // Chunk 1
      await new Promise((r) => setTimeout(r, 400))
      setUploadProgress(28)
      setUploadStage("Uploading chunk 1 of 4 (6.2 MB)...")

      // Chunk 2
      await new Promise((r) => setTimeout(r, 500))
      setUploadProgress(56)
      setUploadStage("Uploading chunk 2 of 4 (12.4 MB)...")

      // Chunk 3
      await new Promise((r) => setTimeout(r, 450))
      setUploadProgress(84)
      setUploadStage("Encrypting in private storage bucket 'self-tapes'...")

      // Finalize
      await new Promise((r) => setTimeout(r, 400))
      setUploadProgress(100)
      setUploadStage("Generating secure playback token...")

      await submitSelfTape({
        self_tape_request_id: request.id,
        video_storage_path: sampleVideoUrl,
        video_signed_url: sampleVideoUrl,
        talent_notes: talentNotes || "Uploaded via talent self-tape portal.",
        video_duration_sec: 15.0,
        file_size_bytes: selectedFile?.size || 15728640,
      })

      toast({
        title: "Self-Tape Submitted",
        description: "Your video has been securely uploaded and marked for casting review.",
        type: "success",
      })

      // Reset
      setUploadingRequestId(null)
      setSelectedFile(null)
      setPreviewVideoUrl(null)
      setTalentNotes("")
      setUploadProgress(0)
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to upload self-tape.",
        type: "error",
      })
      setUploadingRequestId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card/90 to-purple-950/20 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Video className="h-5 w-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                Self-Tape Audition Center
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Record, upload, and track private audition self-tapes requested by casting directors and agencies. Uploads are encrypted in private storage with signed URL access.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right px-3 py-1.5 rounded-xl border border-border/60 bg-accent/30">
              <span className="text-[10px] text-muted-foreground block font-medium">Pending Requests</span>
              <span className="text-lg font-bold text-purple-400 font-mono">
                {pendingRequests.length}
              </span>
            </div>
            <div className="text-right px-3 py-1.5 rounded-xl border border-border/60 bg-accent/30">
              <span className="text-[10px] text-muted-foreground block font-medium">Submitted Tapes</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {submittedRequests.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-1">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === "pending"
              ? "border-purple-500 text-purple-400 bg-purple-500/10"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Pending Audition Requests</span>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              activeTab === "pending"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {pendingRequests.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === "history"
              ? "border-purple-500 text-purple-400 bg-purple-500/10"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <span>Submitted & In Review</span>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              activeTab === "history"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {submittedRequests.length}
          </Badge>
        </button>
      </div>

      {/* Tab 1: Pending Audition Requests */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-semibold text-foreground">All Caught Up!</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You have no pending self-tape briefs at this time. When casting calls invite you to record sides, they will appear here with instructions and script sides.
              </p>
            </div>
          ) : (
            pendingRequests.map((req) => {
              const countdown = formatDeadlineCountdown(req.deadline_at)
              const isCurrentlyUploading = uploadingRequestId === req.id

              return (
                <div
                  key={req.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-5 transition-all hover:border-border"
                >
                  {/* Top Bar: Project, Role, Deadline Countdown */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">
                          {req.casting_call?.title || "Casting Production"}
                        </h3>
                        <Badge
                          variant="outline"
                          className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs"
                        >
                          Role: {req.role?.role_name || "Featured Role"}
                        </Badge>
                        {req.status === "retape_requested" && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">
                            Re-Take Requested
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Requested on {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Deadline Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${countdown.color}`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {countdown.label}
                      </span>
                    </div>
                  </div>

                  {/* Scene Instructions Callout */}
                  <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5" />
                        Scene Instructions & Director Notes
                      </span>

                      {/* Download Sides Script Button */}
                      {req.sides_script_url && (
                        <a
                          href={req.sides_script_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/30 transition-colors"
                        >
                          <Download className="h-3 w-3" />
                          Download Sides Script (PDF)
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed pl-5 font-mono">
                      {req.instructions}
                    </p>
                  </div>

                  {/* Video Upload Section */}
                  <div className="space-y-3 pt-1">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <UploadCloud className="h-4 w-4 text-purple-400" />
                      Record & Upload Your Self-Tape
                    </span>

                    {/* Drag and Drop Box */}
                    <div className="relative border-2 border-dashed border-border/80 hover:border-purple-500/50 rounded-xl p-6 text-center bg-accent/20 hover:bg-accent/30 transition-colors">
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileSelect(req.id, file)
                        }}
                        disabled={isCurrentlyUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />

                      <div className="space-y-2 pointer-events-none">
                        <div className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                          <UploadCloud className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {selectedFile && selectedRequestId === req.id
                              ? `Selected: ${selectedFile.name}`
                              : "Click to browse or drop audition video here"}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Accepts .mp4, .mov, or .webm (Max 250MB, minimum 720p recommended)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Test Demo Option */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="text-[11px] flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        Uploaded securely to private storage with signed tokens.
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRequestId(req.id)
                          setPreviewVideoUrl(
                            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                          )
                          toast({
                            title: "Demo Audition Tape Loaded",
                            description: "Ready to test upload simulation.",
                            type: "success",
                          })
                        }}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-medium underline"
                      >
                        Use sample studio tape for testing
                      </button>
                    </div>

                    {/* Talent Notes Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">
                        Audition Notes for Director (Optional)
                      </label>
                      <Input
                        value={talentNotes}
                        onChange={(e) => setTalentNotes(e.target.value)}
                        placeholder="e.g. Take 2 attached. Delivered the monologue with more emotional restraint as requested."
                        className="text-xs h-8 bg-background"
                      />
                    </div>

                    {/* Upload Progress Bar (when uploading) */}
                    {isCurrentlyUploading && (
                      <div className="space-y-1.5 p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 animate-in fade-in duration-100">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-purple-300">{uploadStage}</span>
                          <span className="font-mono text-purple-400">{uploadProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${uploadProgress}%` }}
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 ease-out"
                          />
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        disabled={isCurrentlyUploading || (!selectedFile && !previewVideoUrl)}
                        onClick={() => handlePerformUpload(req)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium gap-2 text-xs"
                      >
                        <Video className="h-3.5 w-3.5" />
                        {isCurrentlyUploading ? "Uploading Tape..." : "Submit Self-Tape"}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Tab 2: Submitted & In Review History */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {submittedRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center space-y-3">
              <Film className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <h3 className="text-base font-semibold text-foreground">No Submissions Yet</h3>
              <p className="text-xs text-muted-foreground">
                Videos you upload for audition briefs will appear here for you to watch back and review feedback.
              </p>
            </div>
          ) : (
            submittedRequests.map((req) => {
              const sub = req.submission
              const reviews = sub?.reviews || []

              return (
                <div
                  key={req.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">
                          {req.casting_call?.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs"
                        >
                          Role: {req.role?.role_name}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Submitted on{" "}
                        {sub?.submitted_at
                          ? new Date(sub.submitted_at).toLocaleDateString()
                          : "Recently"}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {req.status === "approved" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Shortlisted / Approved
                        </span>
                      ) : req.status === "retape_requested" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <RotateCcw className="h-3.5 w-3.5" />
                          Re-Take Requested
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          <Eye className="h-3.5 w-3.5" />
                          Submitted & Under Review
                        </span>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 gap-1"
                        onClick={() => setActiveWatchRequest(req)}
                      >
                        <Play className="h-3 w-3 fill-current" />
                        Watch Tape
                      </Button>
                    </div>
                  </div>

                  {/* Notes & Feedback */}
                  {sub?.talent_notes && (
                    <div className="p-3 rounded-xl bg-accent/30 border border-border/60 text-xs">
                      <span className="font-semibold text-foreground">Your Submission Note: </span>
                      <span className="text-muted-foreground italic">&ldquo;{sub.talent_notes}&rdquo;</span>
                    </div>
                  )}

                  {/* Director / Agency Comments */}
                  {reviews.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                        Agency Director Feedback ({reviews.length})
                      </span>
                      <div className="space-y-2">
                        {reviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-purple-300">
                                {rev.reviewer?.name || "Agency Reviewer"}
                              </span>
                              {rev.score && (
                                <span className="font-mono text-amber-400 font-semibold">
                                  Rating: {rev.score}/10
                                </span>
                              )}
                            </div>
                            <p className="text-foreground/90">{rev.comments}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Option to replace submission before deadline */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                    <span className="text-[11px] text-muted-foreground">
                      Deadline: {new Date(req.deadline_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedRequestId(req.id)
                        setActiveTab("pending")
                        toast({
                          title: "Replace Mode",
                          description: "Select or drop a new take to replace your prior submission.",
                          type: "info",
                        })
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Upload replacement take before deadline
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Watch Submitted Video Modal */}
      {activeWatchRequest && activeWatchRequest.submission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Audition Tape: {activeWatchRequest.casting_call?.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Role: {activeWatchRequest.role?.role_name}
                </p>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground text-sm p-1"
                onClick={() => setActiveWatchRequest(null)}
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video
                src={
                  activeWatchRequest.submission.video_signed_url ||
                  activeWatchRequest.submission.video_storage_path
                }
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setActiveWatchRequest(null)}
              >
                Close Player
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
