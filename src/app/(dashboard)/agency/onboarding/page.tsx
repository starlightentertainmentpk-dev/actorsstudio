"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2,
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Users,
  Coins,
  Clock,
  Palette,
  Briefcase,
  FileText,
  UserPlus,
  Percent,
  Rocket,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createAgencyOrganization } from "./actions"
import { AgencyType, OrganizationRole } from "@/types/organization"

const AGENCY_TYPES: { type: AgencyType; title: string; desc: string; icon: string }[] = [
  {
    type: "talent_agency",
    title: "Talent Agency",
    desc: "Actors, voiceover artists, performers, and television talent",
    icon: "🎭",
  },
  {
    type: "modeling_agency",
    title: "Modeling Agency",
    desc: "Fashion, runway, commercial print, and editorial models",
    icon: "📸",
  },
  {
    type: "casting_agency",
    title: "Casting Agency",
    desc: "Casting directors, audition management, and production matchmaking",
    icon: "🎬",
  },
  {
    type: "influencer_agency",
    title: "Influencer Agency",
    desc: "Social media creators, brand ambassadors, and digital talent",
    icon: "📱",
  },
  {
    type: "entertainment_agency",
    title: "Entertainment Agency",
    desc: "Full-spectrum production, music artists, and live performance",
    icon: "🌟",
  },
  {
    type: "creator_management",
    title: "Creator Management",
    desc: "YouTubers, streamers, podcasters, and online personalities",
    icon: "🎙️",
  },
  {
    type: "sports_talent",
    title: "Sports & Athletics",
    desc: "Athletes, fitness models, stunt performers, and martial artists",
    icon: "🏆",
  },
  {
    type: "other",
    title: "Specialized Management",
    desc: "Boutique, regional, or niche creative talent management",
    icon: "✨",
  },
]

const COUNTRIES = [
  { name: "Pakistan", code: "PK", defaultCurrency: "PKR", timezone: "Asia/Karachi" },
  { name: "United Arab Emirates", code: "AE", defaultCurrency: "AED", timezone: "Asia/Dubai" },
  { name: "United Kingdom", code: "GB", defaultCurrency: "GBP", timezone: "Europe/London" },
  { name: "United States", code: "US", defaultCurrency: "USD", timezone: "America/New_York" },
  { name: "Saudi Arabia", code: "SA", defaultCurrency: "SAR", timezone: "Asia/Riyadh" },
  { name: "Canada", code: "CA", defaultCurrency: "CAD", timezone: "America/Toronto" },
  { name: "Turkey", code: "TR", defaultCurrency: "TRY", timezone: "Europe/Istanbul" },
]

const CURRENCIES = [
  { code: "PKR", label: "Pakistani Rupee (PKR - ₨)" },
  { code: "USD", label: "US Dollar (USD - $)" },
  { code: "AED", label: "UAE Dirham (AED - د.إ)" },
  { code: "GBP", label: "British Pound (GBP - £)" },
  { code: "EUR", label: "Euro (EUR - €)" },
]

