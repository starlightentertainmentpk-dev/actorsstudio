"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { castingCallSchema, CastingCallFormData } from "@/lib/validations/casting-call"
import { Button } from "@/components/ui/button"
import type { Database } from "@/types/database"
import {
  Loader2,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Info,
  Plus,
  X,
  Languages,
} from "lucide-react"

interface Requirements {
  gender?: "male" | "female" | "any"
  age_min?: number
  age_max?: number
  languages?: string[]
  skills?: string[]
  experience_min?: number
  notes?: string
}

interface Category {
  id: string
  name: string
}

interface CastingCallFormProps {
  initialData?: Database["public"]["Tables"]["casting_calls"]["Row"] | null
  categories: Category[]
  isVerified: boolean
  onSubmitAction: (data: CastingCallFormData) => Promise<unknown>
}

const COMMON_LANGUAGES = [
  "Urdu",
  "English",
  "Punjabi",
  "Sindhi",
  "Pashto",
  "Balochi",
  "Saraiki",
  "Hindko",
]

export function CastingCallForm({
  initialData,
  categories,
  isVerified,
  onSubmitAction,
}: CastingCallFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const initialRequirements = (initialData?.requirements_json as unknown as Requirements) || {}

  // Skills input state
  const [skillInput, setSkillInput] = useState("")
  const [skillsList, setSkillsList] = useState<string[]>(
    initialRequirements.skills || []
  )

  // Selected languages state
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    initialRequirements.languages || []
  )

  const defaultValues = {
    title: initialData?.title || "",
    description: initialData?.description || "",
    category_id: initialData?.category_id || "",
    location: initialData?.location || "",
    shoot_date: initialData?.shoot_date || "",
    application_deadline: initialData?.application_deadline
      ? new Date(initialData.application_deadline).toISOString().slice(0, 16)
      : "",
    compensation: initialData?.compensation || "",
    requirements_json: {
      gender: initialRequirements.gender || "any",
      age_min: initialRequirements.age_min || 18,
      age_max: initialRequirements.age_max || 60,
      languages: initialRequirements.languages || [],
      skills: initialRequirements.skills || [],
      experience_min: initialRequirements.experience_min || 0,
      notes: initialRequirements.notes || "",
    },
    status: (initialData?.status || "draft") as "draft" | "open" | "closed" | "cancelled",
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CastingCallFormData>({
    resolver: zodResolver(castingCallSchema),
    defaultValues,
  })

  // Watch requirements so we can display slider values
  const ageMin = watch("requirements_json.age_min") || 18
  const ageMax = watch("requirements_json.age_max") || 60

  // Language handlers
  const handleLanguageToggle = (lang: string) => {
    let updated: string[] = []
    if (selectedLanguages.includes(lang)) {
      updated = selectedLanguages.filter((l) => l !== lang)
    } else {
      updated = [...selectedLanguages, lang]
    }
    setSelectedLanguages(updated)
    setValue("requirements_json.languages", updated, { shouldValidate: true })
  }

  // Skills tag handlers
  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const trimmed = skillInput.trim().toLowerCase()
      if (trimmed && !skillsList.includes(trimmed)) {
        const updated = [...skillsList, trimmed]
        setSkillsList(updated)
        setValue("requirements_json.skills", updated, { shouldValidate: true })
      }
      setSkillInput("")
    }
  }

  const handleAddSkillButton = () => {
    const trimmed = skillInput.trim().toLowerCase()
    if (trimmed && !skillsList.includes(trimmed)) {
      const updated = [...skillsList, trimmed]
      setSkillsList(updated)
      setValue("requirements_json.skills", updated, { shouldValidate: true })
    }
    setSkillInput("")
  }

  const handleRemoveSkill = (skill: string) => {
    const updated = skillsList.filter((s) => s !== skill)
    setSkillsList(updated)
    setValue("requirements_json.skills", updated, { shouldValidate: true })
  }

  const onSubmit = async (values: CastingCallFormData, statusType: "draft" | "open") => {
    if (statusType === "open" && !isVerified) {
      setErrorMsg("Your company profile must be verified by the admin before publishing casting calls.")
      return
    }

    setLoading(true)
    setErrorMsg("")

    try {
      const payload = {
        ...values,
        status: statusType,
        requirements_json: {
          ...values.requirements_json,
          languages: selectedLanguages,
          skills: skillsList,
        },
      }

      await onSubmitAction(payload)
      router.push("/producer/casting")
      router.refresh()
    } catch (err) {
      const errorVal = err as Error
      setErrorMsg(errorVal.message || "Something went wrong while saving the casting call.")
      setLoading(false)
    }
  }

  return (
    <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
      {errorMsg && (
        <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 animate-in fade-in-50 flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to Save</p>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card/45 backdrop-blur-md border border-border/40 p-6 md:p-8 rounded-2xl shadow-xl shadow-brand-500/5 space-y-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
              <Briefcase className="h-5 w-5 text-brand-500" /> Basic Details
            </h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Casting Call Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                {...register("title")}
                placeholder="e.g. Lead Female Actor for TV Commercial"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
              />
              {errors.title && (
                <p className="text-xs text-destructive mt-1.5">{errors.title.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Production Category <span className="text-destructive">*</span>
              </label>
              <select
                {...register("category_id")}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-xs text-destructive mt-1.5">{errors.category_id.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Description & Job Details <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={8}
                {...register("description")}
                placeholder="Provide a detailed description of the role, the production house, character details, schedules, and application instructions..."
                className="w-full p-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all resize-y font-sans leading-relaxed"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Tip: Break information into logical paragraphs for better readability.
              </p>
              {errors.description && (
                <p className="text-xs text-destructive mt-1.5">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Shoot / Audition Location <span className="text-destructive">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground pointer-events-none">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    {...register("location")}
                    placeholder="e.g. Karachi Studio / On-location TBD"
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>
                {errors.location && (
                  <p className="text-xs text-destructive mt-1.5">{errors.location.message}</p>
                )}
              </div>

              {/* Compensation */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Compensation Detail
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground pointer-events-none">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    {...register("compensation")}
                    placeholder="e.g. PKR 50,000 / day (TVC)"
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>
                {errors.compensation && (
                  <p className="text-xs text-destructive mt-1.5">{errors.compensation.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shoot Date */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Shoot Date (Optional)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground pointer-events-none">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <input
                    type="date"
                    {...register("shoot_date")}
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              {/* Application Deadline */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Application Deadline (Optional)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground pointer-events-none">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <input
                    type="datetime-local"
                    {...register("application_deadline")}
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Casting Requirements */}
        <div className="space-y-6">
          <div className="bg-card/45 backdrop-blur-md border border-border/40 p-6 md:p-8 rounded-2xl shadow-xl shadow-brand-500/5 space-y-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2 border-b border-border/40 pb-3">
              <Info className="h-5 w-5 text-brand-500" /> Talent Preferences
            </h3>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Gender Preference
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["any", "male", "female"].map((g) => (
                  <label
                    key={g}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-background/30 cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-950/20 hover:border-brand-500/40 transition-all text-sm font-semibold capitalize text-center"
                  >
                    <input
                      type="radio"
                      value={g}
                      {...register("requirements_json.gender")}
                      className="sr-only"
                    />
                    <span
                      className={`text-xs ${
                        watch("requirements_json.gender") === g
                          ? "text-brand-500 font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {g}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age Range Slider (Simulated dual slider / numeric inputs) */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Age Range: {ageMin} — {ageMax} years old
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-muted-foreground font-medium">Min Age</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    {...register("requirements_json.age_min", { valueAsNumber: true })}
                    className="w-full h-9 px-2.5 rounded-lg border border-input bg-background/50 text-foreground text-xs mt-1"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground font-medium">Max Age</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    {...register("requirements_json.age_max", { valueAsNumber: true })}
                    className="w-full h-9 px-2.5 rounded-lg border border-input bg-background/50 text-foreground text-xs mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Min Experience (Years)
              </label>
              <input
                type="number"
                min={0}
                {...register("requirements_json.experience_min", { valueAsNumber: true })}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
              />
            </div>

            {/* Skills Tag Input */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Required Skills
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="e.g. Acting, Dancing, Urdu Accent"
                  className="flex-1 h-9 px-3 rounded-lg border border-input bg-background/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                />
                <Button
                  type="button"
                  onClick={handleAddSkillButton}
                  className="h-9 px-3 bg-brand-500 text-white rounded-lg text-xs"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 capitalize border border-brand-200/50 dark:border-brand-900/30"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-destructive cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {skillsList.length === 0 && (
                  <span className="text-[10px] text-muted-foreground italic">
                    No skills specified. Press Enter or click + to add.
                  </span>
                )}
              </div>
            </div>

            {/* Languages Checkbox Tree */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Languages className="h-4 w-4 text-brand-500" /> Languages Preferred
              </label>
              <div className="grid grid-cols-2 gap-2 bg-background/30 border border-border/40 p-3 rounded-xl max-h-[140px] overflow-y-auto">
                {COMMON_LANGUAGES.map((lang) => {
                  const checked = selectedLanguages.includes(lang)
                  return (
                    <label
                      key={lang}
                      className="flex items-center gap-2 cursor-pointer select-none text-xs text-foreground/80 hover:text-foreground"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleLanguageToggle(lang)}
                        className="rounded border-input text-brand-500 focus:ring-brand-500 h-3.5 w-3.5"
                      />
                      {lang}
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                Requirements Notes (Max 500 chars)
              </label>
              <textarea
                rows={3}
                {...register("requirements_json.notes")}
                placeholder="Any special instructions or auditions details..."
                className="w-full p-2.5 rounded-lg border border-input bg-background/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Action Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-border/40 pt-6">
        <Button
          type="button"
          disabled={loading}
          onClick={handleSubmit((values) => onSubmit(values, "draft"))}
          className="w-full sm:w-auto h-11 border border-border/60 bg-muted hover:bg-muted/80 text-foreground font-semibold px-6 rounded-xl transition-all cursor-pointer text-sm"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save as Draft"}
        </Button>

        {isVerified ? (
          <Button
            type="button"
            disabled={loading}
            onClick={handleSubmit((values) => onSubmit(values, "open"))}
            className="w-full sm:w-auto h-11 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 rounded-xl transition-all shadow-md shadow-brand-500/15 active:scale-95 duration-150 cursor-pointer text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              "Publish Casting Call"
            )}
          </Button>
        ) : (
          <div className="relative group w-full sm:w-auto">
            <Button
              type="button"
              disabled
              className="w-full h-11 bg-brand-500/50 text-white/70 font-semibold px-8 rounded-xl cursor-not-allowed text-sm"
            >
              Publish Casting Call
            </Button>
            <div className="absolute bottom-full right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-0 mb-2 hidden group-hover:flex flex-col items-center bg-popover border border-border/80 p-2.5 rounded-lg shadow-xl max-w-[220px] text-center z-50">
              <span className="text-[11px] font-semibold text-popover-foreground leading-tight">
                Verify your company to publish casting calls.
              </span>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
