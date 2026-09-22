"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { X, Sparkles, MapPin, Calendar, Award, User, Printer } from "lucide-react"

interface CompCardModalProps {
  isOpen: boolean
  onClose: () => void
  profile: any
  primaryPhotoUrl?: string
}

export function CompCardModal({ isOpen, onClose, profile, primaryPhotoUrl }: CompCardModalProps) {
  const supabase = createClient()

  // Fetch secondary photos (not primary, max 6, ordered by sort_order)
  const { data: photos = [] } = useQuery({
    queryKey: ["comp-card-photos", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return []
      const { data, error } = await supabase
        .from("media_assets")
        .select("*")
        .eq("owner_id", profile.user_id)
        .eq("type", "photo")
        .eq("is_primary", false)
        .order("sort_order", { ascending: true })
        .limit(6)
      if (error) throw error
      return data
    },
    enabled: isOpen && !!profile?.user_id
  })

  // Fetch categories to show names instead of UUIDs
  const { data: categories = [] } = useQuery({
    queryKey: ["categories-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
      if (error) throw error
      return data
    },
    enabled: isOpen
  })

  if (!isOpen) return null

  // Resolve category names
  const mainCategoryName = categories.find((c: any) => c.id === profile.category_id)?.name || "Talent"
  const subCategoryName = categories.find((c: any) => c.id === profile.sub_category_id)?.name

  // Helpers
  const calculateAge = (dobString: string) => {
    if (!dobString) return "—"
    const today = new Date()
    const birthDate = new Date(dobString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} years`
  }

  const formatHeight = (cm: number) => {
    if (!cm) return "—"
    const totalInches = cm / 2.54
    const feet = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    return `${feet}'${inches}" (${cm} cm)`
  }

  const formatWeight = (kg: number) => {
    if (!kg) return "—"
    return `${kg} kg (${Math.round(kg * 2.20462)} lbs)`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md p-4 overflow-y-auto">
      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-card/60 backdrop-blur-sm sticky top-0 z-10 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-brand-500" />
            <span className="font-heading font-semibold text-lg text-foreground">Digital Comp Card Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/talent/${profile.slug || profile.id}/pdf?type=overview`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card hover:bg-muted text-foreground border border-border text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="h-3.5 w-3.5 text-brand-500" /> Print Overview & Bio
            </a>
            <a
              href={`/api/talent/${profile.slug || profile.id}/pdf?type=full`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" /> Print Full Profile
            </a>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Comp Card Grid Content */}
        <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid md:grid-cols-12 gap-6 md:gap-8">
            
            {/* Left Column: Primary Headshot (large) */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden border border-border bg-muted shadow-sm relative group">
                {primaryPhotoUrl ? (
                  <img 
                    src={primaryPhotoUrl} 
                    alt={profile.stage_name || profile.full_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                    <User className="h-16 w-16 stroke-1 mb-2" />
                    <p className="text-xs">No primary photo uploaded</p>
                  </div>
                )}
                {profile.is_premium && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500 text-white font-semibold text-[10px] shadow-md border border-brand-400/20">
                    <Sparkles className="h-3 w-3 fill-white" /> PREMIUM
                  </span>
                )}
              </div>
            </div>

            {/* Right Column: Bio & Statistics */}
            <div className="md:col-span-7 space-y-6 flex flex-col justify-between">
              
              {/* Title area */}
              <div>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                  {profile.stage_name || profile.full_name}
                </h2>
                <p className="text-brand-500 font-semibold text-sm capitalize mt-1">
                  {mainCategoryName} {subCategoryName ? `• ${subCategoryName}` : ""}
                </p>
              </div>

              {/* Personal details table */}
              <div className="grid grid-cols-2 gap-4 border-y border-border/40 py-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">City</span>
                  <p className="font-medium text-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-brand-500" /> {profile.city || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Age / Gender</span>
                  <p className="font-medium text-foreground mt-0.5 capitalize">
                    {calculateAge(profile.dob)} / {profile.gender?.replace(/_/g, " ") || "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Height</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {formatHeight(profile.height_cm)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Languages</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {profile.languages?.join(", ") || "—"}
                  </p>
                </div>
              </div>

              {/* Bio & Skills */}
              <div className="space-y-4">
                {profile.bio && (
                  <div>
                    <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Biography</h3>
                    <p className="text-sm text-foreground leading-relaxed italic bg-muted/30 p-3.5 rounded-xl border border-border/20">
                      "{profile.bio}"
                    </p>
                  </div>
                )}
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Skills & Specialities</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills?.map((skill: string) => (
                      <span 
                        key={skill} 
                        className="px-2.5 py-1 bg-brand-500/5 text-brand-600 dark:text-brand-400 border border-brand-500/10 rounded-lg text-xs font-semibold"
                      >
                        {skill}
                      </span>
                    )) || <span className="text-xs text-muted-foreground">No skills added</span>}
                  </div>
                </div>
              </div>

              {/* Physical measurements if defined */}
              {profile.measurements_json && (profile.measurements_json.chest || profile.measurements_json.bust || profile.measurements_json.waist || profile.measurements_json.hip) && (
                <div className="bg-muted/40 border border-border/40 p-4 rounded-2xl">
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Measurements</h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-card border border-border/40 p-2 rounded-xl">
                      <span className="text-muted-foreground uppercase text-[10px] tracking-wider font-medium">
                        {profile.gender === "female" ? "Bust" : "Chest"}
                      </span>
                      <p className="font-bold text-foreground text-sm mt-1">
                        {profile.measurements_json.bust || profile.measurements_json.chest || "—"}"
                      </p>
                    </div>
                    <div className="bg-card border border-border/40 p-2 rounded-xl">
                      <span className="text-muted-foreground uppercase text-[10px] tracking-wider font-medium">Waist</span>
                      <p className="font-bold text-foreground text-sm mt-1">
                        {profile.measurements_json.waist || "—"}"
                      </p>
                    </div>
                    <div className="bg-card border border-border/40 p-2 rounded-xl">
                      <span className="text-muted-foreground uppercase text-[10px] tracking-wider font-medium">Hips</span>
                      <p className="font-bold text-foreground text-sm mt-1">
                        {profile.measurements_json.hip || "—"}"
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Photos Grid (up to 6) */}
          {photos.length > 0 && (
            <div className="space-y-3 border-t border-border/40 pt-6">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Portfolio Showcase</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {photos.map((photo: any) => (
                  <div 
                    key={photo.id} 
                    className="aspect-[3/4] rounded-xl overflow-hidden border border-border bg-muted shadow-sm hover:scale-105 transition-transform duration-200"
                  >
                    <img 
                      src={photo.url} 
                      alt="Portfolio thumbnail" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Logo / Path info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-border/40 pt-6 text-xs text-muted-foreground">
            <span className="font-heading font-semibold text-brand-500 tracking-wider">ACTOR'S STUDIO</span>
            <span className="font-mono bg-muted/60 px-3 py-1 rounded-full border border-border/30">
              actorsstudio.pk/talent/{profile.slug || "profile"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
