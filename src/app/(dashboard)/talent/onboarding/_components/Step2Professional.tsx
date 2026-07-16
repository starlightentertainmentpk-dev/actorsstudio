'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step2Schema } from '@/lib/validations/talent-onboarding'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { z } from 'zod'
import { 
  Clapperboard, 
  Camera, 
  Mic, 
  Music, 
  Sparkles, 
  Flame, 
  Baby, 
  Loader2, 
  Plus, 
  X, 
  Check,
  ChevronLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step2Props {
  onNext: () => void
  onBack: () => void
  initialData?: any
}

type Step2Values = z.input<typeof step2Schema>

const ICON_MAP: Record<string, any> = {
  'actor': Clapperboard,
  'model': Camera,
  'voice-artist': Mic,
  'dancer': Flame,
  'musician': Music,
  'influencer': Sparkles,
  'child-artist': Baby,
}

const LANGUAGES = ['Urdu', 'English', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi', 'Other']

const PRESET_SKILLS = [
  'Acting', 'Modeling', 'Hosting', 'Dubbing', 'Voiceover', 
  'Classical Dancing', 'Hip Hop', 'Singing', 'Guitar', 
  'Improvisation', 'Monologues', 'Stunts'
]

export function OnboardingStep2({ onNext, onBack, initialData }: Step2Props) {
  const { data: user } = useUser()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const supabase = createClient()

  // Fetch categories using React Query
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data
    }
  })

  const parentCategories = categories?.filter(c => !c.parent_id) || []

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      category_id: initialData?.category_id || '',
      sub_category_id: initialData?.sub_category_id || '',
      experience_years: initialData?.experience_years ?? 0,
      languages: initialData?.languages || [],
      skills: initialData?.skills || [],
      union_member: initialData?.union_member ?? false,
      is_available: initialData?.is_available ?? true,
      bio: initialData?.bio || '',
      height_cm: initialData?.height_cm || undefined,
      weight_kg: initialData?.weight_kg || undefined,
    }
  })

  const selectedCategoryId = watch('category_id')
  const selectedLanguages = (watch('languages') || []) as string[]
  const selectedSkills = (watch('skills') || []) as string[]
  const bioText = (watch('bio') || '') as string

  const subCategories = categories?.filter(c => c.parent_id === selectedCategoryId) || []

  const handleLanguageToggle = (lang: string) => {
    const updated = selectedLanguages.includes(lang)
      ? selectedLanguages.filter((l: string) => l !== lang)
      : [...selectedLanguages, lang]
    setValue('languages', updated, { shouldValidate: true })
  }

  const handleAddSkill = (skillToAdd: string) => {
    const cleaned = skillToAdd.trim()
    if (!cleaned) return
    if (selectedSkills.includes(cleaned)) {
      setNewSkill('')
      return
    }
    setValue('skills', [...selectedSkills, cleaned], { shouldValidate: true })
    setNewSkill('')
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setValue('skills', selectedSkills.filter((s: string) => s !== skillToRemove), { shouldValidate: true })
  }

  const onSubmit = async (data: Step2Values) => {
    if (!user) return
    setLoading(true)
    setErrorMsg('')

    try {
      const { error } = await supabase
        .from('talent_profiles')
        .update({
          category_id: data.category_id,
          sub_category_id: data.sub_category_id || null,
          experience_years: Number(data.experience_years),
          languages: data.languages as string[],
          skills: data.skills as string[],
          union_member: !!data.union_member,
          is_available: !!data.is_available,
          bio: data.bio || null,
          height_cm: data.height_cm ? Number(data.height_cm) : null,
          weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
        })
        .eq('user_id', user.id)

      if (error) throw error
      onNext()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save professional info.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card/40 backdrop-blur-md border border-border/40 p-6 md:p-8 rounded-2xl shadow-xl shadow-brand-500/5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Professional Info</h2>
        <p className="text-sm text-muted-foreground mt-1">Tell us about your industry experience and skills.</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 animate-in fade-in-50">
          {errorMsg}
        </div>
      )}

      {/* Primary Category selection cards */}
      <div>
        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
          Select Main Category *
        </label>
        {categoriesLoading ? (
          <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
            Loading categories...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {parentCategories.map(cat => {
              const Icon = ICON_MAP[cat.slug] || Sparkles
              const isSelected = selectedCategoryId === cat.id

              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => {
                    setValue('category_id', cat.id, { shouldValidate: true })
                    setValue('sub_category_id', '') // reset subcategory on parent change
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border bg-background/30 text-center transition-all duration-300 hover:border-brand-500/50 group cursor-pointer",
                    isSelected 
                      ? "border-brand-500 bg-brand-500/10 text-brand-500 shadow-md shadow-brand-500/10" 
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-6 w-6 mb-2 transition-transform group-hover:scale-110", isSelected ? "text-brand-500" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="text-xs font-semibold">{cat.name}</span>
                </button>
              )
            })}
          </div>
        )}
        {errors.category_id && (
          <p className="text-xs text-destructive mt-1.5">{errors.category_id.message}</p>
        )}
      </div>

      {/* Conditionally render Sub-category if parent selected */}
      {selectedCategoryId && subCategories.length > 0 && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Sub-Category
          </label>
          <select
            {...register('sub_category_id')}
            className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
          >
            <option value="">Select Sub-Category</option>
            {subCategories.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
          {errors.sub_category_id && (
            <p className="text-xs text-destructive mt-1.5">{errors.sub_category_id.message}</p>
          )}
        </div>
      )}

      {/* Experience Slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
            Years of Experience *
          </label>
          <span className="text-sm font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded">
            {watch('experience_years') as number} {watch('experience_years') === 1 ? 'Year' : 'Years'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="30"
          {...register('experience_years')}
          className="w-full accent-brand-500 bg-muted rounded-lg appearance-none h-1.5 cursor-pointer"
        />
        {errors.experience_years && (
          <p className="text-xs text-destructive mt-1.5">{errors.experience_years.message}</p>
        )}
      </div>

      {/* Languages Checkboxes */}
      <div>
        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
          Languages Spoken *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LANGUAGES.map(lang => {
            const isChecked = selectedLanguages.includes(lang)
            return (
              <button
                type="button"
                key={lang}
                onClick={() => handleLanguageToggle(lang)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-medium bg-background/30 text-left transition-all cursor-pointer",
                  isChecked 
                    ? "border-brand-500 bg-brand-500/10 text-brand-500" 
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn("h-4 w-4 border rounded flex items-center justify-center transition-colors", isChecked ? "border-brand-500 bg-brand-500 text-white" : "border-muted")}>
                  {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                {lang}
              </button>
            )
          })}
        </div>
        {errors.languages && (
          <p className="text-xs text-destructive mt-1.5">{errors.languages.message}</p>
        )}
      </div>

      {/* Skills tags input */}
      <div>
        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
          Skills / Talents
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Type a skill and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddSkill(newSkill)
              }
            }}
            className="flex-1 h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
          />
          <button
            type="button"
            onClick={() => handleAddSkill(newSkill)}
            className="h-10 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-sm font-semibold flex items-center justify-center transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </button>
        </div>

        {/* Selected skills list */}
        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {selectedSkills.map((skill: string) => (
              <span 
                key={skill} 
                className="inline-flex items-center gap-1 bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-semibold pl-2.5 pr-1.5 py-1 rounded-full animate-in zoom-in-95 duration-150"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="rounded-full hover:bg-brand-500/20 p-0.5 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Preset skills helper suggestions */}
        <div className="mt-3">
          <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">Suggestions (click to add):</p>
          <div className="flex flex-wrap gap-1">
            {PRESET_SKILLS.map(preset => {
              const isAdded = selectedSkills.includes(preset)
              if (isAdded) return null
              return (
                <button
                  type="button"
                  key={preset}
                  onClick={() => handleAddSkill(preset)}
                  className="text-[10px] font-semibold px-2 py-0.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded transition-all cursor-pointer"
                >
                  + {preset}
                </button>
              )
            })}
          </div>
        </div>
        {errors.skills && (
          <p className="text-xs text-destructive mt-1.5">{errors.skills.message}</p>
        )}
      </div>

      {/* Bio Textarea */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
            Bio
          </label>
          <span className="text-[10px] text-muted-foreground">
            {bioText.length} / 1000 characters
          </span>
        </div>
        <textarea
          {...register('bio')}
          rows={4}
          placeholder="Tell casting directors about yourself, your style, and what you love doing..."
          maxLength={1000}
          className="w-full p-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all resize-none"
        />
        {errors.bio && (
          <p className="text-xs text-destructive mt-1.5">{errors.bio.message}</p>
        )}
      </div>

      {/* Height / Weight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Height <span className="text-muted-foreground font-normal">(cm - optional)</span>
          </label>
          <input
            type="number"
            {...register('height_cm')}
            placeholder="e.g. 175"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
          />
          {errors.height_cm && (
            <p className="text-xs text-destructive mt-1.5">{errors.height_cm.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Weight <span className="text-muted-foreground font-normal">(kg - optional)</span>
          </label>
          <input
            type="number"
            {...register('weight_kg')}
            placeholder="e.g. 68"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
          />
          {errors.weight_kg && (
            <p className="text-xs text-destructive mt-1.5">{errors.weight_kg.message}</p>
          )}
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col sm:flex-row gap-4 border-t border-border/40 pt-4">
        {/* Union member */}
        <label className="flex items-center gap-3 cursor-pointer flex-1">
          <input
            type="checkbox"
            {...register('union_member')}
            className="w-4 h-4 rounded text-brand-500 border-input focus:ring-brand-500 cursor-pointer"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">Union Member</p>
            <p className="text-[10px] text-muted-foreground">Are you a registered member of any acting/media union?</p>
          </div>
        </label>

        {/* Availability */}
        <label className="flex items-center gap-3 cursor-pointer flex-1">
          <input
            type="checkbox"
            {...register('is_available')}
            className="w-4 h-4 rounded text-brand-500 border-input focus:ring-brand-500 cursor-pointer"
          />
          <div>
            <p className="text-sm font-semibold text-foreground">Available for Work</p>
            <p className="text-[10px] text-muted-foreground">Turn this off if you are not currently accepting casting bookings.</p>
          </div>
        </label>
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
            'Continue to Social Links'
          )}
        </Button>
      </div>
    </form>
  )
}
