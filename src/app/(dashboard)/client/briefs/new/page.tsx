"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useClientPortal } from "@/hooks/useClientPortal"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import {
  ArrowLeft,
  Sparkles,
  Send,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react"

export default function SubmitClientBriefPage() {
  const router = useRouter()
  const { submitBrief, isSubmittingBrief, clientInfo } = useClientPortal()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    project_title: "",
    gender_preference: "prefer_not_to_say",
    age_range_min: "",
    age_range_max: "",
    shoot_dates: "",
    budget_range: "",
    location: "Karachi, Pakistan",
    raw_brief_text: "",
  })

  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setValidationError(null)

    if (!formData.project_title.trim() || formData.project_title.trim().length < 3) {
      setValidationError("Project title must be at least 3 characters.")
      return
    }

    if (!formData.raw_brief_text.trim() || formData.raw_brief_text.trim().length < 10) {
      setValidationError("Please describe your casting requirements (minimum 10 characters).")
      return
    }

    if (
      formData.age_range_min &&
      formData.age_range_max &&
      Number(formData.age_range_min) > Number(formData.age_range_max)
    ) {
      setValidationError("Minimum age cannot be greater than maximum age.")
      return
    }

    const payload = new FormData()
    payload.append("project_title", formData.project_title)
    payload.append("gender_preference", formData.gender_preference)
    if (formData.age_range_min) payload.append("age_range_min", formData.age_range_min)
    if (formData.age_range_max) payload.append("age_range_max", formData.age_range_max)
    if (formData.shoot_dates) payload.append("shoot_dates", formData.shoot_dates)
    if (formData.budget_range) payload.append("budget_range", formData.budget_range)
    if (formData.location) payload.append("location", formData.location)
    payload.append("raw_brief_text", formData.raw_brief_text)

    try {
      const res = await submitBrief(payload)
      if (res.success) {
        toast({
          title: "Brief Submitted",
          description: "Casting brief submitted successfully to the agency!",
          type: "success",
        })
        router.push("/client/briefs")
      } else {
        setValidationError(res.error || "Failed to submit casting brief.")
      }
    } catch {
      setValidationError("An error occurred while submitting your brief.")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/client/briefs"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to My Briefs</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl border border-border/60 bg-gradient-to-br from-card/90 via-card/50 to-muted/20 backdrop-blur-md shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 text-xs font-semibold"
          >
            Direct Intake Queue
          </Badge>
          <span className="text-xs text-muted-foreground">
            Client: <strong className="text-foreground">{clientInfo.company_name}</strong>
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
          Submit Casting Brief
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Provide your character breakdown, production timeline, and budget parameters. Our senior talent agents will curate tailored portfolios and audition tapes within 24–48 hours.
        </p>
      </div>

      {/* Main Submission Form */}
      <Card className="rounded-3xl border-border/60 bg-card/70 backdrop-blur-xs p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {validationError && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {validationError}
            </div>
          )}

          {/* Section 1: Project Identity */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              1. Project Overview
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Project / Campaign Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Ramadan Prime-Time Drama Serial 'Khwaab Nagar' or Summer TVC"
                value={formData.project_title}
                onChange={(e) => setFormData({ ...formData, project_title: e.target.value })}
                className="rounded-xl border-border/70"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Give your project a distinctive title that our casting department will reference.
              </p>
            </div>
          </div>

          {/* Section 2: Character Demographics */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              2. Target Demographics & Parameters
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Gender Preference */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Gender Preference</label>
                <select
                  value={formData.gender_preference}
                  onChange={(e) =>
                    setFormData({ ...formData, gender_preference: e.target.value })
                  }
                  className="w-full h-9 rounded-xl border border-border/70 bg-card px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non_binary">Non-Binary / Any</option>
                  <option value="prefer_not_to_say">Open to All</option>
                </select>
              </div>

              {/* Age Range Min */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Min Age</label>
                <Input
                  type="number"
                  placeholder="e.g. 20"
                  min="0"
                  max="100"
                  value={formData.age_range_min}
                  onChange={(e) =>
                    setFormData({ ...formData, age_range_min: e.target.value })
                  }
                  className="rounded-xl border-border/70"
                />
              </div>

              {/* Age Range Max */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Max Age</label>
                <Input
                  type="number"
                  placeholder="e.g. 28"
                  min="0"
                  max="100"
                  value={formData.age_range_max}
                  onChange={(e) =>
                    setFormData({ ...formData, age_range_max: e.target.value })
                  }
                  className="rounded-xl border-border/70"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Commercial & Production Logistics */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              3. Production Schedule & Budget
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Shoot Dates */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Shoot Dates / Window</span>
                </label>
                <Input
                  placeholder="e.g. Dec 15 - Jan 10, 2027"
                  value={formData.shoot_dates}
                  onChange={(e) => setFormData({ ...formData, shoot_dates: e.target.value })}
                  className="rounded-xl border-border/70"
                />
              </div>

              {/* Budget Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Budget / Talent Rate</span>
                </label>
                <Input
                  placeholder="e.g. PKR 300,000 - 500,000"
                  value={formData.budget_range}
                  onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                  className="rounded-xl border-border/70"
                />
              </div>

              {/* Shoot Location */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Location</span>
                </label>
                <Input
                  placeholder="e.g. Karachi / Studio & Outdoor"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="rounded-xl border-border/70"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Creative Brief Details */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                4. Creative Brief & Character Breakdown <span className="text-destructive">*</span>
              </h2>
              <span className="text-[11px] text-muted-foreground">
                {formData.raw_brief_text.length} characters
              </span>
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Describe your character requirements, emotional arc, specific skills needed (e.g. Urdu diction, martial arts, classical dance), costume details, or reference actors..."
                value={formData.raw_brief_text}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, raw_brief_text: e.target.value })}
                rows={6}
                className="rounded-2xl border-border/70 resize-none text-xs leading-relaxed"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                The more detail you provide about personality, look, and dialogue delivery, the more accurate our talent curation will be.
              </p>
            </div>
          </div>

          {/* Submission Footer */}
          <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-brand-500" />
              <span>Transmitted directly to agency intake queue with encrypted RLS isolation</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link href="/client/briefs" className="w-full sm:w-auto">
                <Button variant="ghost" className="w-full sm:w-auto rounded-xl text-xs">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmittingBrief}
                className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white rounded-xl gap-2 text-xs font-semibold shadow-md shadow-brand-500/20"
              >
                {isSubmittingBrief ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting Brief...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Casting Brief</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}
