"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { ProgressBar } from "@/app/(dashboard)/talent/onboarding/_components/ProgressBar"
import { Button } from "@/components/ui/button"
import {
  producerStep1Schema,
  producerStep2Schema,
} from "@/lib/validations/producer-onboarding"
import {
  Loader2,
  Building2,
  Globe,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileCheck,
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

const STEPS = ["Company Details", "Verification Documents"]

type Step1Values = z.infer<typeof producerStep1Schema>
type Step2Values = z.infer<typeof producerStep2Schema>

export default function ProducerOnboardingPage() {
  const { user, isLoading: authLoading } = useRequireAuth("producer_brand")
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [dataLoading, setDataLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // File Upload states
  const [ntnFile, setNtnFile] = useState<File | null>(null)
  const [repIdFile, setRepIdFile] = useState<File | null>(null)
  const [ntnError, setNtnError] = useState("")
  const [repIdError, setRepIdError] = useState("")

  // Form setups
  const step1Form = useForm<Step1Values>({
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

  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(producerStep2Schema),
    defaultValues: {
      verification_docs_url: "",
      representative_note: "",
    },
  })

  // Load existing profile details if any
  useEffect(() => {
    async function loadProfile() {
      if (!user) return
      try {
        const { data } = await supabase
          .from("producer_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()

        if (data) {
          step1Form.reset({
            company_name: data.company_name || "",
            company_type: (data.company_type as Step1Values["company_type"]) || "production_house",
            website: data.website || "",
            bio: data.bio || "",
            instagram_url: data.instagram_url || "",
            linkedin_url: data.linkedin_url || "",
          })
          if (data.company_type) {
            // Already started or completed step 1
            setStep(2)
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err)
      } finally {
        setDataLoading(false)
      }
    }

    if (user) {
      loadProfile()
    }
  }, [user, supabase, step1Form])

  // Step 1 Submit Handler
  const handleStep1Submit = async (values: Step1Values) => {
    if (!user) return
    setLoading(true)
    setErrorMsg("")

    try {
      const { error } = await supabase
        .from("producer_profiles")
        .update({
          company_name: values.company_name,
          company_type: values.company_type,
          website: values.website || null,
          bio: values.bio || null,
          instagram_url: values.instagram_url || null,
          linkedin_url: values.linkedin_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (error) throw error

      setStep(2)
    } catch (err) {
      const errorVal = err as Error
      setErrorMsg(errorVal.message || "Failed to save company details.")
    } finally {
      setLoading(false)
    }
  }

  // File Change Handlers with Validation
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "ntn" | "rep"
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isPdfOrImage =
      file.type === "application/pdf" || file.type.startsWith("image/")
    const isUnder10Mb = file.size <= 10 * 1024 * 1024

    if (type === "ntn") {
      setNtnError("")
      if (!isPdfOrImage) {
        setNtnError("File must be a PDF or an Image (JPEG/PNG).")
        return
      }
      if (!isUnder10Mb) {
        setNtnError("File size must be under 10 MB.")
        return
      }
      setNtnFile(file)
      // Clear zod error once file is selected
      step2Form.setValue("verification_docs_url", file.name, {
        shouldValidate: true,
      })
    } else {
      setRepIdError("")
      if (!isPdfOrImage) {
        setRepIdError("File must be a PDF or an Image (JPEG/PNG).")
        return
      }
      if (!isUnder10Mb) {
        setRepIdError("File size must be under 10 MB.")
        return
      }
      setRepIdFile(file)
    }
  }

  // Step 2 Submit Handler (Final Onboarding Submission)
  const handleStep2Submit = async (values: Step2Values) => {
    if (!user) return
    if (!ntnFile) {
      setNtnError("Company registration / NTN document is required.")
      return
    }
    if (!repIdFile) {
      setRepIdError("Authorized representative ID or Passport is required.")
      return
    }

    setLoading(true)
    setErrorMsg("")

    try {
      // eslint-disable-next-line react-hooks/purity
      const timestamp = Date.now()

      // 1. Upload NTN document
      const ntnExt = ntnFile.name.split(".").pop()
      const ntnPath = `${user.id}/ntn_${timestamp}.${ntnExt}`
      const { error: ntnUploadError } = await supabase.storage
        .from("producer-docs")
        .upload(ntnPath, ntnFile, { cacheControl: "3600", upsert: true })

      if (ntnUploadError) throw new Error(`NTN Upload failed: ${ntnUploadError.message}`)

      // Get Public URL for the NTN doc
      const { data: { publicUrl } } = supabase.storage
        .from("producer-docs")
        .getPublicUrl(ntnPath)

      // 2. Upload Representative ID document
      const repExt = repIdFile.name.split(".").pop()
      const repPath = `${user.id}/rep_id_${timestamp}.${repExt}`
      const { error: repUploadError } = await supabase.storage
        .from("producer-docs")
        .upload(repPath, repIdFile, { cacheControl: "3600", upsert: true })

      if (repUploadError) throw new Error(`Representative ID Upload failed: ${repUploadError.message}`)

      // 3. Update Database Profile Row
      const { error: updateError } = await supabase
        .from("producer_profiles")
        .update({
          verification_docs_url: publicUrl,
          representative_note: values.representative_note || null,
          verified: false, // Explicitly keep false awaiting admin verification
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (updateError) throw updateError

      // Redirect to producer dashboard
      router.push("/producer/dashboard?onboarded=true")
      router.refresh()
    } catch (err) {
      const errorVal = err as Error
      setErrorMsg(errorVal.message || "Failed to upload files and complete registration.")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || dataLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Loading onboarding session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-gradient bg-gradient-to-r from-brand-500 to-gold-500 bg-clip-text text-transparent">
          Actors Studio
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {"Let's set up your Producer Profile & onboarding details."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        {/* Progress Bar */}
        <div className="bg-card/20 border border-border/40 px-6 py-4 rounded-2xl mb-6 backdrop-blur-sm">
          <ProgressBar steps={STEPS} current={step} />
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 animate-in fade-in-50">
            {errorMsg}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={step1Form.handleSubmit(handleStep1Submit)}
              className="space-y-6 bg-card/45 backdrop-blur-md border border-border/40 p-6 md:p-8 rounded-2xl shadow-xl shadow-brand-500/5"
            >
              <div>
                <h2 className="text-xl font-bold text-foreground">Company Details</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Tell us about your production house or organization.
                </p>
              </div>

              <div className="space-y-4">
                {/* Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Company Name <span className="text-destructive">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-muted-foreground pointer-events-none">
                      <Building2 className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      {...step1Form.register("company_name")}
                      placeholder="e.g. Paramount Pictures"
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    />
                  </div>
                  {step1Form.formState.errors.company_name && (
                    <p className="text-xs text-destructive mt-1.5">
                      {step1Form.formState.errors.company_name.message}
                    </p>
                  )}
                </div>

                {/* Company Type */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Company Type <span className="text-destructive">*</span>
                  </label>
                  <select
                    {...step1Form.register("company_type")}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  >
                    <option value="production_house">Production House</option>
                    <option value="brand">Brand</option>
                    <option value="ad_agency">Advertising Agency</option>
                    <option value="independent_producer">Independent Producer</option>
                    <option value="casting_director">Casting Director</option>
                  </select>
                  {step1Form.formState.errors.company_type && (
                    <p className="text-xs text-destructive mt-1.5">
                      {step1Form.formState.errors.company_type.message}
                    </p>
                  )}
                </div>

                {/* Company Bio */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Company Bio (Max 500 chars)
                  </label>
                  <textarea
                    rows={4}
                    {...step1Form.register("bio")}
                    placeholder="Briefly describe what your organization does..."
                    className="w-full p-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
                  />
                  {step1Form.formState.errors.bio && (
                    <p className="text-xs text-destructive mt-1.5">
                      {step1Form.formState.errors.bio.message}
                    </p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Website URL
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-muted-foreground pointer-events-none">
                      <Globe className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      {...step1Form.register("website")}
                      placeholder="https://yourcompany.com"
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    />
                  </div>
                  {step1Form.formState.errors.website && (
                    <p className="text-xs text-destructive mt-1.5">
                      {step1Form.formState.errors.website.message}
                    </p>
                  )}
                </div>

                {/* Social Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Instagram */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                      Instagram URL
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-muted-foreground pointer-events-none">
                        <InstagramIcon className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        {...step1Form.register("instagram_url")}
                        placeholder="https://instagram.com/handle"
                        className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                      />
                    </div>
                    {step1Form.formState.errors.instagram_url && (
                      <p className="text-xs text-destructive mt-1.5">
                        {step1Form.formState.errors.instagram_url.message}
                      </p>
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                      LinkedIn URL
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-muted-foreground pointer-events-none">
                        <LinkedinIcon className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        {...step1Form.register("linkedin_url")}
                        placeholder="https://linkedin.com/company/name"
                        className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
                      />
                    </div>
                    {step1Form.formState.errors.linkedin_url && (
                      <p className="text-xs text-destructive mt-1.5">
                        {step1Form.formState.errors.linkedin_url.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation button */}
              <div className="flex justify-end pt-4 border-t border-border/40">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-2 rounded-xl transition-all shadow-md shadow-brand-500/20 active:scale-95 duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={step2Form.handleSubmit(handleStep2Submit)}
              className="space-y-6 bg-card/45 backdrop-blur-md border border-border/40 p-6 md:p-8 rounded-2xl shadow-xl shadow-brand-500/5"
            >
              <div>
                <h2 className="text-xl font-bold text-foreground">Verification Documents</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload verification details to receive your verified producer badge.
                </p>
              </div>

              <div className="space-y-6">
                {/* Company Registration Doc */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Company Registration / NTN Document <span className="text-destructive">*</span>
                  </label>
                  <div className="relative border-2 border-dashed border-border/50 hover:border-brand-500 rounded-xl p-6 transition-colors flex flex-col items-center justify-center bg-background/30">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleFileChange(e, "ntn")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {ntnFile ? (
                      <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400">
                        <FileCheck className="h-10 w-10 shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-semibold truncate max-w-[300px]">
                            {ntnFile.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {(ntnFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium text-foreground text-center">
                          Click or drag to upload NTN Document
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          PDF, JPEG, or PNG up to 10 MB
                        </p>
                      </>
                    )}
                  </div>
                  {ntnError && (
                    <p className="text-xs text-destructive mt-1.5">{ntnError}</p>
                  )}
                  {step2Form.formState.errors.verification_docs_url && !ntnFile && (
                    <p className="text-xs text-destructive mt-1.5">
                      {step2Form.formState.errors.verification_docs_url.message}
                    </p>
                  )}
                </div>

                {/* Representative ID / Passport */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Authorized Representative ID or Passport <span className="text-destructive">*</span>
                  </label>
                  <div className="relative border-2 border-dashed border-border/50 hover:border-brand-500 rounded-xl p-6 transition-colors flex flex-col items-center justify-center bg-background/30">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleFileChange(e, "rep")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {repIdFile ? (
                      <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400">
                        <FileCheck className="h-10 w-10 shrink-0" />
                        <div className="text-left">
                          <p className="text-sm font-semibold truncate max-w-[300px]">
                            {repIdFile.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {(repIdFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium text-foreground text-center">
                          Click or drag to upload passport or national ID card
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          PDF, JPEG, or PNG up to 10 MB
                        </p>
                      </>
                    )}
                  </div>
                  {repIdError && (
                    <p className="text-xs text-destructive mt-1.5">{repIdError}</p>
                  )}
                </div>

                {/* Representative Note */}
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                    Project notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    {...step2Form.register("representative_note")}
                    placeholder="Provide a brief note about what types of projects you typically produce..."
                    className="w-full p-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
                  />
                  {step2Form.formState.errors.representative_note && (
                    <p className="text-xs text-destructive mt-1.5">
                      {step2Form.formState.errors.representative_note.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-border/40">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex items-center gap-2 border-border/60 hover:bg-muted text-foreground transition-all cursor-pointer font-semibold"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-2 rounded-xl transition-all shadow-md shadow-brand-500/20 active:scale-95 duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading & Registering...
                    </>
                  ) : (
                    <>
                      Complete Registration <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
