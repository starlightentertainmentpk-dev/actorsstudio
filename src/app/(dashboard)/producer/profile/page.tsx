"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useUser } from "@/hooks/useUser"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { VerifiedBadge } from "@/components/features/producer/VerifiedBadge"
import { producerStep1Schema } from "@/lib/validations/producer-onboarding"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Building2,
  Globe,
  FileText,
  Upload,
  CheckCircle,
  FileCheck,
  AlertCircle,
} from "lucide-react"

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

type ProfileFormValues = z.infer<typeof producerStep1Schema>

export default function ProducerProfilePage() {
  const { data: user, isLoading: authLoading } = useUser()
  const supabase = createClient()
  
  // Status states for saving
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  // File replacement states
  const [replacingType, setReplacingType] = useState<"ntn" | "rep" | null>(null)
  const [replaceFile, setReplaceFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadError, setUploadError] = useState("")

  // Fetch producer profile details
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ["producer-profile", user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from("producer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  // Fetch uploaded documents from Supabase Storage folder
  const { data: docs = [], isLoading: docsLoading, refetch: refetchDocs } = useQuery({
    queryKey: ["producer-docs-list", user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase.storage
        .from("producer-docs")
        .list(user.id)
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(producerStep1Schema),
    defaultValues: {
      company_name: "",
      company_type: "production_house",
      website: "",
      bio: "",
      instagram_url: "",
      linkedin_url: "",
    },
  })

  // Sync form values when profile loads
  useEffect(() => {
    if (profile) {
      form.reset({
        company_name: profile.company_name || "",
        company_type: (profile.company_type as ProfileFormValues["company_type"]) || "production_house",
        website: profile.website || "",
        bio: profile.bio || "",
        instagram_url: profile.instagram_url || "",
        linkedin_url: profile.linkedin_url || "",
      })
    }
  }, [profile, form])

  // Handle Field Blur Auto-save
  const handleFieldBlur = async (field: keyof ProfileFormValues) => {
    if (!user) return
    
    // Trigger validation for this specific field
    const isValid = await form.trigger(field)
    if (!isValid) return

    const value = form.getValues(field)
    
    // Avoid saving if unchanged
    if (profile && profile[field] === (value || null)) return

    setSaveState("saving")
    setErrorMessage("")

    try {
      const { error } = await supabase
        .from("producer_profiles")
        .update({
          [field]: value || null,
          updated_at: new Date().toISOString(),
        } as import("@/types/database").Database["public"]["Tables"]["producer_profiles"]["Update"])
        .eq("user_id", user.id)

      if (error) throw error
      setSaveState("saved")
      refetchProfile()
      setTimeout(() => setSaveState("idle"), 2500)
    } catch (err) {
      const errorVal = err as Error
      setSaveState("error")
      setErrorMessage(errorVal.message || "Failed to auto-save field.")
    }
  }

  // Handle document replacement
  const handleReplaceDocument = async () => {
    if (!user || !replacingType || !replaceFile) return
    setUploadingFile(true)
    setUploadError("")

    try {
      // eslint-disable-next-line react-hooks/purity
      const timestamp = Date.now()
      const ext = replaceFile.name.split(".").pop()
      const filename = replacingType === "ntn" ? `ntn_${timestamp}.${ext}` : `rep_id_${timestamp}.${ext}`
      const filepath = `${user.id}/${filename}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("producer-docs")
        .upload(filepath, replaceFile, { cacheControl: "3600", upsert: true })

      if (uploadError) throw uploadError

      // Update database profile if replacing company registration (NTN) doc
      if (replacingType === "ntn") {
        const { data: { publicUrl } } = supabase.storage
          .from("producer-docs")
          .getPublicUrl(filepath)

        const { error: updateError } = await supabase
          .from("producer_profiles")
          .update({
            verification_docs_url: publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        if (updateError) throw updateError
      }

      // Refresh files list and profile data
      await refetchDocs()
      await refetchProfile()
      
      // Reset state
      setReplacingType(null)
      setReplaceFile(null)
    } catch (err) {
      const errorVal = err as Error
      setUploadError(errorVal.message || "Failed to replace document.")
    } finally {
      setUploadingFile(false)
    }
  }

  const isLoading = authLoading || profileLoading

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Profile not found.</p>
      </div>
    )
  }

  // Find files in storage list matching document patterns
  const ntnStoredFile = docs.find((f) => f.name.startsWith("ntn_"))
  const repIdStoredFile = docs.find((f) => f.name.startsWith("rep_id_"))

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
            Company Profile
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your company information and verification documents.
          </p>
        </div>

        {/* Save Status Badge */}
        <div className="text-xs flex items-center gap-2">
          {saveState === "saving" && (
            <span className="flex items-center gap-1 text-brand-500 font-semibold animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving changes...
            </span>
          )}
          {saveState === "saved" && (
            <span className="flex items-center gap-1 text-emerald-500 font-semibold">
              <CheckCircle className="h-3.5 w-3.5" /> All changes saved
            </span>
          )}
          {saveState === "error" && (
            <span className="flex items-center gap-1 text-destructive font-semibold" title={errorMessage}>
              <AlertCircle className="h-3.5 w-3.5" /> Save failed
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <form className="space-y-6 bg-card/20 border border-border/40 p-6 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <h2 className="text-lg font-bold text-foreground">Company Details</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-1">Status:</span>
                <VerifiedBadge verified={profile.verified} />
                {!profile.verified && (
                  <span className="inline-flex items-center bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-full px-2 py-0.5 text-xs font-medium">
                    Pending Verification
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Company Name
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    {...form.register("company_name", {
                      onBlur: () => handleFieldBlur("company_name"),
                    })}
                    placeholder="Company Name"
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>
                {form.formState.errors.company_name && (
                  <p className="text-xs text-destructive mt-1.5">
                    {form.formState.errors.company_name.message}
                  </p>
                )}
              </div>

              {/* Company Type */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Company Type
                </label>
                <select
                  {...form.register("company_type", {
                    onBlur: () => handleFieldBlur("company_type"),
                  })}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                >
                  <option value="production_house">Production House</option>
                  <option value="brand">Brand</option>
                  <option value="ad_agency">Advertising Agency</option>
                  <option value="independent_producer">Independent Producer</option>
                  <option value="casting_director">Casting Director</option>
                </select>
                {form.formState.errors.company_type && (
                  <p className="text-xs text-destructive mt-1.5">
                    {form.formState.errors.company_type.message}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Company Bio
                </label>
                <textarea
                  rows={4}
                  {...form.register("bio", {
                    onBlur: () => handleFieldBlur("bio"),
                  })}
                  placeholder="Provide a bio for your organization..."
                  className="w-full p-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
                />
                {form.formState.errors.bio && (
                  <p className="text-xs text-destructive mt-1.5">
                    {form.formState.errors.bio.message}
                  </p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Website URL
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    {...form.register("website", {
                      onBlur: () => handleFieldBlur("website"),
                    })}
                    placeholder="https://companywebsite.com"
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  />
                </div>
                {form.formState.errors.website && (
                  <p className="text-xs text-destructive mt-1.5">
                    {form.formState.errors.website.message}
                  </p>
                )}
              </div>

              {/* Socials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instagram */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Instagram URL
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-muted-foreground">
                      <InstagramIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      {...form.register("instagram_url", {
                        onBlur: () => handleFieldBlur("instagram_url"),
                      })}
                      placeholder="https://instagram.com/company"
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    />
                  </div>
                  {form.formState.errors.instagram_url && (
                    <p className="text-xs text-destructive mt-1.5">
                      {form.formState.errors.instagram_url.message}
                    </p>
                  )}
                </div>

                {/* LinkedIn */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    LinkedIn URL
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-muted-foreground">
                      <LinkedinIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      {...form.register("linkedin_url", {
                        onBlur: () => handleFieldBlur("linkedin_url"),
                      })}
                      placeholder="https://linkedin.com/company/name"
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    />
                  </div>
                  {form.formState.errors.linkedin_url && (
                    <p className="text-xs text-destructive mt-1.5">
                      {form.formState.errors.linkedin_url.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Verification Documents Panel */}
        <div className="space-y-6">
          <div className="bg-card/20 border border-border/40 p-6 rounded-2xl backdrop-blur-sm space-y-4">
            <h2 className="text-lg font-bold text-foreground pb-4 border-b border-border/40 flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-500" /> Verification Docs
            </h2>

            {docsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* NTN File Details */}
                <div className="p-3.5 bg-background/50 border border-border/30 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Company Registration / NTN
                  </p>
                  {ntnStoredFile ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck className="h-8 w-8 text-brand-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate max-w-[140px]">
                            {ntnStoredFile.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {ntnStoredFile.created_at ? new Date(ntnStoredFile.created_at).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplacingType("ntn")}
                        className="text-xs font-semibold text-brand-500 hover:text-brand-600 hover:bg-brand-500/10 cursor-pointer h-8 px-2.5 rounded-lg"
                      >
                        Replace
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-muted-foreground">No file found</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setReplacingType("ntn")}
                        className="text-brand-500 text-xs font-semibold p-0 cursor-pointer"
                      >
                        + Upload NTN
                      </Button>
                    </div>
                  )}
                </div>

                {/* Rep ID Details */}
                <div className="p-3.5 bg-background/50 border border-border/30 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Representative ID / Passport
                  </p>
                  {repIdStoredFile ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck className="h-8 w-8 text-brand-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate max-w-[140px]">
                            {repIdStoredFile.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {repIdStoredFile.created_at ? new Date(repIdStoredFile.created_at).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplacingType("rep")}
                        className="text-xs font-semibold text-brand-500 hover:text-brand-600 hover:bg-brand-500/10 cursor-pointer h-8 px-2.5 rounded-lg"
                      >
                        Replace
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-xs text-muted-foreground">No file found</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setReplacingType("rep")}
                        className="text-brand-500 text-xs font-semibold p-0 cursor-pointer"
                      >
                        + Upload ID
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Replacement Modal / Box */}
          {replacingType && (
            <div className="bg-card/30 border border-brand-500/30 p-5 rounded-2xl shadow-lg animate-in fade-in-50 slide-in-from-bottom-2 space-y-4">
              <h3 className="text-sm font-bold text-foreground">
                Replace{" "}
                {replacingType === "ntn"
                  ? "Company NTN Document"
                  : "Representative ID/Passport"}
              </h3>

              <div className="relative border-2 border-dashed border-border/60 hover:border-brand-500 rounded-xl p-4 transition-colors flex flex-col items-center justify-center bg-background/20 h-28">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && file.size <= 10 * 1024 * 1024) {
                      setReplaceFile(file)
                      setUploadError("")
                    } else if (file) {
                      setUploadError("File must be under 10 MB.")
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {replaceFile ? (
                  <div className="flex items-center gap-2 text-brand-500 text-xs text-center font-semibold">
                    <FileCheck className="h-6 w-6" />
                    <span className="truncate max-w-[150px]">{replaceFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-foreground font-semibold">Select File</span>
                    <span className="text-[10px] text-muted-foreground">PDF or Image, max 10MB</span>
                  </>
                )}
              </div>

              {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

              <div className="flex justify-end gap-2 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplacingType(null)
                    setReplaceFile(null)
                  }}
                  className="h-8 rounded-lg cursor-pointer font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!replaceFile || uploadingFile}
                  onClick={handleReplaceDocument}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-semibold h-8 rounded-lg cursor-pointer shadow-md shadow-brand-500/10"
                >
                  {uploadingFile ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" /> Uploading...
                    </>
                  ) : (
                    "Upload File"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
