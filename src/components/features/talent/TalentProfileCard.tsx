"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Star, MapPin, Award, Mail, Phone, Bookmark, Send, Check } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

type TalentProfileCardProps = {
  talent: {
    id: string
    user_id?: string
    full_name: string
    stage_name?: string
    slug: string
    primary_photo_url?: string
    category: string
    city?: string
    experience_years: number
    is_premium: boolean
    skills: string[]
    contactInfo?: { email: string; phone?: string | null }
  }
  mode?: "public" | "producer"
  isVerified?: boolean
}

export function TalentProfileCard({ talent, mode = "public", isVerified = false }: TalentProfileCardProps) {
  const displayName = talent.stage_name || talent.full_name
  const isProducerMode = mode === "producer"

  // Shortlist state
  const [isShortlisted, setIsShortlisted] = useState(false)
  // Invite state
  const [isInvited, setIsInvited] = useState(false)

  // Load shortlist status from localStorage
  useEffect(() => {
    if (isProducerMode) {
      try {
        const shortlist = JSON.parse(localStorage.getItem("producer_shortlist") || "[]")
        setIsShortlisted(shortlist.includes(talent.id))
      } catch (e) {
        console.error("Error reading shortlist from localStorage", e)
      }
    }
  }, [talent.id, isProducerMode])

  const toggleShortlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const shortlist = JSON.parse(localStorage.getItem("producer_shortlist") || "[]")
      let updatedShortlist: string[]
      if (isShortlisted) {
        updatedShortlist = shortlist.filter((id: string) => id !== talent.id)
        setIsShortlisted(false)
      } else {
        updatedShortlist = [...shortlist, talent.id]
        setIsShortlisted(true)
      }
      localStorage.setItem("producer_shortlist", JSON.stringify(updatedShortlist))
    } catch (err) {
      console.error("Error updating shortlist", err)
    }
  }

  const handleInvite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isInvited) return

    // Stub dispatchNotification
    console.log(`Dispatched invitation notification to talent ${talent.id}`)
    setIsInvited(true)
    
    // Reset invite button state after 3 seconds
    setTimeout(() => {
      setIsInvited(false)
    }, 3000)
  }

  // Premium card styling classes
  const premiumCardClasses = talent.is_premium
    ? "border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.08)] dark:border-amber-500/30 hover:border-amber-500/60"
    : "border-border/60 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5"

  return (
    <Link href={`/talent/${talent.slug}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={`group relative flex flex-col h-full bg-card border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${premiumCardClasses}`}
      >
        {/* Profile Headshot thumbnail */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
          {talent.primary_photo_url ? (
            <img
              src={talent.primary_photo_url}
              alt={displayName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-brand-500/5">
              <span className="text-3xl font-extrabold text-brand-500">
                {displayName[0].toUpperCase()}
              </span>
              <span className="text-[10px] text-muted-foreground mt-1">No Headshot</span>
            </div>
          )}

          {/* Premium gold star badge */}
          {talent.is_premium && (
            <div className="absolute top-3 right-3 flex items-center justify-center h-7 w-7 rounded-full bg-amber-500 text-white shadow-md border border-amber-400/20 z-10">
              <Star className="h-4 w-4 fill-white" />
            </div>
          )}

          {/* Category overlay */}
          <div className="absolute bottom-3 left-3 z-10">
            <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
              {talent.category}
            </span>
          </div>

          {/* Quick actions for Producers on image hover/top */}
          {isProducerMode && (
            <button
              onClick={toggleShortlist}
              className={`absolute top-3 left-3 p-1.5 rounded-full shadow-md backdrop-blur-md transition-colors z-10 cursor-pointer ${
                isShortlisted 
                  ? "bg-brand-500 text-white hover:bg-brand-600" 
                  : "bg-black/40 text-white/80 hover:bg-black/60 hover:text-white"
              }`}
              title={isShortlisted ? "Remove from Shortlist" : "Save to Shortlist"}
            >
              <Bookmark className={`h-4 w-4 ${isShortlisted ? "fill-white" : ""}`} />
            </button>
          )}
        </div>

        {/* Card info content */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-base text-foreground group-hover:text-brand-500 transition-colors line-clamp-1">
              {displayName}
            </h3>
            
            {/* Experience and Location */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {talent.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-brand-500" /> {talent.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3 text-brand-500" /> {talent.experience_years} {talent.experience_years === 1 ? "year" : "years"}
              </span>
            </div>
          </div>

          {/* Contact Details (Producer-only, verified-only) */}
          {isProducerMode && (
            <div className="border-t border-border/40 pt-2.5 space-y-1 text-xs">
              {isVerified && talent.contactInfo ? (
                <>
                  <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors truncate">
                    <Mail className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                    <span>{talent.contactInfo.email}</span>
                  </div>
                  {talent.contactInfo.phone && (
                    <div className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors truncate">
                      <Phone className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                      <span>{talent.contactInfo.phone}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-muted/40 text-muted-foreground rounded-lg p-2 text-[10px] leading-snug border border-border/20 text-center font-medium">
                  {isVerified ? "No contact info available" : "Verify account to view contact info"}
                </div>
              )}
            </div>
          )}

          {/* Skills tags list */}
          {talent.skills && talent.skills.length > 0 && (
            <div className="pt-2.5 border-t border-border/40 flex flex-wrap gap-1">
              {talent.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="px-1.5 py-0.5 bg-muted text-[10px] font-semibold text-muted-foreground rounded-md"
                >
                  {skill}
                </span>
              ))}
              {talent.skills.length > 3 && (
                <span className="text-[9px] text-muted-foreground font-semibold px-1 py-0.5">
                  +{talent.skills.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Invite button (Producer-only) */}
          {isProducerMode && (
            <div className="pt-1.5">
              <Button
                type="button"
                onClick={handleInvite}
                variant={isInvited ? "outline" : "default"}
                className={`w-full font-bold text-xs h-7 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  isInvited
                    ? "border-green-500 text-green-500 hover:bg-green-500/5 bg-transparent"
                    : "bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/5"
                }`}
              >
                {isInvited ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Invited!
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3" /> Invite to Apply
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  )
}
