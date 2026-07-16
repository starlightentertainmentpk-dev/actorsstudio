"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import { 
  Star, 
  MapPin, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  Printer, 
  Mail, 
  Phone, 
  Globe, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Music, 
  Play, 
  Share2,
  Video,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface TalentPortfolioViewProps {
  talent: any
}

// Custom TikTok SVG Icon
const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
)

export default function TalentPortfolioView({ talent }: TalentPortfolioViewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [bioExpanded, setBioExpanded] = useState(false)
  const [enquiryOpen, setEnquiryOpen] = useState(false)
  const [enquiryForm, setEnquiryForm] = useState({ name: "", email: "", message: "" })
  const [enquirySubmitted, setEnquirySubmitted] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const displayName = talent.stage_name || talent.full_name
  const primaryPhoto = talent.media_assets?.find((m: any) => m.is_primary && m.type === "photo")?.url
  const secondaryPhotos = talent.media_assets?.filter((m: any) => !m.is_primary && m.type === "photo").sort((a: any, b: any) => a.sort_order - b.sort_order) || []
  const videos = talent.media_assets?.filter((m: any) => m.type === "video" || m.type === "reel") || []
  const voiceSamples = talent.media_assets?.filter((m: any) => m.type === "voice_sample") || []
  
  const social = talent.measurements_json?.social || {}
  const hasSocial = social.instagram || social.tiktok || social.youtube || social.facebook || social.website

  // Helper formatting functions
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

  // Parse embeddable URL for YouTube or Vimeo
  const getEmbedUrl = (url: string) => {
    if (!url) return null
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    return null
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock enquiry submission
    setEnquirySubmitted(true)
    setTimeout(() => {
      setEnquirySubmitted(false)
      setEnquiryOpen(false)
      setEnquiryForm({ name: "", email: "", message: "" })
    }, 3000)
  }

  // Setup lightbox slides
  const slides = secondaryPhotos.map((photo: any) => ({ src: photo.url }))

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12">
      {/* Hero section */}
      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Portrait Card */}
        <div className="md:col-span-5 lg:col-span-4">
          <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden border border-border/80 bg-muted shadow-lg group">
            {primaryPhoto ? (
              <img 
                src={primaryPhoto} 
                alt={displayName} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-brand-500/5">
                <span className="text-6xl font-extrabold text-brand-500 select-none">
                  {displayName[0].toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground mt-2 font-medium">No Headshot</span>
              </div>
            )}
            
            {/* Availability status badge */}
            {talent.is_available && (
              <div className="absolute top-4 left-4 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold tracking-wider px-3 py-1 rounded-full border border-emerald-400/20 shadow-md">
                AVAILABLE NOW
              </div>
            )}

            {/* Premium badge */}
            {talent.is_premium && (
              <div className="absolute top-4 right-4 bg-amber-500 text-white p-2 rounded-full border border-amber-400/20 shadow-md">
                <Star className="h-4 w-4 fill-white" />
              </div>
            )}
            
            {/* Visual Glass Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Right Column: Name & Call to Actions */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-between h-full space-y-6">
          <div className="space-y-4">
            {/* Badges Row */}
            <div className="flex flex-wrap gap-2 items-center">
              {talent.is_premium && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3 fill-amber-500" /> Premium
                </span>
              )}
              {talent.verification_status === "approved" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5" /> ID Verified
                </span>
              )}
              {talent.union_member && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs font-bold uppercase tracking-wider">
                  Union Member
                </span>
              )}
            </div>

            {/* Name and Categories */}
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-heading text-foreground">
                {displayName}
              </h1>
              <p className="text-lg text-brand-500 font-semibold tracking-wide uppercase">
                {talent.category_name || "Talent"}{talent.sub_category_name ? ` • ${talent.sub_category_name}` : ""}
              </p>
            </div>

            {/* Mini Contact Cards Info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground pt-1">
              {talent.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand-500" /> {talent.city}, Pakistan
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-brand-500" /> {talent.experience_years} Years Experience
              </span>
            </div>
          </div>

          {/* Bio text (expandable) */}
          {talent.bio && (
            <div className="text-foreground leading-relaxed">
              <p className="text-sm md:text-base whitespace-pre-line text-muted-foreground">
                {talent.bio.length > 300 && !bioExpanded
                  ? `${talent.bio.slice(0, 300)}...`
                  : talent.bio
                }
              </p>
              {talent.bio.length > 300 && (
                <button 
                  onClick={() => setBioExpanded(!bioExpanded)} 
                  className="text-brand-500 hover:text-brand-600 font-semibold text-xs mt-2 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {bioExpanded ? (
                    <>Show Less <ChevronUp className="h-3.5 w-3.5" /></>
                  ) : (
                    <>Read More <ChevronDown className="h-3.5 w-3.5" /></>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Social links row */}
          {hasSocial && (
            <div className="flex flex-wrap gap-2 pt-2">
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-brand-500/10 text-muted-foreground hover:text-brand-500 transition-all border border-border/40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              )}
              {social.tiktok && (
                <a href={social.tiktok} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-brand-500/10 text-muted-foreground hover:text-brand-500 transition-all border border-border/40">
                  <TikTokIcon className="h-4 w-4" />
                </a>
              )}
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-brand-500/10 text-muted-foreground hover:text-brand-500 transition-all border border-border/40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                  </svg>
                </a>
              )}
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-brand-500/10 text-muted-foreground hover:text-brand-500 transition-all border border-border/40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              )}
              {social.website && (
                <a href={social.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-brand-500/10 text-muted-foreground hover:text-brand-500 transition-all border border-border/40">
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          )}

          {/* Primary CTA Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border/40">
            <Button 
              onClick={() => setEnquiryOpen(true)}
              className="px-6 py-5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer transition-all flex-1 sm:flex-initial text-center justify-center"
            >
              Book / Enquire Profile
            </Button>
            
            <a 
              href={`/api/talent/${talent.slug}/comp-card`}
              download
              className="hidden md:inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-background hover:bg-muted text-foreground px-5 text-sm font-semibold transition-all shadow-sm cursor-pointer hover:border-brand-500/35 hover:text-brand-500"
            >
              <Printer className="h-4 w-4 mr-2" /> Print Comp Card
            </a>

            <button 
              onClick={handleShare}
              className="p-3.5 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm flex items-center justify-center"
              title="Share profile link"
            >
              {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-card border border-border/60 rounded-3xl p-6 md:p-8 shadow-sm">
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-4">
          Physical Stats & Personal Details
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground/80 font-medium">Height</span>
            <p className="font-semibold text-foreground">{formatHeight(talent.height_cm)}</p>
          </div>
          {talent.weight_kg && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground/80 font-medium">Weight</span>
              <p className="font-semibold text-foreground">{formatWeight(talent.weight_kg)}</p>
            </div>
          )}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground/80 font-medium">Languages</span>
            <p className="font-semibold text-foreground leading-snug">
              {talent.languages && talent.languages.length > 0 ? talent.languages.join(", ") : "—"}
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground/80 font-medium">Experience</span>
            <p className="font-semibold text-foreground">
              {talent.experience_years} {talent.experience_years === 1 ? "Year" : "Years"}
            </p>
          </div>
        </div>

        {/* Chest/Bust Measurements (conditional) */}
        {talent.measurements_json && (talent.measurements_json.chest || talent.measurements_json.bust || talent.measurements_json.waist || talent.measurements_json.hip) && (
          <div className="mt-6 pt-6 border-t border-border/40">
            <span className="text-[10px] text-muted-foreground/85 uppercase tracking-widest font-bold block mb-3">
              Measurements
            </span>
            <div className="flex flex-wrap gap-3">
              {(talent.measurements_json.chest || talent.measurements_json.bust) && (
                <div className="px-4 py-2 bg-muted/40 border border-border/20 rounded-xl text-center min-w-[70px]">
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                    {talent.gender === "female" ? "Bust" : "Chest"}
                  </span>
                  <span className="font-bold text-sm text-foreground">
                    {talent.measurements_json.bust || talent.measurements_json.chest}"
                  </span>
                </div>
              )}
              {talent.measurements_json.waist && (
                <div className="px-4 py-2 bg-muted/40 border border-border/20 rounded-xl text-center min-w-[70px]">
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Waist</span>
                  <span className="font-bold text-sm text-foreground">{talent.measurements_json.waist}"</span>
                </div>
              )}
              {talent.measurements_json.hip && (
                <div className="px-4 py-2 bg-muted/40 border border-border/20 rounded-xl text-center min-w-[70px]">
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Hips</span>
                  <span className="font-bold text-sm text-foreground">{talent.measurements_json.hip}"</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skills List */}
        {talent.skills && talent.skills.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border/40 space-y-2">
            <span className="text-[10px] text-muted-foreground/85 uppercase tracking-widest font-bold block">
              Skills & Specialities
            </span>
            <div className="flex flex-wrap gap-2">
              {talent.skills.map((skill: string) => (
                <span 
                  key={skill} 
                  className="px-3 py-1 bg-brand-500/5 text-brand-600 dark:text-brand-400 border border-brand-500/10 rounded-lg text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photo gallery section */}
      {secondaryPhotos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-heading text-foreground">
            Portfolio Showcase
          </h2>
          <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {secondaryPhotos.map((photo: any, index: number) => (
              <div 
                key={photo.id}
                onClick={() => {
                  setLightboxIndex(index)
                  setLightboxOpen(true)
                }}
                className="break-inside-avoid relative rounded-2xl overflow-hidden border border-border/60 bg-muted cursor-pointer hover:border-brand-500/50 hover:shadow-lg transition-all duration-300"
              >
                <img 
                  src={photo.url} 
                  alt={`Portfolio showcase ${index + 1}`} 
                  className="w-full h-auto object-cover hover:scale-[1.015] transition-transform duration-300"
                />
              </div>
            ))}
          </div>

          {/* Immersive Lightbox */}
          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            index={lightboxIndex}
            slides={slides}
          />
        </div>
      )}

      {/* Video reel section */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-heading text-foreground">
            Video Reels
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {videos.map((video: any) => {
              const embedUrl = getEmbedUrl(video.url)
              return (
                <div key={video.id} className="bg-card border border-border/60 rounded-3xl p-4 shadow-sm flex flex-col space-y-3">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black relative border border-border/40">
                    {embedUrl ? (
                      <iframe 
                        src={embedUrl}
                        className="w-full h-full border-0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      />
                    ) : (
                      <video 
                        src={video.url} 
                        controls 
                        poster={video.thumbnail_url} 
                        className="w-full h-full object-cover" 
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                    <Video className="h-3.5 w-3.5 text-brand-500" />
                    <span>{video.type === "reel" ? "Showreel Video" : "Uploaded Clip"}</span>
                    {video.duration_sec && (
                      <span className="ml-auto">
                        {Math.floor(video.duration_sec / 60)}:{(video.duration_sec % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Voice sample audio section */}
      {voiceSamples.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-heading text-foreground">
            Voice Samples & Audio Clips
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {voiceSamples.map((voice: any) => (
              <div key={voice.id} className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-brand-500/10 rounded-xl text-brand-500">
                    <Music className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Voice Demo File</h4>
                    <span className="text-[10px] text-muted-foreground">Audio Sample Clip</span>
                  </div>
                </div>
                
                <div className="pt-2">
                  <audio src={voice.url} controls className="w-full h-8 accent-brand-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Book / Enquire Modal */}
      <AnimatePresence>
        {enquiryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEnquiryOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            
            {/* Modal card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-card">
                <h3 className="font-heading font-semibold text-lg text-foreground">
                  Inquire / Book {displayName}
                </h3>
                <button 
                  onClick={() => setEnquiryOpen(false)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Instant WhatsApp connection button */}
                <div className="space-y-3">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">
                    Instant WhatsApp Action
                  </span>
                  <a 
                    href={`https://wa.me/923000000000?text=Hi%20ActorsStudio%2C%20I%20am%20interested%20in%20booking/inquiring%20about%20${encodeURIComponent(displayName)}%20(slug%3A%20${talent.slug})`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.73.001-2.595-1.006-5.038-2.834-6.87-1.827-1.83-4.258-2.837-6.858-2.838-5.44 0-9.863 4.372-9.866 9.731-.001 1.772.483 3.5 1.396 5.01L2.091 21.91l6.556-1.756zM17.91 14.53c-.328-.164-1.942-.958-2.242-1.069-.3-.109-.519-.164-.738.164-.219.328-.847 1.069-1.039 1.288-.192.219-.383.246-.71.082-.328-.164-1.385-.51-2.637-1.63-1.054-.94-1.766-2.102-1.972-2.458-.206-.356-.022-.549.143-.712.148-.147.328-.383.492-.575.164-.192.219-.328.328-.548.109-.219.055-.41-.027-.574-.082-.164-.738-1.78-.738-2.203.226-2.138.875-2.215 1.285-2.215.356.002.574.055.738.082.355.056.492.082.738.082.246 0 .574-.082.875-.41.301-.328 1.148-1.122 1.148-2.737 0-1.615-1.176-3.175-1.34-3.394-.164-.219-2.312-3.529-5.599-4.95-1.22-.529-2.172-.847-2.915-1.083-.823-.263-1.572-.226-2.164-.138-.66.098-2.03.83-2.312 1.636-.282.806-.282 1.497-.197 1.637.085.14.301.219.629.383z" />
                    </svg>
                    Contact on WhatsApp
                  </a>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-border/40"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Or Send Email Inquiry</span>
                  <div className="flex-grow border-t border-border/40"></div>
                </div>

                {/* Email Inquiry Form */}
                {enquirySubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-6 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
                  >
                    <Check className="h-8 w-8 text-emerald-500" />
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">Enquiry Sent Successfully</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">We will review your inquiry and get back to you shortly.</p>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleEnquirySubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={enquiryForm.name}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                        placeholder="e.g. Muddasir" 
                        className="w-full bg-muted/50 border border-border px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={enquiryForm.email}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                        placeholder="you@example.com" 
                        className="w-full bg-muted/50 border border-border px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Inquiry / Booking Message</label>
                      <textarea 
                        rows={4}
                        required
                        value={enquiryForm.message}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                        placeholder={`Details about your shoot, budget, or dates for booking ${displayName}...`}
                        className="w-full bg-muted/50 border border-border px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-colors resize-none"
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full py-4 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer text-center justify-center"
                    >
                      Send Enquiry
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
