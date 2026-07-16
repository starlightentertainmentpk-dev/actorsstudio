'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step3Schema } from '@/lib/validations/talent-onboarding'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { z } from 'zod'
import { 
  Globe, 
  Loader2, 
  ChevronLeft,
  Forward
} from 'lucide-react'

interface Step3Props {
  onNext: () => void
  onBack: () => void
  initialData?: any
}

type Step3Values = z.input<typeof step3Schema>

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
)

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88( 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
)

export function OnboardingStep3({ onNext, onBack, initialData }: Step3Props) {
  const { data: user } = useUser()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  // Retrieve existing social links from measurements_json.social
  const existingSocial = initialData?.measurements_json?.social || {}

  const defaultValues = {
    instagram_url: existingSocial.instagram || '',
    tiktok_url: existingSocial.tiktok || '',
    youtube_url: existingSocial.youtube || '',
    facebook_url: existingSocial.facebook || '',
    website_url: existingSocial.website || '',
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues,
  })

  const onSubmit = async (data: Step3Values) => {
    if (!user) return
    setLoading(true)
    setErrorMsg('')

    try {
      const existingMeasurements = initialData?.measurements_json || {}
      const updatedMeasurements = {
        ...existingMeasurements,
        social: {
          instagram: data.instagram_url || '',
          tiktok: data.tiktok_url || '',
          youtube: data.youtube_url || '',
          facebook: data.facebook_url || '',
          website: data.website_url || '',
        }
      }

      const { error } = await supabase
        .from('talent_profiles')
        .update({
          measurements_json: updatedMeasurements,
        })
        .eq('user_id', user.id)

      if (error) throw error
      onNext()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save social links.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card/40 backdrop-blur-md border border-border/40 p-6 md:p-8 rounded-2xl shadow-xl shadow-brand-500/5">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-foreground">Social Profiles</h2>
          <p className="text-sm text-muted-foreground mt-1">Connect your social accounts to showcase your reach.</p>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="text-xs font-semibold text-brand-500 hover:text-brand-600 flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-brand-500/10 transition-all cursor-pointer"
        >
          Skip for now <Forward className="h-3 w-3" />
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 animate-in fade-in-50">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
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
              {...register('instagram_url')}
              placeholder="https://instagram.com/yourusername"
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </div>
          {errors.instagram_url && (
            <p className="text-xs text-destructive mt-1.5">{errors.instagram_url.message}</p>
          )}
        </div>

        {/* TikTok */}
        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            TikTok URL
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-muted-foreground pointer-events-none">
              <TikTokIcon className="h-4 w-4" />
            </span>
            <input
              type="text"
              {...register('tiktok_url')}
              placeholder="https://tiktok.com/@yourusername"
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </div>
          {errors.tiktok_url && (
            <p className="text-xs text-destructive mt-1.5">{errors.tiktok_url.message}</p>
          )}
        </div>

        {/* YouTube */}
        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            YouTube Channel URL
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-muted-foreground pointer-events-none">
              <YoutubeIcon className="h-4 w-4" />
            </span>
            <input
              type="text"
              {...register('youtube_url')}
              placeholder="https://youtube.com/@yourchannel"
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </div>
          {errors.youtube_url && (
            <p className="text-xs text-destructive mt-1.5">{errors.youtube_url.message}</p>
          )}
        </div>

        {/* Facebook */}
        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Facebook Profile URL
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-muted-foreground pointer-events-none">
              <FacebookIcon className="h-4 w-4" />
            </span>
            <input
              type="text"
              {...register('facebook_url')}
              placeholder="https://facebook.com/yourprofile"
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </div>
          {errors.facebook_url && (
            <p className="text-xs text-destructive mt-1.5">{errors.facebook_url.message}</p>
          )}
        </div>

        {/* Website */}
        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Personal Website URL
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-muted-foreground pointer-events-none">
              <Globe className="h-4 w-4" />
            </span>
            <input
              type="text"
              {...register('website_url')}
              placeholder="https://yourwebsite.com"
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
          </div>
          {errors.website_url && (
            <p className="text-xs text-destructive mt-1.5">{errors.website_url.message}</p>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-border/40">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="flex items-center gap-2 border-border/60 hover:bg-muted text-foreground transition-all cursor-pointer font-semibold"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

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
            'Continue to Portfolio'
          )}
        </Button>
      </div>
    </form>
  )
}
