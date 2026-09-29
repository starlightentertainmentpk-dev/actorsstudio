"use client"

import React, { useState } from "react"
import { parseClientBriefAction } from "@/app/actions/ai"
import type { StructuredBrief } from "@/types/ai"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import {
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  Users,
} from "lucide-react"

interface BriefParserModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyParsed: (brief: StructuredBrief) => void
}

const PRESET_MESSAGES = [
  {
    label: "WhatsApp Voice Note / Note",
    text: `Salam! We need a female lead model for an upcoming Lawn commercial shooting in Lahore. Age around 22-26, graceful expressions, fluent Urdu dialogue. Shoot is tentatively Oct 18-20. Total budget around PKR 350,000 all inclusive. Let me know who's free!`,
  },
  {
    label: "Agency Casting Email",
    text: `Client: Shan Foods
Project: Prime Time Ramadan TVC 2026
Role: Supporting Father / Lead Family Figure
Specs: Male actor, 40-50 age bracket, based in Karachi, theatre background or strong commercial drama experience.
Dates: November 5th-7th
Remuneration: PKR 500,000`,
  },
  {
    label: "Director WhatsApp Brief",
    text: `Urgent requirement for youth brand digital commercial. Looking for 2 energetic lifestyle actors (1 male, 1 female), 20-25 years old. Location Islamabad / Rawalpindi. Must know driving and be fluent in English. Shoot dates next weekend. Budget 200k per artist.`,
  },
]

export function BriefParserModal({
  isOpen,
  onClose,
  onApplyParsed,
}: BriefParserModalProps) {
  const { toast } = useToast()
  const [rawText, setRawText] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [parsedResult, setParsedResult] = useState<StructuredBrief | null>(null)

  if (!isOpen) return null

  const handleParse = async () => {
    if (!rawText.trim()) {
      toast({
        title: "Brief is empty",
        description: "Please paste a raw message or email text to parse.",
        variant: "destructive",
      })
      return
    }

    setIsParsing(true)
    try {
      const res = await parseClientBriefAction(rawText)
      if (res.success && res.structured) {
        setParsedResult(res.structured)
        toast({
          title: "Magic Parse Successful",
          description: "Unstructured brief converted into structured casting parameters.",
        })
      } else {
        toast({
          title: "Parsing Failed",
          description: res.error || "Unable to extract casting fields from this text.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Parsing Error",
        description: err.message || "Failed to contact brief parser service.",
        variant: "destructive",
      })
    } finally {
      setIsParsing(false)
    }
  }

  const handleApply = () => {
    if (!parsedResult) return
    onApplyParsed(parsedResult)
    toast({
      title: "Casting Form Auto-Filled",
      description: "Project parameters have been populated from parsed brief.",
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-gradient-to-r from-card via-card/90 to-brand-500/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-heading text-foreground">
                  AI Brief Parser
                </h2>
                <Badge
                  variant="outline"
                  className="bg-brand-500/10 text-brand-400 border-brand-500/30 text-[10px]"
                >
                  Magic Extract
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Paste unstructured client WhatsApp notes or emails to auto-fill casting forms.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Unstructured Raw Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-brand-400" />
                Raw Message / Client Note
              </label>
              <span className="text-[11px] text-muted-foreground">
                Supports WhatsApp, email threads, or verbal transcripts
              </span>
            </div>

            <Textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw WhatsApp text from director, production house email, or client requirements here..."
              className="text-xs resize-none bg-background/80"
            />

            {/* Quick Sample Clips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-muted-foreground">Sample Presets:</span>
              {PRESET_MESSAGES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRawText(sample.text)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-accent/60 hover:bg-accent text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parse Button Action */}
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleParse}
              disabled={isParsing || !rawText.trim()}
              className="text-xs bg-brand-600 hover:bg-brand-500 text-white font-medium gap-1.5 shadow-sm"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Extracting Parameters...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Magic Parse Brief
                </>
              )}
            </Button>
          </div>

          {/* Parsed Output Preview */}
          {parsedResult && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Extracted Casting Parameters
                </h3>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium border border-emerald-500/20">
                  Ready to Apply
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs bg-muted/30 p-3.5 rounded-xl border border-border/60">
                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Project Title</span>
                  <span className="font-semibold text-foreground truncate block">
                    {parsedResult.projectTitle || "Brand Campaign"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Role Name</span>
                  <span className="font-semibold text-foreground truncate block">
                    {parsedResult.roleName || "Lead Role"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Location</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-brand-400" />
                    {parsedResult.location || "Lahore"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Age Range</span>
                  <span className="font-semibold text-foreground">
                    {parsedResult.ageMin} – {parsedResult.ageMax} Years
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Gender Preference</span>
                  <span className="font-semibold text-foreground capitalize">
                    {parsedResult.genderPreference || "Any"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground block font-medium">Shoot Budget</span>
                  <span className="font-semibold text-emerald-400">
                    {parsedResult.budget || "PKR 250,000"}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-3">
                  <span className="text-[10px] text-muted-foreground block font-medium">Shoot Dates</span>
                  <span className="text-foreground text-[11px] flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3 text-indigo-400" />
                    {parsedResult.shootDates || "To be confirmed"}
                  </span>
                </div>

                {parsedResult.skillsRequired && parsedResult.skillsRequired.length > 0 && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-[10px] text-muted-foreground block font-medium mb-1">
                      Required Skills & Competencies
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {parsedResult.skillsRequired.map((skill, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-[10px] bg-background/80 text-foreground border-border/80"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/60 bg-muted/20">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>

          <Button
            size="sm"
            onClick={handleApply}
            disabled={!parsedResult}
            className="text-xs bg-brand-600 hover:bg-brand-500 text-white font-medium gap-1.5 shadow-sm"
          >
            Apply to Casting Form
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
