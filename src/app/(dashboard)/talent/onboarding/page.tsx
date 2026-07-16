'use client'

import { useState, useEffect } from 'react'
import { OnboardingStep1 } from './_components/Step1Personal'
import { OnboardingStep2 } from './_components/Step2Professional'
import { OnboardingStep3 } from './_components/Step3Social'
import { OnboardingStep4 } from './_components/Step4Portfolio'
import { ProgressBar } from './_components/ProgressBar'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

const STEPS = ['Personal', 'Professional', 'Social', 'Portfolio']

export default function TalentOnboardingPage() {
  const { user, isLoading: authLoading } = useRequireAuth('talent')
  const [step, setStep] = useState(1)
  const [profileData, setProfileData] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      if (!user) return
      try {
        // Fetch profile
        const { data: profile } = await supabase
          .from('talent_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        // Fetch media assets
        const { data: assets } = await supabase
          .from('media_assets')
          .select('id')
          .eq('owner_id', user.id)
          .eq('type', 'photo')
          .eq('is_primary', true)

        if (profile) {
          setProfileData(profile)

          // Determine first incomplete step
          if (!profile.full_name || !profile.city) {
            setStep(1)
          } else if (!profile.category_id || !profile.languages || profile.languages.length === 0) {
            setStep(2)
          } else if (!(profile.measurements_json as any)?.social) {
            setStep(3)
          } else if (!assets || assets.length === 0) {
            setStep(4)
          } else {
            setStep(4)
          }
        }
      } catch (err) {
        console.error('Error loading onboarding data:', err)
      } finally {
        setDataLoading(false)
      }
    }

    if (user) {
      loadProfile()
    }
  }, [user, supabase])

  const next = async () => {
    if (user) {
      const { data } = await supabase
        .from('talent_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) setProfileData(data)
    }
    setStep(s => Math.min(s + 1, 4))
  }

  const prev = () => setStep(s => Math.max(s - 1, 1))

  if (authLoading || dataLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          <p className="text-xs text-muted-foreground">Loading your onboarding session...</p>
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
          Let's set up your professional talent profile.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4">
        {/* Progress Bar */}
        <div className="bg-card/20 border border-border/40 px-6 py-4 rounded-2xl mb-6 backdrop-blur-sm">
          <ProgressBar steps={STEPS} current={step} />
        </div>

        {/* Wizard Form Wrapper */}
        <div className="relative">
          {step === 1 && (
            <OnboardingStep1 
              onNext={next} 
              initialData={profileData} 
            />
          )}
          {step === 2 && (
            <OnboardingStep2 
              onNext={next} 
              onBack={prev} 
              initialData={profileData} 
            />
          )}
          {step === 3 && (
            <OnboardingStep3 
              onNext={next} 
              onBack={prev} 
              initialData={profileData} 
            />
          )}
          {step === 4 && (
            <OnboardingStep4 
              onBack={prev} 
              initialData={profileData} 
            />
          )}
        </div>
      </div>
    </div>
  )
}