const TIMEZONES = [
  { value: "Asia/Karachi", label: "Asia/Karachi (PKT • GMT+5)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST • GMT+4)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST • GMT+0/+1)" },
  { value: "America/New_York", label: "America/New_York (EST • GMT-5)" },
  { value: "Asia/Riyadh", label: "Asia/Riyadh (AST • GMT+3)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
]

const BRAND_PALETTES = [
  { name: "Indigo Classic", hex: "#4f46e5" },
  { name: "Royal Purple", hex: "#7c3aed" },
  { name: "Crimson Rose", hex: "#e11d48" },
  { name: "Emerald Luxe", hex: "#059669" },
  { name: "Amber Gold", hex: "#d97706" },
  { name: "Cyan Teal", hex: "#0891b2" },
  { name: "Midnight Onyx", hex: "#1e293b" },
]

interface TeamInvite {
  email: string
  role: OrganizationRole
}

export default function AgencyOnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Form State
  const [agencyName, setAgencyName] = useState("")
  const [slug, setSlug] = useState("")
  const [agencyType, setAgencyType] = useState<AgencyType>("talent_agency")
  const [country, setCountry] = useState("Pakistan")
  const [currency, setCurrency] = useState("PKR")
  const [timezone, setTimezone] = useState("Asia/Karachi")
  const [logoUrl, setLogoUrl] = useState("")
  const [brandColor, setBrandColor] = useState("#4f46e5")
  const [website, setWebsite] = useState("")
  const [bio, setBio] = useState("")
  const [commissionRate, setCommissionRate] = useState(20)
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([])
  const [newInviteEmail, setNewInviteEmail] = useState("")
  const [newInviteRole, setNewInviteRole] = useState<OrganizationRole>("agent")

  // Auto-slugify agency name
  const handleNameChange = (name: string) => {
    setAgencyName(name)
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    setSlug(generatedSlug)
  }

  // Country selection auto-syncs default currency and timezone
  const handleCountrySelect = (cName: string) => {
    setCountry(cName)
    const matched = COUNTRIES.find((c) => c.name === cName)
    if (matched) {
      setCurrency(matched.defaultCurrency)
      setTimezone(matched.timezone)
    }
  }

  const handleAddInvite = () => {
    if (!newInviteEmail || !newInviteEmail.includes("@")) return
    setTeamInvites((prev) => [...prev, { email: newInviteEmail.trim(), role: newInviteRole }])
    setNewInviteEmail("")
  }

  const handleRemoveInvite = (index: number) => {
    setTeamInvites((prev) => prev.filter((_, i) => i !== index))
  }

  // Step Validation
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return agencyName.trim().length >= 2 && slug.trim().length >= 2
      case 2:
        return !!agencyType
      case 3:
        return !!country
      case 4:
        return !!currency
      case 5:
        return !!timezone
      case 6:
        return /^#([0-9a-fA-F]{3}){1,2}$/.test(brandColor)
      case 7:
        return true // optional website/bio
      case 8:
        return true // optional team invites
      case 9:
        return commissionRate >= 0 && commissionRate <= 100
      case 10:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canProceed() && currentStep < 10) {
      setCurrentStep((prev) => prev + 1)
      setErrorMessage(null)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
      setErrorMessage(null)
    }
  }

  const handleLaunchAgency = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const payload = {
        name: agencyName.trim(),
        slug: slug.trim(),
        agency_type: agencyType,
        country,
        currency,
        timezone,
        logo_url: logoUrl.trim() || undefined,
        brand_color: brandColor,
        website: website.trim() || undefined,
        bio: bio.trim() || undefined,
        default_commission_rate: commissionRate,
        team_invites: teamInvites,
      }

      const res = await createAgencyOrganization(payload)

      if (!res.success) {
        setErrorMessage(res.error || "Failed to launch agency workspace.")
        setIsSubmitting(false)
        return
      }

      // Success -> navigate to agency workspace
      router.push("/agency/dashboard")
      router.refresh()
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-full py-6 px-3 sm:px-6 max-w-4xl mx-auto flex flex-col justify-center">
      {/* Header & Progress Indicator */}
      <div className="mb-6 text-center">
        <Badge variant="outline" className="mb-2 py-1 px-3 gap-1.5 border-brand-500/30 text-brand-600 dark:text-brand-400">
          <Sparkles className="h-3.5 w-3.5 text-brand-500" />
          Agency Onboarding Architecture
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground">
          Setup Your Talent Agency Operating System
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl mx-auto">
          Establish your independent multi-tenant agency workspace, custom branding, roster boundaries, and agent commission split engine.
        </p>

        {/* 10-Step Progress Dots */}
        <div className="mt-6 flex items-center justify-between gap-1 max-w-2xl mx-auto">
          {Array.from({ length: 10 }).map((_, i) => {
            const stepNum = i + 1
            const isCompleted = stepNum < currentStep
            const isCurrent = stepNum === currentStep

            return (
              <div key={stepNum} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`h-2 w-full rounded-full transition-all duration-300 ${
                    isCompleted
                      ? "bg-brand-500"
                      : isCurrent
                      ? "bg-brand-500 ring-2 ring-brand-500/20"
                      : "bg-muted"
                  }`}
                />
                <span
                  className={`text-[10px] font-semibold hidden sm:inline ${
                    isCurrent ? "text-brand-600 dark:text-brand-400" : "text-muted-foreground/60"
                  }`}
                >
                  {stepNum}
                </span>
              </div>
            )
          })}
        </div>
        <div className="text-xs font-medium text-muted-foreground mt-2">
          Step {currentStep} of 10
        </div>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium text-center">
          {errorMessage}
        </div>
      )}

      {/* Main Step Body */}
      <Card className="border-border/60 shadow-lg bg-card/80 backdrop-blur-xs">
        <CardContent className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* STEP 1: Name & Slug */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                    <Building2 className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-foreground">Agency Identity & Workspace URL</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    What is the legal or public name of your talent agency, management company, or casting office?
                  </p>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Agency Name *</label>
                      <Input
                        value={agencyName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Star Talent Management"
                        className="mt-1"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground">Workspace Slug (URL Subpath) *</label>
                      <div className="flex items-center mt-1 rounded-md border border-input bg-muted/40 px-3">
                        <span className="text-xs text-muted-foreground select-none">agency.actorsstudio.pk/</span>
                        <input
                          value={slug}
                          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                          placeholder="star-talent"
                          className="w-full bg-transparent py-2 text-xs font-mono text-foreground focus:outline-hidden"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Used for isolated client submission rooms, talent booking portals, and agent sign-in.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Agency Type */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                    <Briefcase className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-foreground">Primary Agency Classification</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select your agency specialization to tailor default roster fields, casting pipelines, and comp cards.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {AGENCY_TYPES.map((t) => {
                      const isSelected = agencyType === t.type
                      return (
                        <div
                          key={t.type}
                          onClick={() => setAgencyType(t.type)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "border-brand-500 bg-brand-500/10 shadow-xs"
                              : "border-border/60 hover:border-border hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl select-none">{t.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold ${isSelected ? "text-brand-600 dark:text-brand-400" : "text-foreground"}`}>
                                {t.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                {t.desc}
                              </p>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Country */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                    <Globe className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-foreground">Base Country of Operations</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Where is your agency headquarters legally situated? This calibrates legal contracts, banking defaults, and tax jurisdictions.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {COUNTRIES.map((c) => {
                      const isSelected = country === c.name
                      return (
                        <div
                          key={c.name}
                          onClick={() => handleCountrySelect(c.name)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "border-brand-500 bg-brand-500/10 font-medium"
                              : "border-border/60 hover:bg-muted/30 text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-foreground/80">
                              {c.code}
                            </span>
                            <span className="text-xs">{c.name}</span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: Currency */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                    <Coins className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-foreground">Operational Currency</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Invoicing, booking fees, commercial deal quotes, and talent payouts will be calculated in this default currency.
                  </p>

                  <div className="space-y-2 pt-2">
                    {CURRENCIES.map((curr) => {
                      const isSelected = currency === curr.code
                      return (
                        <div
                          key={curr.code}
                          onClick={() => setCurrency(curr.code)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "border-brand-500 bg-brand-500/10 font-semibold text-foreground"
                              : "border-border/60 hover:bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center font-bold text-xs text-foreground">
                              {curr.code.substring(0, 2)}
                            </span>
                            <span className="text-xs">{curr.label}</span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 5: Timezone */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                    <Clock className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-foreground">Operational Timezone</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All audition slots, self-tape submission deadlines, call times, and calendar sync will lock to this timezone.
                  </p>

                  <div className="space-y-2 pt-2">
                    {TIMEZONES.map((tz) => {
                      const isSelected = timezone === tz.value
                      return (
                        <div
                          key={tz.value}
                          onClick={() => setTimezone(tz.value)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "border-brand-500 bg-brand-500/10 font-semibold text-foreground"
                              : "border-border/60 hover:bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          <span className="text-xs">{tz.label}</span>
                          {isSelected && <Check className="h-4 w-4 text-brand-600 dark:text-brand-400" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 6: Branding & Accent Color */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                    <Palette className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-foreground">Brand Identity & Accent Palette</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure your agency logo and primary theme color. Client pitch decks and PDFs will dynamically adapt to these tokens.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-foreground">Agency Logo URL (PNG/SVG)</label>
                        <Input
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-foreground">Primary Accent Color</label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {BRAND_PALETTES.map((pal) => (
                            <button
                              type="button"
                              key={pal.hex}
                              onClick={() => setBrandColor(pal.hex)}
                              className={`h-8 rounded-lg flex items-center justify-center transition-all ${
                                brandColor === pal.hex ? "ring-2 ring-offset-2 ring-foreground scale-105" : ""
                              }`}
                              style={{ backgroundColor: pal.hex }}
                              title={pal.name}
                            >
                              {brandColor === pal.hex && <Check className="h-3.5 w-3.5 text-white" />}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <input
                            type="color"
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                          />
                          <Input
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            placeholder="#4f46e5"
                            className="font-mono text-xs uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live Preview Card */}
                    <div className="rounded-xl border border-border p-4 bg-muted/20 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Live White-Label Preview
                        </p>
                        <div className="flex items-center gap-3">
                          {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={logoUrl}
                              alt="Logo preview"
                              className="h-10 w-10 object-contain rounded-lg border bg-white p-1"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none"
                              }}
                            />
                          ) : (
                            <div
                              className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs"
                              style={{ backgroundColor: brandColor }}
                            >
                              {agencyName ? agencyName.substring(0, 2).toUpperCase() : "AG"}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {agencyName || "Your Agency Name"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {country} • {currency}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Interactive Sample Button</span>
                        <Button size="xs" style={{ backgroundColor: brandColor, color: "#fff" }}>
                          View Talent Roster
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: Bio & Website */}
              {currentStep === 7 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                    <FileText className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-foreground">Agency Bio & Web Presence</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Provide public-facing details that appear on shared client dossiers and casting pitch decks.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Official Website URL (Optional)</label>
                      <Input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://www.youragency.com"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground">Agency Biography / Mission Statement</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Premier talent representation firm representing leading actors, television performers, and commercial talent across South Asia and MENA..."
                        rows={4}
                        className="w-full mt-1 rounded-md border border-input bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: Invite Initial Team */}
              {currentStep === 8 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                    <UserPlus className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-foreground">Invite Initial Agency Team</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add agents, casting managers, and talent scouts to your agency. You can also skip this and invite colleagues later.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={newInviteEmail}
                        onChange={(e) => setNewInviteEmail(e.target.value)}
                        placeholder="colleague@agency.com"
                        className="flex-1 text-xs"
                      />
                      <select
                        value={newInviteRole}
                        onChange={(e) => setNewInviteRole(e.target.value as OrganizationRole)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-hidden"
                      >
                        <option value="agent">Agent (Full Roster Access)</option>
                        <option value="casting_manager">Casting Manager</option>
                        <option value="talent_manager">Talent Manager</option>
                        <option value="agency_admin">Agency Administrator</option>
                        <option value="finance_manager">Finance Manager</option>
                        <option value="viewer">Viewer (Read Only)</option>
                      </select>
                      <Button type="button" size="sm" onClick={handleAddInvite} className="gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>

                    {teamInvites.length > 0 ? (
                      <div className="space-y-2 mt-4">
                        <p className="text-xs font-semibold text-foreground">Queued Team Invitations ({teamInvites.length}):</p>
                        {teamInvites.map((inv, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-muted/20"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-foreground">{inv.email}</span>
                              <Badge variant="secondary" className="text-[10px] capitalize">
                                {inv.role.replace("_", " ")}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleRemoveInvite(idx)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground mt-2">
                        No team invitations queued. You will be set as the sole Agency Owner initially.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 9: Default Commission Rate */}
              {currentStep === 9 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                    <Percent className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-foreground">Default Commission Split Engine</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Set the baseline agency commission percentage automatically applied to new talent contracts, commercial deals, and client invoices.
                  </p>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="0.5"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                        className="w-full accent-brand-500 cursor-pointer"
                      />
                      <div className="flex items-center gap-1 shrink-0 w-24">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={commissionRate}
                          onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                          className="font-mono text-center font-bold text-sm"
                        />
                        <span className="font-bold text-foreground text-sm">%</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-border bg-muted/20">
                      <p className="text-xs font-semibold text-foreground mb-1">Standard Split Example ($10,000 Deal):</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-2">
                        <div>
                          Agency Cut ({commissionRate}%):{" "}
                          <span className="font-bold text-brand-600 dark:text-brand-400">
                            ${((10000 * commissionRate) / 100).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          Talent Net Payout ({100 - commissionRate}%):{" "}
                          <span className="font-bold text-foreground">
                            ${((10000 * (100 - commissionRate)) / 100).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 10: Confirmation & Launch */}
              {currentStep === 10 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                    <Rocket className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-foreground">Review & Launch Agency Workspace</h2>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Confirm your multi-tenant parameters. Once launched, tenant isolation RLS policies will seal this agency workspace.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg border border-border bg-muted/10 space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Agency Name</p>
                      <p className="text-xs font-bold text-foreground">{agencyName}</p>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-muted/10 space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Workspace Slug</p>
                      <p className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">/{slug}</p>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-muted/10 space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Specialization</p>
                      <p className="text-xs font-semibold capitalize text-foreground">{agencyType.replace("_", " ")}</p>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-muted/10 space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Jurisdiction & Currency</p>
                      <p className="text-xs font-semibold text-foreground">
                        {country} • {currency} ({timezone})
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-muted/10 space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Default Commission</p>
                      <p className="text-xs font-bold text-foreground">{commissionRate}%</p>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-muted/10 space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Team Members</p>
                      <p className="text-xs font-semibold text-foreground">
                        {teamInvites.length > 0 ? `${teamInvites.length} invite(s) queued` : "Solo Agency Owner"}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-2.5 mt-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground">
                      Database Row Level Security (RLS) is automatically provisioned. Only verified agents in your organization will be permitted to access your talent roster, contracts, and commission logs.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Control Buttons */}
          <div className="mt-8 pt-4 border-t border-border flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>

            {currentStep < 10 ? (
              <Button
                type="button"
                size="sm"
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-1.5"
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleLaunchAgency}
                disabled={isSubmitting}
                className="gap-1.5 bg-brand-600 hover:bg-brand-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Provisioning Agency OS...
                  </>
                ) : (
                  <>
                    <Rocket className="h-3.5 w-3.5" />
                    Launch Agency Workspace
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
