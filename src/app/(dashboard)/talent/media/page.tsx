"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { 
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { 
  Loader2, 
  Upload, 
  Trash2, 
  Plus, 
  X, 
  Play, 
  Music, 
  FileText, 
  Download,
  AlertCircle,
  Video,
  ExternalLink,
  Sparkles,
  Check
} from "lucide-react"

// Sortable Photo Card Sub-component
function SortablePhotoCard({ photo, onSetPrimary, onDelete }: { photo: any, onSetPrimary: (id: string) => void, onDelete: (photo: any) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="relative group aspect-[3/4] rounded-xl overflow-hidden border border-border/50 bg-muted/30 shadow-xs hover:shadow-md hover:border-border transition-all"
    >
      <img src={photo.url} alt="Portfolio asset" className="w-full h-full object-cover" />
      
      {/* Drag handle area on hover */}
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-grab active:cursor-grabbing transition-opacity"
      >
        <span className="text-white text-xs font-semibold bg-black/60 px-2.5 py-1 rounded-md">
          Drag to Reorder
        </span>
      </div>

      {/* Primary Badge or Set Primary Action */}
      {photo.is_primary ? (
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500 text-white font-semibold text-[10px] border border-brand-400/20 shadow-sm">
          <Sparkles className="h-3 w-3 fill-white" /> Primary
        </span>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onSetPrimary(photo.id); }}
          className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-brand-500 text-white text-[10px] font-semibold transition-all cursor-pointer border border-white/10"
        >
          Set Primary
        </button>
      )}

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(photo); }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-black/75 hover:bg-destructive text-white transition-all cursor-pointer border border-white/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function TalentMediaPage() {
  const { data: user } = useUser()
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch photos
  const { data: dbPhotos = [], isLoading: photosLoading } = useQuery({
    queryKey: ["media-photos", user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from("media_assets")
        .select("*")
        .eq("owner_id", user.id)
        .eq("type", "photo")
        .order("sort_order", { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Local state for photos to manage dragging instantly
  const [photos, setPhotos] = useState<any[]>([])
  useEffect(() => {
    setPhotos(dbPhotos)
  }, [dbPhotos])

  // Fetch videos, audios, and resume
  const { data: otherAssets = [], isLoading: othersLoading } = useQuery({
    queryKey: ["media-others", user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from("media_assets")
        .select("*")
        .eq("owner_id", user.id)
        .in("type", ["video", "reel", "voice_sample", "resume"])
        .order("uploaded_at", { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  const videos = otherAssets.filter(a => a.type === "video" || a.type === "reel")
  const voiceSamples = otherAssets.filter(a => a.type === "voice_sample")
  const resumes = otherAssets.filter(a => a.type === "resume")

  // UI state for Modals
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [audioModalOpen, setAudioModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedAssetToDelete, setSelectedAssetToDelete] = useState<any>(null)

  // Action status state
  const [actionLoading, setActionLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState("")

  // Form states inside modals
  const [videoType, setVideoType] = useState<"link" | "file">("link")
  const [videoUrlInput, setVideoUrlInput] = useState("")
  const [videoTitleInput, setVideoTitleInput] = useState("")

  // Drag End handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = photos.findIndex(p => p.id === active.id)
    const newIndex = photos.findIndex(p => p.id === over.id)
    const reordered = arrayMove(photos, oldIndex, newIndex)

    setPhotos(reordered)

    // Save sort_order to database in batch
    try {
      const promises = reordered.map((photo, idx) => 
        supabase.from("media_assets").update({ sort_order: idx }).eq("id", photo.id)
      )
      await Promise.all(promises)
      queryClient.invalidateQueries({ queryKey: ["media-photos", user?.id] })
    } catch (err) {
      console.error("Failed to save reordered photo sequence", err)
    }
  }

  // Set Primary Photo handler
  const handleSetPrimary = async (photoId: string) => {
    if (!user?.id) return
    setActionLoading(true)
    try {
      // 1. Reset all photos is_primary = false
      await supabase
        .from("media_assets")
        .update({ is_primary: false })
        .eq("owner_id", user.id)
        .eq("type", "photo")

      // 2. Set chosen photo is_primary = true
      await supabase
        .from("media_assets")
        .update({ is_primary: true })
        .eq("id", photoId)

      queryClient.invalidateQueries({ queryKey: ["media-photos", user?.id] })
      queryClient.invalidateQueries({ queryKey: ["talent-profile-edit", user?.id] })
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Asset handler
  const triggerDeleteConfirm = (asset: any) => {
    setSelectedAssetToDelete(asset)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteAsset = async () => {
    if (!selectedAssetToDelete || !user?.id) return
    setActionLoading(true)
    setErrorMsg("")

    try {
      // If it's an uploaded file in supabase storage, remove it first
      const isUploadedStorage = selectedAssetToDelete.url.includes("/talent-media/")
      if (isUploadedStorage) {
        const pathParts = selectedAssetToDelete.url.split("/talent-media/")
        if (pathParts[1]) {
          const filePath = decodeURIComponent(pathParts[1])
          const { error: removeError } = await supabase.storage
            .from("talent-media")
            .remove([filePath])
          if (removeError) console.error("Storage delete warning:", removeError)
        }
      }

      // Delete from DB table
      const { error: dbError } = await supabase
        .from("media_assets")
        .delete()
        .eq("id", selectedAssetToDelete.id)
      
      if (dbError) throw dbError

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["media-photos", user?.id] })
      queryClient.invalidateQueries({ queryKey: ["media-others", user?.id] })
      queryClient.invalidateQueries({ queryKey: ["talent-profile-edit", user?.id] })
      
      setDeleteConfirmOpen(false)
      setSelectedAssetToDelete(null)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete asset.")
    } finally {
      setActionLoading(false)
    }
  }

  // Photo uploads
  const handlePhotoUpload = async (files: FileList) => {
    if (!user?.id) return
    setActionLoading(true)
    setErrorMsg("")
    setUploadProgress(0)

    try {
      const uploadPromises = Array.from(files).map(async (file, idx) => {
        // Validate Size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 5 MB limit.`)
        }
        // Validate Type
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error(`File ${file.name} is not an allowed format (JPEG/PNG/WebP).`)
        }

        // Upload to Storage
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}_${idx}.${fileExt}`
        const filePath = `${user.id}/portfolio/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("talent-media")
          .upload(filePath, file, { cacheControl: "3600", upsert: true })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("talent-media")
          .getPublicUrl(filePath)

        // Find current max sort_order
        const currentMax = photos.reduce((max, p) => p.sort_order > max ? p.sort_order : max, -1)

        // Insert row
        const { error: insertError } = await supabase
          .from("media_assets")
          .insert({
            owner_id: user.id,
            type: "photo",
            url: publicUrl,
            is_primary: photos.length === 0 && idx === 0, // Make primary if first photo
            sort_order: currentMax + 1 + idx,
            file_size_bytes: file.size
          })

        if (insertError) throw insertError
      })

      // Simulate progress bar updates
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90))
      }, 300)

      await Promise.all(uploadPromises)
      clearInterval(interval)
      setUploadProgress(100)

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["media-photos", user.id] })
        queryClient.invalidateQueries({ queryKey: ["talent-profile-edit", user.id] })
        setPhotoModalOpen(false)
        setUploadProgress(0)
      }, 500)

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload photos.")
    } finally {
      setActionLoading(false)
    }
  }

  // Video linking or uploading
  const handleAddVideo = async (file?: File) => {
    if (!user?.id) return
    setActionLoading(true)
    setErrorMsg("")
    setUploadProgress(0)

    try {
      if (videoType === "link") {
        // Link validation
        if (!videoUrlInput) throw new Error("Please enter a valid video URL")
        const isYoutube = videoUrlInput.includes("youtube.com") || videoUrlInput.includes("youtu.be")
        const isVimeo = videoUrlInput.includes("vimeo.com")
        if (!isYoutube && !isVimeo) {
          throw new Error("Must be a YouTube or Vimeo link")
        }

        // Insert linked reel
        const { error } = await supabase
          .from("media_assets")
          .insert({
            owner_id: user.id,
            type: "reel",
            url: videoUrlInput,
            metadata_json: { title: videoTitleInput || "Portfolio Reel" }
          })
        if (error) throw error

      } else {
        // Raw Video File upload
        if (!file) throw new Error("Please choose a video file")
        if (file.size > 100 * 1024 * 1024) throw new Error("Video file size must be under 100 MB")
        if (!["video/mp4", "video/quicktime", "video/webm"].includes(file.type)) {
          throw new Error("Only MP4, MOV, and WebM videos are allowed")
        }

        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${user.id}/videos/${fileName}`

        // Upload
        const { error: uploadError } = await supabase.storage
          .from("talent-media")
          .upload(filePath, file, { cacheControl: "3600", upsert: true })
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from("talent-media")
          .getPublicUrl(filePath)

        const { error: dbError } = await supabase
          .from("media_assets")
          .insert({
            owner_id: user.id,
            type: "video",
            url: publicUrl,
            file_size_bytes: file.size,
            metadata_json: { title: file.name }
          })
        if (dbError) throw dbError
      }

      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 95))
      }, 200)
      
      await new Promise(resolve => setTimeout(resolve, 800))
      clearInterval(interval)
      setUploadProgress(100)

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["media-others", user.id] })
        setVideoModalOpen(false)
        setUploadProgress(0)
        setVideoUrlInput("")
        setVideoTitleInput("")
      }, 500)

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add video.")
    } finally {
      setActionLoading(false)
    }
  }

  // Audio upload
  const handleAudioUpload = async (file: File) => {
    if (!user?.id) return
    setActionLoading(true)
    setErrorMsg("")
    setUploadProgress(0)

    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Audio file must be under 10 MB")
      if (!["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav"].includes(file.type)) {
        throw new Error("Only MP3 and WAV files are supported")
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/audio/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("talent-media")
        .upload(filePath, file, { cacheControl: "3600", upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("talent-media")
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from("media_assets")
        .insert({
          owner_id: user.id,
          type: "voice_sample",
          url: publicUrl,
          file_size_bytes: file.size,
          metadata_json: { title: file.name }
        })
      if (dbError) throw dbError

      setUploadProgress(100)
      queryClient.invalidateQueries({ queryKey: ["media-others", user.id] })
      setAudioModalOpen(false)
      setUploadProgress(0)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload audio sample.")
    } finally {
      setActionLoading(false)
    }
  }

  // Resume PDF upload
  const handleResumeUpload = async (file: File) => {
    if (!user?.id) return
    setActionLoading(true)
    setErrorMsg("")

    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Resume must be under 5 MB")
      if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"].includes(file.type)) {
        throw new Error("Only PDF and DOCX documents are supported")
      }

      // 1. Delete existing resumes if any
      const existing = otherAssets.filter(a => a.type === "resume")
      if (existing.length > 0) {
        const promises = existing.map(async (r) => {
          const pathParts = r.url.split("/talent-media/")
          if (pathParts[1]) {
            await supabase.storage.from("talent-media").remove([decodeURIComponent(pathParts[1])])
          }
          return supabase.from("media_assets").delete().eq("id", r.id)
        })
        await Promise.all(promises)
      }

      // 2. Upload new resume
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/resumes/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("talent-media")
        .upload(filePath, file, { cacheControl: "3600", upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("talent-media")
        .getPublicUrl(filePath)

      const { error: dbError } = await supabase
        .from("media_assets")
        .insert({
          owner_id: user.id,
          type: "resume",
          url: publicUrl,
          file_size_bytes: file.size,
          metadata_json: { title: file.name }
        })
      if (dbError) throw dbError

      queryClient.invalidateQueries({ queryKey: ["media-others", user.id] })
    } catch (err: any) {
      alert(err.message || "Failed to upload resume document.")
    } finally {
      setActionLoading(false)
    }
  }

  const isLoading = photosLoading || othersLoading

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">Media Library</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your digital headshots, videos, voice samples, and resume.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        
        {/* Left Side: Photos Grid (takes 7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Photos & Images
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                {photos.length} / 20
              </span>
            </h2>
            <button
              onClick={() => { setErrorMsg(""); setPhotoModalOpen(true); }}
              disabled={photos.length >= 20}
              className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition-all shadow-md shadow-brand-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" /> Add Photos
            </button>
          </div>

          {/* Dnd Kit Context */}
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={photos.map(p => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <SortablePhotoCard 
                    key={photo.id}
                    photo={photo}
                    onSetPrimary={handleSetPrimary}
                    onDelete={triggerDeleteConfirm}
                  />
                ))}
                {photos.length === 0 && (
                  <div className="col-span-full border-2 border-dashed border-border/60 rounded-xl p-10 text-center text-muted-foreground bg-muted/10">
                    <Upload className="h-9 w-9 mx-auto stroke-1 text-muted-foreground/60 mb-2" />
                    <p className="font-semibold text-sm text-foreground">No headshots uploaded yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload up to 20 images. The first one will represent your comp card.</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Right Side: Reels, Audio, Resume (takes 5 columns) */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Section: Videos & Reels */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Videos & Reels</h2>
              <button
                onClick={() => { setErrorMsg(""); setVideoModalOpen(true); }}
                className="flex items-center gap-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 font-semibold px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Video
              </button>
            </div>

            <div className="space-y-3">
              {videos.map(video => (
                <div key={video.id} className="bg-card border border-border/50 p-3.5 rounded-xl shadow-xs flex items-center justify-between gap-4 hover:border-border hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                      <Video className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate max-w-[200px]">
                        {(video.metadata_json as any)?.title || "Reel / Showreel"}
                      </p>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded capitalize">
                        {video.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a href={video.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => triggerDeleteConfirm(video)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {videos.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No showcase reels or videos added.</p>
              )}
            </div>
          </div>

          {/* Section: Voice Samples */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Voice Samples</h2>
              <button
                onClick={() => { setErrorMsg(""); setAudioModalOpen(true); }}
                className="flex items-center gap-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 font-semibold px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Audio
              </button>
            </div>

            <div className="space-y-3">
              {voiceSamples.map(audio => (
                <div key={audio.id} className="bg-card border border-border/50 p-3.5 rounded-xl shadow-xs space-y-3 hover:border-border hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                        <Music className="h-4.5 w-4.5" />
                      </div>
                      <p className="text-xs font-bold text-foreground truncate max-w-[200px]">
                        {(audio.metadata_json as any)?.title || "Audio sample.mp3"}
                      </p>
                    </div>
                    <button
                      onClick={() => triggerDeleteConfirm(audio)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <audio src={audio.url} controls className="w-full h-8 rounded-lg outline-none bg-background/50" />
                </div>
              ))}
              {voiceSamples.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No voice samples uploaded.</p>
              )}
            </div>
          </div>

          {/* Section: Resume & CV */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Resume / CV</h2>
            <div className="bg-card border border-border/50 p-4 rounded-xl shadow-xs space-y-3">
              {resumes.length > 0 ? (
                resumes.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-7 w-7 text-brand-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate max-w-[180px]">
                          {(r.metadata_json as any)?.title || "My Resume"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Uploaded on {new Date(r.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a href={r.url} download target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer" title="Download">
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => triggerDeleteConfirm(r)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-2">
                  <p className="text-xs italic">No resume uploaded. Upload a PDF or DOCX.</p>
                </div>
              )}

              <div className="border-t border-border/30 pt-4 flex justify-center">
                <label className="flex items-center justify-center gap-1.5 px-4 py-2 border border-border hover:bg-muted bg-background/50 rounded-xl text-xs font-semibold text-foreground cursor-pointer transition-all w-full">
                  <Upload className="h-3.5 w-3.5" /> 
                  {resumes.length > 0 ? "Replace Resume" : "Upload Resume (PDF/DOCX)"}
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleResumeUpload(e.target.files[0])
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL 1: ADD PHOTOS */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setPhotoModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-heading text-lg font-bold text-foreground mb-2">Upload Headshots</h3>
            <p className="text-xs text-muted-foreground mb-4">Select one or more photos. Max 5 MB each. Supported: JPEG, PNG, WebP.</p>
            
            {errorMsg && <p className="p-2 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20 mb-4 flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> {errorMsg}</p>}

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 hover:border-brand-500/50 hover:bg-muted/10 cursor-pointer transition-all">
              <Upload className="h-8 w-8 text-muted-foreground mb-2 stroke-1" />
              <span className="text-xs font-semibold text-foreground">Click to browse files</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handlePhotoUpload(e.target.files)
                  }
                }}
              />
            </label>

            {actionLoading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin text-brand-500" /> Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="bg-brand-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: ADD VIDEO */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setVideoModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-heading text-lg font-bold text-foreground mb-4">Add Video / Reel</h3>
            
            <div className="flex border border-border rounded-lg overflow-hidden mb-4 text-xs font-semibold">
              <button 
                type="button" 
                onClick={() => setVideoType("link")} 
                className={`flex-1 py-2 text-center cursor-pointer ${videoType === "link" ? "bg-brand-500 text-white" : "bg-muted/40 hover:bg-muted/80 text-muted-foreground"}`}
              >
                Link YouTube/Vimeo
              </button>
              <button 
                type="button" 
                onClick={() => setVideoType("file")} 
                className={`flex-1 py-2 text-center cursor-pointer ${videoType === "file" ? "bg-brand-500 text-white" : "bg-muted/40 hover:bg-muted/80 text-muted-foreground"}`}
              >
                Upload Video File
              </button>
            </div>

            {errorMsg && <p className="p-2 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20 mb-4 flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> {errorMsg}</p>}

            {videoType === "link" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Video Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Performance Reel 2026"
                    value={videoTitleInput}
                    onChange={(e) => setVideoTitleInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">YouTube or Vimeo URL</label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
                  />
                </div>
                <button
                  onClick={() => handleAddVideo()}
                  disabled={actionLoading}
                  className="w-full h-10 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-brand-500/10 cursor-pointer flex items-center justify-center"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Link"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] text-muted-foreground">Upload MP4, MOV, or WebM video file. Max 100 MB.</p>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 hover:border-brand-500/50 hover:bg-muted/10 cursor-pointer transition-all">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2 stroke-1" />
                  <span className="text-xs font-semibold text-foreground">Click to browse video files</span>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleAddVideo(e.target.files[0])
                      }
                    }}
                  />
                </label>

                {actionLoading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin text-brand-500" /> Uploading Video...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="bg-brand-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: ADD AUDIO VOICE SAMPLE */}
      {audioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setAudioModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-heading text-lg font-bold text-foreground mb-2">Upload Voice Sample</h3>
            <p className="text-xs text-muted-foreground mb-4">Supported formats: MP3, WAV. Max size: 10 MB.</p>
            
            {errorMsg && <p className="p-2 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20 mb-4 flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> {errorMsg}</p>}

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 hover:border-brand-500/50 hover:bg-muted/10 cursor-pointer transition-all">
              <Music className="h-8 w-8 text-muted-foreground mb-2 stroke-1" />
              <span className="text-xs font-semibold text-foreground">Click to browse audio files</span>
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleAudioUpload(e.target.files[0])
                  }
                }}
              />
            </label>

            {actionLoading && (
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                Uploading audio...
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE CONFIRMATION */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 relative text-center">
            <h3 className="font-heading text-lg font-bold text-foreground mb-2">Confirm Delete</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Are you sure you want to delete this asset? This action cannot be undone.
            </p>
            
            {errorMsg && <p className="p-2 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20 mb-4">{errorMsg}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={actionLoading}
                className="flex-1 h-10 border border-border hover:bg-muted text-foreground font-semibold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAsset}
                disabled={actionLoading}
                className="flex-1 h-10 bg-destructive hover:bg-destructive/80 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Yes, Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
