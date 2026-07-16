'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { step4Schema } from '@/lib/validations/talent-onboarding'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { uniqueSlug } from '@/lib/utils/slug'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { 
  Upload, 
  Video, 
  Loader2, 
  ChevronLeft, 
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step4Props {
  onBack: () => void
  initialData?: any
}

type Step4Values = z.infer<typeof step4Schema>

export function OnboardingStep4({ onBack, initialData }: Step4Props) {
  const { data: user } = useUser()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const supabase = createClient()

  const defaultValues = {
    profile_photo_url: '',
    reel_url: '',
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Step4Values>({
    resolver: zodResolver(step4Schema),
    defaultValues,
  })

  const profilePhotoUrl = watch('profile_photo_url')

  // Fetch initial primary image and reel if exists
  useState(() => {
    const fetchExistingMedia = async () => {
      if (!user) return
      const { data: assets } = await supabase
        .from('media_assets')
        .select('*')
        .eq('owner_id', user.id)

      if (assets) {
        const primaryPhoto = assets.find(a => a.type === 'photo' && a.is_primary)
        if (primaryPhoto) {
          setValue('profile_photo_url', primaryPhoto.url, { shouldValidate: true })
          setPreviewUrl(primaryPhoto.url)
        }
        const reel = assets.find(a => a.type === 'reel')
        if (reel) {
          setValue('reel_url', reel.url)
        }
      }
    }
    fetchExistingMedia()
  })

  const handleFileUpload = async (file: File) => {
    if (!user) return
    setErrorMsg('')

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size must be under 5 MB.')
      return
    }

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Only JPEG, PNG, and WebP images are allowed.')
      return
    }

    setUploading(true)
    try {
      // Local preview
      const localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)

      // Upload to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/profile/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('talent-media')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('talent-media')
        .getPublicUrl(filePath)

      // Set any existing primary photo for this user to is_primary = false
      await supabase
        .from('media_assets')
        .update({ is_primary: false })
        .eq('owner_id', user.id)
        .eq('type', 'photo')

      // Insert new primary photo
      const { error: assetError } = await supabase
        .from('media_assets')
        .insert({
          owner_id: user.id,
          type: 'photo',
          url: publicUrl,
          is_primary: true,
          file_size_bytes: file.size,
        })

      if (assetError) throw assetError

      setValue('profile_photo_url', publicUrl, { shouldValidate: true })
      setPreviewUrl(publicUrl)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload photo.')
      setPreviewUrl('')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const onSubmit = async (data: Step4Values) => {
    if (!user) return
    setSubmitting(true)
    setErrorMsg('')

    try {
      // 1. Save/Update reel in media_assets if provided
      if (data.reel_url) {
        const { data: existingReel } = await supabase
          .from('media_assets')
          .select('id')
          .eq('owner_id', user.id)
          .eq('type', 'reel')
          .maybeSingle()

        if (existingReel) {
          await supabase
            .from('media_assets')
            .update({ url: data.reel_url })
            .eq('id', existingReel.id)
        } else {
          await supabase
            .from('media_assets')
            .insert({
              owner_id: user.id,
              type: 'reel',
              url: data.reel_url,
            })
        }
      }

      // 2. Generate slug & Update profile verification status
      const nameToUse = initialData?.stage_name || initialData?.full_name || 'talent'
      const slug = await uniqueSlug(nameToUse, supabase)

      const { error: profileError } = await supabase
        .from('talent_profiles')
        .update({
          verification_status: 'pending',
          slug: slug,
        })
        .eq('user_id', user.id)

      if (profileError) throw profileError

      // Redirect to talent dashboard
      router.push('/talent/dashboard')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete onboarding.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card/40 backdrop-blur-md border border-border/40 p-6 md:p-8 rounded-2xl shadow-xl shadow-brand-500/5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Portfolio & Media</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload your headshot and link your reel to complete your profile.</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div>
        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
          Profile Photo *
        </label>
        
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={cn(
            "border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px]",
            profilePhotoUrl 
              ? "border-brand-500 bg-brand-500/5" 
              : "border-border hover:border-brand-500/50 hover:bg-muted/30"
          )}
          onClick={() => {
            const input = document.getElementById('photo-input')
            input?.click()
          }}
        >
          <input
            id="photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0])
              }
            }}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
              <p className="text-sm font-semibold text-muted-foreground">Uploading headshot...</p>
            </div>
          ) : previewUrl ? (
            <div className="relative group max-w-xs rounded-lg overflow-hidden border border-border">
              <img src={previewUrl} alt="Preview" className="h-40 w-40 object-cover rounded-full mx-auto shadow-md" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <p className="text-white text-xs font-bold flex items-center gap-1"><Upload className="h-3 w-3" /> Change Photo</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">Drag and drop your image here</p>
                <p className="text-xs">or click to browse from device</p>
              </div>
              <p className="text-[10px] bg-muted px-2 py-1 rounded-md mt-2">JPEG, PNG, WebP • Max 5 MB</p>
            </div>
          )}
        </div>
        {errors.profile_photo_url && (
          <p className="text-xs text-destructive mt-1.5">{errors.profile_photo_url.message}</p>
        )}
      </div>

      {/* Reel URL */}
      <div>
        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
          Showreel URL <span className="text-muted-foreground font-normal">(Optional)</span>
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-muted-foreground pointer-events-none">
            <Video className="h-4 w-4" />
          </span>
          <input
            type="text"
            {...register('reel_url')}
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all"
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Provide a link to your video portfolio (YouTube or Vimeo).</p>
        {errors.reel_url && (
          <p className="text-xs text-destructive mt-1.5">{errors.reel_url.message}</p>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-border/40">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          disabled={submitting}
          className="flex items-center gap-2 border-border/60 hover:bg-muted text-foreground transition-all cursor-pointer font-semibold"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        <Button
          type="submit"
          disabled={submitting || uploading}
          className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-2 rounded-xl transition-all shadow-md shadow-brand-500/20 active:scale-95 duration-200"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing...
            </>
          ) : (
            'Complete Registration'
          )}
        </Button>
      </div>
    </form>
  )
}
