"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { 
  ChevronDown, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Globe, 
  Plus, 
  X,
  Sparkles,
  Calendar
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { CompCardModal } from "@/components/features/talent/CompCardModal"

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
)

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

const LANGUAGES = ["Urdu", "English", "Punjabi", "Sindhi", "Pashto", "Balochi", "Other"]
const PRESET_SKILLS = [
  "Acting", "Modeling", "Hosting", "Dubbing", "Voiceover", 
  "Classical Dancing", "Hip Hop", "Singing", "Guitar", 
  "Improvisation", "Monologues", "Stunts"
]

export default function TalentProfilePage() {
  const { data: user } = useUser()
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Local Form state
  const [formData, setFormData] = useState<any>({
    full_name: "",
    stage_name: "",
    dob: "",
    gender: "",
    city: "",
    phone: "",
    category_id: "",
    sub_category_id: "",
    experience_years: 0,
    bio: "",
    height_cm: "",
    weight_kg: "",
    union_member: false,
    is_available: true,
    instagram: "",
    tiktok: "",
    youtube: "",
    facebook: "",
    website: "",
    chest: "",
    bust: "",
    waist: "",
    hip: ""
  })

  const [skills, setSkills] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")

  // UI state
  const [openSection, setOpenSection] = useState<string>("personal")
  const [isCompCardOpen, setIsCompCardOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch talent profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["talent-profile-edit", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
      if (error) throw error
      return data
    }
  })

  // Fetch primary photo asset
  const { data: primaryPhoto } = useQuery({
    queryKey: ["primary-photo-edit", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from("media_assets")
        .select("url")
        .eq("owner_id", user.id)
        .eq("type", "photo")
        .eq("is_primary", true)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Sync profile data to local state
  useEffect(() => {
    if (profile) {
      const social = (profile.measurements_json as any)?.social || {}
      setFormData({
        full_name: profile.full_name || "",
        stage_name: profile.stage_name || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        city: profile.city || "",
        phone: user?.phone || "",
        category_id: profile.category_id || "",
        sub_category_id: profile.sub_category_id || "",
        experience_years: profile.experience_years ?? 0,
        bio: profile.bio || "",
        height_cm: profile.height_cm || "",
        weight_kg: profile.weight_kg || "",
        union_member: !!profile.union_member,
        is_available: !!profile.is_available,
        instagram: social.instagram || "",
        tiktok: social.tiktok || "",
        youtube: social.youtube || "",
        facebook: social.facebook || "",
        website: social.website || "",
        chest: (profile.measurements_json as any)?.chest || "",
        bust: (profile.measurements_json as any)?.bust || "",
        waist: (profile.measurements_json as any)?.waist || "",
        hip: (profile.measurements_json as any)?.hip || ""
      })
      setSkills(profile.skills || [])
      setLanguages(profile.languages || [])
    }
  }, [profile, user])

  const parentCategories = categories.filter((c: any) => !c.parent_id)
  const subCategories = categories.filter((c: any) => c.parent_id === formData.category_id)

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  // Save validation & handler
  const handleFieldSave = async (field: string, value: any) => {
    if (!user?.id) return

    // 1. Validation
    let error = ""
    if (field === "phone" && value) {
      if (!/^(\+92|0)[0-9]{10}$/.test(value)) {
        error = "Enter a valid Pakistani phone number"
      }
    } else if (field === "dob" && value) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        error = "Enter a valid date (YYYY-MM-DD)"
      }
    } else if (field === "height_cm" && value) {
      const num = Number(value)
      if (isNaN(num) || num < 100 || num > 250) {
        error = "Height must be between 100 and 250 cm"
      }
    } else if (field === "weight_kg" && value) {
      const num = Number(value)
      if (isNaN(num) || num < 30 || num > 200) {
        error = "Weight must be between 30 and 200 kg"
      }
    } else if (["instagram", "tiktok", "youtube", "facebook", "website"].includes(field) && value) {
      try {
        new URL(value)
      } catch {
        error = "Enter a valid URL"
      }
    } else if (field === "full_name" && !value) {
      error = "Full name is required"
    } else if (field === "city" && !value) {
      error = "City is required"
    }

    setErrors(prev => ({ ...prev, [field]: error }))
    if (error) return // Cancel saving

    setSaving(true)
    try {
      if (field === "phone") {
        // Save to users table
        const { error: userError } = await supabase
          .from("users")
          .update({ phone: value || null })
          .eq("id", user.id)
        if (userError) throw userError
      } else if (["instagram", "tiktok", "youtube", "facebook", "website"].includes(field)) {
        // Save to measurements_json.social
        const existingMeasurements = (profile?.measurements_json as any) || {}
        const updatedSocial = {
          ...(existingMeasurements.social || {}),
          [field]: value || ""
        }
        const updatedMeasurements = {
          ...existingMeasurements,
          social: updatedSocial
        }
        const { error: profileError } = await supabase
          .from("talent_profiles")
          .update({ measurements_json: updatedMeasurements })
          .eq("user_id", user.id)
        if (profileError) throw profileError
        
        // Refresh local react query cache
        queryClient.setQueryData(["talent-profile-edit", user.id], (old: any) => ({
          ...old,
          measurements_json: updatedMeasurements
        }))
      } else if (["chest", "bust", "waist", "hip"].includes(field)) {
        // Save to measurements_json directly
        const existingMeasurements = (profile?.measurements_json as any) || {}
        const updatedMeasurements = {
          ...existingMeasurements,
          [field]: value ? Number(value) : null
        }
        const { error: profileError } = await supabase
          .from("talent_profiles")
          .update({ measurements_json: updatedMeasurements })
          .eq("user_id", user.id)
        if (profileError) throw profileError

        queryClient.setQueryData(["talent-profile-edit", user.id], (old: any) => ({
          ...old,
          measurements_json: updatedMeasurements
        }))
      } else {
        // Normal profile field
        let valToSave = value
        if (field === "experience_years" || field === "height_cm" || field === "weight_kg") {
          valToSave = value ? Number(value) : null
        } else if (field === "union_member" || field === "is_available") {
          valToSave = !!value
        }
        const { error: profileError } = await supabase
          .from("talent_profiles")
          .update({ [field]: valToSave } as any)
          .eq("user_id", user.id)
        if (profileError) throw profileError
      }
      setLastSaved(new Date().toLocaleTimeString())
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // Handle direct skill additions/deletions
  const handleAddSkill = async () => {
    if (!user?.id) return
    const trimmed = newSkill.trim()
    if (!trimmed || skills.includes(trimmed)) {
      setNewSkill("")
      return
    }

    const updated = [...skills, trimmed]
    setSkills(updated)
    setNewSkill("")
    setSaving(true)
    try {
      await supabase.from("talent_profiles").update({ skills: updated }).eq("user_id", user.id)
      setLastSaved(new Date().toLocaleTimeString())
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!user?.id) return
    const updated = skills.filter(s => s !== skillToRemove)
    setSkills(updated)
    setSaving(true)
    try {
      await supabase.from("talent_profiles").update({ skills: updated }).eq("user_id", user.id)
      setLastSaved(new Date().toLocaleTimeString())
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  // Handle direct language modifications
  const handleLanguageToggle = async (lang: string) => {
    if (!user?.id) return
    const updated = languages.includes(lang)
      ? languages.filter(l => l !== lang)
      : [...languages, lang]

    setLanguages(updated)
    setSaving(true)
    try {
      await supabase.from("talent_profiles").update({ languages: updated }).eq("user_id", user.id)
      setLastSaved(new Date().toLocaleTimeString())
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
          <p className="text-muted-foreground text-sm">
            Keep your profile details up-to-date. Changes auto-save on field blur.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Preview Comp Card Action */}
          <button
            onClick={() => setIsCompCardOpen(true)}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-md shadow-brand-500/20 active:scale-95 duration-150 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 fill-white" /> Preview Comp Card
          </button>
        </div>
      </div>

      {/* Accordion Layout */}
      <div className="space-y-4 max-w-3xl">
        
        {/* Section 1: Personal Info */}
        <div className="border border-border/50 bg-card rounded-xl overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setOpenSection(openSection === "personal" ? "" : "personal")}
            className="w-full flex items-center justify-between p-4 font-bold text-left text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <span className="font-heading text-sm text-foreground">1. Personal Information</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSection === "personal" ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {openSection === "personal" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-t border-border/40 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      onBlur={() => handleFieldSave("full_name", formData.full_name)}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                    {errors.full_name && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.full_name}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Stage Name</label>
                    <input
                      type="text"
                      value={formData.stage_name}
                      onChange={(e) => handleInputChange("stage_name", e.target.value)}
                      onBlur={() => handleFieldSave("stage_name", formData.stage_name)}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Date of Birth (YYYY-MM-DD)</label>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={formData.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      onBlur={() => handleFieldSave("dob", formData.dob)}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                    {errors.dob && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.dob}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => {
                        handleInputChange("gender", e.target.value)
                        handleFieldSave("gender", e.target.value)
                      }}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non_binary">Non-Binary</option>
                      <option value="prefer_not_to_say">Prefer Not To Say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      onBlur={() => handleFieldSave("city", formData.city)}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                    {errors.city && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g., 03001234567"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      onBlur={() => handleFieldSave("phone", formData.phone)}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                    {errors.phone && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.phone}</p>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 2: Professional Info */}
        <div className="border border-border/50 bg-card rounded-xl overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setOpenSection(openSection === "professional" ? "" : "professional")}
            className="w-full flex items-center justify-between p-4 font-bold text-left text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <span className="font-heading text-sm text-foreground">2. Professional Details</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSection === "professional" ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {openSection === "professional" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-t border-border/40 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Primary Category</label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => {
                          handleInputChange("category_id", e.target.value)
                          handleInputChange("sub_category_id", "") // Reset subcategory
                          handleFieldSave("category_id", e.target.value)
                        }}
                        className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium"
                      >
                        <option value="">Select Category</option>
                        {parentCategories.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Sub Category</label>
                      <select
                        value={formData.sub_category_id}
                        onChange={(e) => {
                          handleInputChange("sub_category_id", e.target.value)
                          handleFieldSave("sub_category_id", e.target.value)
                        }}
                        disabled={!formData.category_id}
                        className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all disabled:opacity-50 font-medium"
                      >
                        <option value="">Select Sub Category</option>
                        {subCategories.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.experience_years}
                        onChange={(e) => handleInputChange("experience_years", e.target.value)}
                        onBlur={() => handleFieldSave("experience_years", formData.experience_years)}
                        className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Height (cm)</label>
                        <input
                          type="number"
                          placeholder="cm"
                          value={formData.height_cm}
                          onChange={(e) => handleInputChange("height_cm", e.target.value)}
                          onBlur={() => handleFieldSave("height_cm", formData.height_cm)}
                          className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        />
                        {errors.height_cm && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.height_cm}</p>}
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Weight (kg)</label>
                        <input
                          type="number"
                          placeholder="kg"
                          value={formData.weight_kg}
                          onChange={(e) => handleInputChange("weight_kg", e.target.value)}
                          onBlur={() => handleFieldSave("weight_kg", formData.weight_kg)}
                          className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                        />
                        {errors.weight_kg && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.weight_kg}</p>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Professional Biography</label>
                    <textarea
                      rows={3}
                      value={formData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      onBlur={() => handleFieldSave("bio", formData.bio)}
                      className="w-full p-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      placeholder="Share a short bio summarizing your performance background, training, and casting preferences."
                    />
                  </div>

                  {/* Skills input */}
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Skills & Talents</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Add a skill..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddSkill()
                          }
                        }}
                        className="flex-1 h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="bg-brand-500 hover:bg-brand-600 text-white px-3 h-9 rounded-lg transition-all cursor-pointer font-semibold text-xs flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" /> Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {skills.map(skill => (
                        <span 
                          key={skill}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 rounded-md text-xs font-semibold"
                        >
                          {skill}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-muted-foreground hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      {skills.length === 0 && <p className="text-xs text-muted-foreground">No skills added yet.</p>}
                    </div>

                    {/* Presets */}
                    <div className="mt-3">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1.5">Suggested Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {PRESET_SKILLS.filter(s => !skills.includes(s)).map(preset => (
                          <button
                            type="button"
                            key={preset}
                            onClick={() => {
                              if (!user?.id) return
                              const updated = [...skills, preset]
                              setSkills(updated)
                              supabase.from("talent_profiles").update({ skills: updated }).eq("user_id", user.id)
                            }}
                            className="px-2 py-0.5 border border-border/80 rounded-md text-[10px] text-muted-foreground hover:text-brand-500 hover:border-brand-500/30 transition-all cursor-pointer"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Languages select */}
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Languages Spoken *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {LANGUAGES.map(lang => {
                        const isSelected = languages.includes(lang)
                        return (
                          <button
                            type="button"
                            key={lang}
                            onClick={() => handleLanguageToggle(lang)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold text-left transition-all duration-150 cursor-pointer ${
                              isSelected 
                                ? "bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400" 
                                : "bg-background border-border/60 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {lang}
                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Checkboxes for availability & union */}
                  <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_available}
                        onChange={(e) => {
                          handleInputChange("is_available", e.target.checked)
                          handleFieldSave("is_available", e.target.checked)
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 accent-brand-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-foreground">Available for Bookings</span>
                        <p className="text-[10px] text-muted-foreground">Show up in search results for active casting calls</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.union_member}
                        onChange={(e) => {
                          handleInputChange("union_member", e.target.checked)
                          handleFieldSave("union_member", e.target.checked)
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 accent-brand-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-foreground">Union Member</span>
                        <p className="text-[10px] text-muted-foreground">Certified member of industry talent guilds</p>
                      </div>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 3: Social Links */}
        <div className="border border-border/50 bg-card rounded-xl overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setOpenSection(openSection === "social" ? "" : "social")}
            className="w-full flex items-center justify-between p-4 font-bold text-left text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <span className="font-heading text-sm text-foreground">3. Social Connections</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSection === "social" ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {openSection === "social" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-t border-border/40 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><InstagramIcon className="h-3.5 w-3.5 text-brand-500" /> Instagram Link</label>
                    <input
                      type="text"
                      placeholder="https://instagram.com/yourname"
                      value={formData.instagram}
                      onChange={(e) => handleInputChange("instagram", e.target.value)}
                      onBlur={() => handleFieldSave("instagram", formData.instagram)}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                    {errors.instagram && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.instagram}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                      </svg>
                      TikTok Link
                    </label>
                    <input
                      type="text"
                      placeholder="https://tiktok.com/@yourname"
                      value={formData.tiktok}
                      onChange={(e) => handleInputChange("tiktok", e.target.value)}
                      onBlur={() => handleFieldSave("tiktok", formData.tiktok)}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                    {errors.tiktok && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.tiktok}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><YoutubeIcon className="h-3.5 w-3.5 text-brand-500" /> YouTube Channel</label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/c/yourchannel"
                      value={formData.youtube}
                      onChange={(e) => handleInputChange("youtube", e.target.value)}
                      onBlur={() => handleFieldSave("youtube", formData.youtube)}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                    {errors.youtube && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.youtube}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><FacebookIcon className="h-3.5 w-3.5 text-brand-500" /> Facebook Profile</label>
                    <input
                      type="text"
                      placeholder="https://facebook.com/yourprofile"
                      value={formData.facebook}
                      onChange={(e) => handleInputChange("facebook", e.target.value)}
                      onBlur={() => handleFieldSave("facebook", formData.facebook)}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                    {errors.facebook && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.facebook}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-brand-500" /> Website URL</label>
                    <input
                      type="text"
                      placeholder="https://yourwebsite.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      onBlur={() => handleFieldSave("website", formData.website)}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                    {errors.website && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5" />{errors.website}</p>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 4: Measurements */}
        <div className="border border-border/50 bg-card rounded-xl overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setOpenSection(openSection === "measurements" ? "" : "measurements")}
            className="w-full flex items-center justify-between p-4 font-bold text-left text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <span className="font-heading text-sm text-foreground">4. Body Measurements (Inches)</span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSection === "measurements" ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {openSection === "measurements" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 border-t border-border/40 grid gap-4 grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      {formData.gender === "female" ? "Bust" : "Chest"} (")
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 38"
                      value={formData.chest || formData.bust}
                      onChange={(e) => {
                        const val = e.target.value
                        if (formData.gender === "female") {
                          handleInputChange("bust", val)
                        } else {
                          handleInputChange("chest", val)
                        }
                      }}
                      onBlur={() => {
                        if (formData.gender === "female") {
                          handleFieldSave("bust", formData.bust)
                        } else {
                          handleFieldSave("chest", formData.chest)
                        }
                      }}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Waist (")</label>
                    <input
                      type="number"
                      placeholder="e.g. 32"
                      value={formData.waist}
                      onChange={(e) => handleInputChange("waist", e.target.value)}
                      onBlur={() => handleFieldSave("waist", formData.waist)}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Hips (")</label>
                    <input
                      type="number"
                      placeholder="e.g. 40"
                      value={formData.hip}
                      onChange={(e) => handleInputChange("hip", e.target.value)}
                      onBlur={() => handleFieldSave("hip", formData.hip)}
                      className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Auto-Save indicator status bar */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground bg-card/10 border border-border/30 px-4 py-2.5 rounded-xl max-w-3xl justify-between backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          {saving ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin text-brand-500" />
              <span>Saving changes to Supabase...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
              <span>All changes saved.</span>
            </>
          )}
        </div>
        {lastSaved && (
          <span className="font-mono">Last saved: {lastSaved}</span>
        )}
      </div>

      {/* Comp Card Preview Modal overlay */}
      <CompCardModal
        isOpen={isCompCardOpen}
        onClose={() => setIsCompCardOpen(false)}
        profile={profile}
        primaryPhotoUrl={primaryPhoto?.url}
      />
    </div>
  )
}
