'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step1Schema } from '@/lib/validations/talent-onboarding'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'

interface Step1Props {
  onNext: () => void
  initialData?: any
}

type Step1Values = z.input<typeof step1Schema>

const CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 
  'Peshawar', 'Quetta', 'Multan', 'Sialkot', 'Hyderabad', 
  'Sukkur', 'Abbottabad', 'Other'
]

export function OnboardingStep1({ onNext, initialData }: Step1Props) {
  const { data: user } = useUser()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  // Format DOB from Date object to YYYY-MM-DD string for input value
  const defaultValues = {
    full_name: initialData?.full_name || '',
    stage_name: initialData?.stage_name || '',
    dob: initialData?.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
    gender: initialData?.gender || 'prefer_not_to_say',
    city: initialData?.city || '',
    phone: initialData?.phone || '',
  }

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues,
  })

  const onSubmit = async (data: Step1Values) => {
    if (!user) return
    setLoading(true)
    setErrorMsg('')

    try {
      // Update public.users table with phone
      const { error: userError } = await supabase
        .from('users')
        .update({ phone: data.phone || null })
        .eq('id', user.id)

      if (userError) throw userError

      // Upsert talent_profiles
      const { error } = await supabase
        .from('talent_profiles')
        .upsert({
          user_id: user.id,
          full_name: data.full_name,
          stage_name: data.stage_name || null,
          dob: data.dob || null,
          gender: data.gender || null,
          city: data.city,
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error
      onNext()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save personal info.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card/40 backdrop-blur-md border border-border/40 p-6 md:p-8 rounded-2xl shadow-xl shadow-brand-500/5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Personal Details</h2>
        <p className="text-sm text-muted-foreground mt-1">Let's start with your basics.</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 animate-in fade-in-50">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Full Name *
          </label>
          <input
            {...register('full_name')}
            placeholder="e.g. Muddasir Malik"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
          />
          {errors.full_name && (
            <p className="text-xs text-destructive mt-1.5">{errors.full_name.message}</p>
          )}
        </div>

        {/* Stage Name */}
        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Stage Name <span className="text-muted-foreground font-normal">(Optional)</span>
          </label>
          <input
            {...register('stage_name')}
            placeholder="e.g. Maddy Malik"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
          />
          <p className="text-[10px] text-muted-foreground mt-1">Name used on screen/stage.</p>
          {errors.stage_name && (
            <p className="text-xs text-destructive mt-1.5">{errors.stage_name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* DOB */}
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              Date of Birth <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              {...register('dob')}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
            />
            {errors.dob && (
              <p className="text-xs text-destructive mt-1.5">{errors.dob.message}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              Gender
            </label>
            <select
              {...register('gender')}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-binary</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
            {errors.gender && (
              <p className="text-xs text-destructive mt-1.5">{errors.gender.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              City *
            </label>
            <select
              {...register('city')}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
            >
              <option value="">Select your city</option>
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {errors.city && (
              <p className="text-xs text-destructive mt-1.5">{errors.city.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              Phone Number <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm text-muted-foreground font-medium select-none pointer-events-none">
                +92
              </span>
              <input
                type="text"
                placeholder="3001234567"
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '') // remove non-digits
                  if (val.startsWith('92')) {
                    val = val.slice(2)
                  } else if (val.startsWith('0')) {
                    val = val.slice(1)
                  }
                  // Slice to 10 digits
                  val = val.slice(0, 10)
                  
                  // Update the react-hook-form value with +92 prefix
                  if (val) {
                    setValue('phone', `+92${val}`, { shouldValidate: true })
                  } else {
                    setValue('phone', '', { shouldValidate: true })
                  }
                }}
                defaultValue={
                  initialData?.phone
                    ? initialData.phone.replace(/^\+92/, '').replace(/^0/, '')
                    : ''
                }
                className="w-full h-10 pl-12 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
              />
              {/* Hidden input to hold the actual value registered with react-hook-form */}
              <input type="hidden" {...register('phone')} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Enter your 10-digit number (e.g. 3001234567).</p>
            {errors.phone && (
              <p className="text-xs text-destructive mt-1.5">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
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
            'Continue to Professional Info'
          )}
        </Button>
      </div>
    </form>
  )
}
