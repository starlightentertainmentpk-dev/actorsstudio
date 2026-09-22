"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function RedirectToUnifiedScreeningPage() {
  const params = useParams()
  const router = useRouter()
  const castingCallId = params.id as string

  useEffect(() => {
    if (castingCallId) {
      router.replace(`/producer/applications?callId=${castingCallId}`)
    }
  }, [castingCallId, router])

  return (
    <div className="h-96 flex flex-col items-center justify-center gap-2">
      <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
      <p className="text-xs text-muted-foreground">Opening Candidate Screening Workspace...</p>
    </div>
  )
}
