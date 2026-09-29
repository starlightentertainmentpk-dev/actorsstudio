"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { SelfTapeRequest, SelfTapeSubmission, SelfTapeReview, SelfTapeStatus } from "@/types/self-tape"
import {
  submitSelfTapeAction,
  getSelfTapeSignedUrl,
  requestSelfTapeAction,
  submitSelfTapeReviewAction,
} from "@/app/(dashboard)/talent/self-tapes/actions"
import { REPRESENTED_TALENT_ROSTER } from "@/hooks/useCastingPipeline"

export const INITIAL_SELF_TAPE_REQUESTS: SelfTapeRequest[] = [
  {
    id: "st-req-001",
    organization_id: "default-org",
    casting_call_id: "p-ramadan-2026",
    casting_role_id: "role-lead-female",
    talent_id: "t-zara-noor",
    instructions: "Please record Scene 14 (Arfa's Confrontation). Framing: Medium close-up with clear frontal natural lighting. No background noise. Deliver dialogue with contained emotional tension, not shouting.",
    sides_script_url: "/scripts/ramadan-2026-arfa-scene14.pdf",
    deadline_at: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
    status: "submitted",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    casting_call: {
      id: "p-ramadan-2026",
      title: "Ramadan Prime-Time Drama Serial 'Khwaab Nagar'",
    },
    role: {
      id: "role-lead-female",
      role_name: "Female Lead — 'Arfa'",
    },
    talent: {
      id: "t-zara-noor",
      full_name: "Zara Noor",
      stage_name: "Zara Noor",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      city: "Karachi",
      height_cm: 168,
    },
    submission: {
      id: "st-sub-001",
      self_tape_request_id: "st-req-001",
      talent_id: "t-zara-noor",
      video_storage_path: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      video_signed_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      video_duration_sec: 15.0,
      file_size_bytes: 15728640,
      talent_notes: "Take 2 attached. Followed director's note to keep the emotional break at the end subtle. Natural daylight from Clifton studio window.",
      submitted_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      status: "submitted",
      reviews: [
        {
          id: "rev-001",
          self_tape_submission_id: "st-sub-001",
          reviewer_user_id: "u-agent-1",
          reviewer_type: "agency",
          timestamp_sec: 4.5,
          comments: "Compelling eye contact and stillness here. Very strong delivery of dialogue.",
          score: 8.5,
          decision: null,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          reviewer: {
            email: "casting@actorsstudio.pk",
            name: "Lead Agent Tariq",
          },
        },
      ],
    },
  },
  {
    id: "st-req-002",
    organization_id: "default-org",
    casting_call_id: "p-ramadan-2026",
    casting_role_id: "role-lead-male",
    talent_id: "t-bilal-khan",
    instructions: "Scene 8 (Daniyal's boardroom resignation). Full eye contact with the camera. Confident tone breaking down at the climax. Please record in horizontal orientation with neutral background.",
    sides_script_url: "/scripts/ramadan-2026-daniyal-scene8.pdf",
    deadline_at: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    status: "requested",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    casting_call: {
      id: "p-ramadan-2026",
      title: "Ramadan Prime-Time Drama Serial 'Khwaab Nagar'",
    },
    role: {
      id: "role-lead-male",
      role_name: "Male Lead — 'Daniyal'",
    },
    talent: {
      id: "t-bilal-khan",
      full_name: "Bilal Khan",
      stage_name: "Bilal Khan",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
      city: "Lahore",
      height_cm: 183,
    },
    submission: null,
  },
  {
    id: "st-req-003",
    organization_id: "default-org",
    casting_call_id: "p-commercial-citrus",
    casting_role_id: "role-citrus-lead",
    talent_id: "t-hamza-ali",
    instructions: "Commercial energy pitch. Hold an imaginary bottle, deliver the tagline with enthusiastic energy and genuine smile. Natural daytime lighting, eye-level framing.",
    sides_script_url: "/scripts/citrus-fizz-tvc-sides.pdf",
    deadline_at: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    status: "requested",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    casting_call: {
      id: "p-commercial-citrus",
      title: "National TVC & Billboard Campaign — 'Citrus Fizz'",
    },
    role: {
      id: "role-citrus-lead",
      role_name: "Hero Brand Ambassador",
    },
    talent: {
      id: "t-hamza-ali",
      full_name: "Hamza Ali",
      stage_name: "Hamza Ali",
      avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
      city: "Karachi",
      height_cm: 185,
    },
    submission: null,
  },
]

let localSelfTapeRequestsStore: SelfTapeRequest[] = [...INITIAL_SELF_TAPE_REQUESTS]

export function useSelfTapes(talentIdFilter?: string) {
  const queryClient = useQueryClient()

  const { data: requests = localSelfTapeRequestsStore, isLoading } = useQuery({
    queryKey: ["self-tape-requests", talentIdFilter || "all"],
    queryFn: async (): Promise<SelfTapeRequest[]> => {
      try {
        const supabase = createClient()
        let query = supabase
          .from("self_tape_requests" as any)
          .select(
            `
            id,
            organization_id,
            casting_call_id,
            casting_role_id,
            talent_id,
            instructions,
            sides_script_url,
            deadline_at,
            status,
            created_at,
            updated_at,
            casting_call:casting_calls(id, title),
            role:casting_roles(id, role_name),
            talent:talent_profiles(id, full_name, stage_name, avatar_url, city, height_cm),
            submissions:self_tape_submissions(
              id,
              self_tape_request_id,
              talent_id,
              video_storage_path,
              video_duration_sec,
              file_size_bytes,
              talent_notes,
              submitted_at,
              status,
              reviews:self_tape_reviews(
                id,
                self_tape_submission_id,
                reviewer_user_id,
                reviewer_type,
                score,
                timestamp_sec,
                comments,
                decision,
                created_at
              )
            )
          `
          )
          .order("created_at", { ascending: false })

        if (talentIdFilter) {
          query = query.eq("talent_id", talentIdFilter)
        }

        const { data, error } = await query

        if (error || !data || data.length === 0) {
          return talentIdFilter
            ? localSelfTapeRequestsStore.filter((r) => r.talent_id === talentIdFilter)
            : localSelfTapeRequestsStore
        }

        const mapped: SelfTapeRequest[] = data.map((item: any) => {
          const submissionRaw = Array.isArray(item.submissions) ? item.submissions[0] : item.submissions
          const submission: SelfTapeSubmission | null = submissionRaw
            ? {
                id: submissionRaw.id,
                self_tape_request_id: submissionRaw.self_tape_request_id,
                talent_id: submissionRaw.talent_id,
                video_storage_path: submissionRaw.video_storage_path,
                video_duration_sec: submissionRaw.video_duration_sec,
                file_size_bytes: submissionRaw.file_size_bytes,
                talent_notes: submissionRaw.talent_notes,
                submitted_at: submissionRaw.submitted_at,
                status: submissionRaw.status,
                reviews: submissionRaw.reviews || [],
              }
            : null

          return {
            id: item.id,
            organization_id: item.organization_id,
            casting_call_id: item.casting_call_id,
            casting_role_id: item.casting_role_id,
            talent_id: item.talent_id,
            instructions: item.instructions,
            sides_script_url: item.sides_script_url,
            deadline_at: item.deadline_at,
            status: item.status,
            created_at: item.created_at,
            updated_at: item.updated_at,
            casting_call: item.casting_call,
            role: item.role,
            talent: item.talent,
            submission,
          }
        })

        return mapped
      } catch {
        return talentIdFilter
          ? localSelfTapeRequestsStore.filter((r) => r.talent_id === talentIdFilter)
          : localSelfTapeRequestsStore
      }
    },
    staleTime: 1000 * 30,
  })

  // Request a Self-Tape
  const requestSelfTapeMutation = useMutation({
    mutationFn: async (data: {
      casting_call_id: string
      casting_call_title?: string
      casting_role_id?: string | null
      role_name?: string
      talent_id: string
      instructions: string
      sides_script_url?: string | null
      deadline_at: string
      client_id?: string | null
    }) => {
      const talent =
        REPRESENTED_TALENT_ROSTER.find((t) => t.id === data.talent_id) || {
          id: data.talent_id,
          full_name: "Selected Talent",
          stage_name: "Selected Talent",
          avatar_url: null,
          city: "Karachi",
          height_cm: 175,
        }

      const newRequest: SelfTapeRequest = {
        id: `st-req-${Date.now()}`,
        organization_id: "default-org",
        casting_call_id: data.casting_call_id,
        casting_role_id: data.casting_role_id || null,
        talent_id: data.talent_id,
        instructions: data.instructions,
        sides_script_url: data.sides_script_url || "/scripts/general-sides.pdf",
        deadline_at: data.deadline_at,
        status: "requested",
        created_at: new Date().toISOString(),
        casting_call: {
          id: data.casting_call_id,
          title: data.casting_call_title || "Casting Production",
        },
        role: data.role_name
          ? {
              id: data.casting_role_id || undefined,
              role_name: data.role_name,
            }
          : undefined,
        talent: {
          id: talent.id,
          full_name: talent.full_name,
          stage_name: talent.stage_name,
          avatar_url: talent.avatar_url,
          city: talent.city,
          height_cm: talent.height_cm,
        },
        submission: null,
      }

      // Update local reactive store
      localSelfTapeRequestsStore = [newRequest, ...localSelfTapeRequestsStore]

      // Call server action
      await requestSelfTapeAction({
        casting_call_id: data.casting_call_id,
        casting_role_id: data.casting_role_id || undefined,
        talent_id: data.talent_id,
        client_id: data.client_id || undefined,
        instructions: data.instructions,
        sides_script_url: data.sides_script_url || undefined,
        deadline_at: data.deadline_at,
      })

      return newRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["self-tape-requests"] })
    },
  })

  // Submit Self-Tape from Talent Portal
  const submitSelfTapeMutation = useMutation({
    mutationFn: async (data: {
      self_tape_request_id: string
      video_storage_path: string
      video_signed_url?: string
      talent_notes?: string
      video_duration_sec?: number
      file_size_bytes?: number
    }) => {
      const submissionId = `st-sub-${Date.now()}`

      const newSubmission: SelfTapeSubmission = {
        id: submissionId,
        self_tape_request_id: data.self_tape_request_id,
        talent_id: talentIdFilter || "t-zara-noor",
        video_storage_path: data.video_storage_path,
        video_signed_url: data.video_signed_url || data.video_storage_path,
        video_duration_sec: data.video_duration_sec || 30,
        file_size_bytes: data.file_size_bytes || 25000000,
        talent_notes: data.talent_notes || null,
        submitted_at: new Date().toISOString(),
        status: "submitted",
        reviews: [],
      }

      // Update local reactive store
      localSelfTapeRequestsStore = localSelfTapeRequestsStore.map((req) => {
        if (req.id === data.self_tape_request_id) {
          return {
            ...req,
            status: "submitted",
            submission: newSubmission,
            updated_at: new Date().toISOString(),
          }
        }
        return req
      })

      // Construct FormData for server action
      const fd = new FormData()
      fd.append("self_tape_request_id", data.self_tape_request_id)
      fd.append("video_storage_path", data.video_storage_path)
      if (data.talent_notes) fd.append("talent_notes", data.talent_notes)
      if (data.video_duration_sec) fd.append("video_duration_sec", data.video_duration_sec.toString())
      if (data.file_size_bytes) fd.append("file_size_bytes", data.file_size_bytes.toString())

      await submitSelfTapeAction(fd)

      return newSubmission
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["self-tape-requests"] })
    },
  })

  // Add Review & Timestamped Comment
  const addReviewCommentMutation = useMutation({
    mutationFn: async (data: {
      submissionId: string
      timestampSec?: number
      comments: string
      score?: number
      decision?: "shortlist" | "pass" | "re_tape" | "select"
      reviewerType?: "agency" | "client"
    }) => {
      const reviewId = `rev-${Date.now()}`

      const newReview: SelfTapeReview = {
        id: reviewId,
        self_tape_submission_id: data.submissionId,
        reviewer_user_id: "u-current-agent",
        reviewer_type: data.reviewerType || "agency",
        timestamp_sec: data.timestampSec ?? null,
        comments: data.comments,
        score: data.score ?? null,
        decision: data.decision || null,
        created_at: new Date().toISOString(),
        reviewer: {
          email: "agent@actorsstudio.pk",
          name: "Agency Casting Director",
        },
      }

      // Update local reactive store
      localSelfTapeRequestsStore = localSelfTapeRequestsStore.map((req) => {
        if (req.submission?.id === data.submissionId) {
          let updatedStatus: SelfTapeStatus = req.submission.status
          if (data.decision === "shortlist") updatedStatus = "approved"
          if (data.decision === "pass") updatedStatus = "rejected"
          if (data.decision === "re_tape") updatedStatus = "retape_requested"
          if (data.decision === "select") updatedStatus = "approved"

          return {
            ...req,
            status: updatedStatus,
            submission: {
              ...req.submission,
              status: updatedStatus,
              reviews: [...(req.submission.reviews || []), newReview],
            },
          }
        }
        return req
      })

      await submitSelfTapeReviewAction({
        self_tape_submission_id: data.submissionId,
        timestamp_sec: data.timestampSec,
        comments: data.comments,
        score: data.score,
        decision: data.decision,
        reviewer_type: data.reviewerType || "agency",
      })

      return newReview
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["self-tape-requests"] })
    },
  })

  // Helper to find request for a candidate
  const getRequestForCandidate = (castingCallId: string, talentId: string) => {
    return requests.find(
      (r) => r.casting_call_id === castingCallId && r.talent_id === talentId
    )
  }

  const pendingRequests = requests.filter(
    (r) => r.status === "requested" || r.status === "retape_requested"
  )

  const submittedRequests = requests.filter(
    (r) => r.status === "submitted" || r.status === "under_review" || r.status === "approved" || r.status === "rejected"
  )

  return {
    requests,
    pendingRequests,
    submittedRequests,
    isLoading,
    requestSelfTape: requestSelfTapeMutation.mutateAsync,
    isRequesting: requestSelfTapeMutation.isPending,
    submitSelfTape: submitSelfTapeMutation.mutateAsync,
    isSubmitting: submitSelfTapeMutation.isPending,
    addReviewComment: addReviewCommentMutation.mutateAsync,
    isAddingReview: addReviewCommentMutation.isPending,
    getRequestForCandidate,
    getSignedUrl: getSelfTapeSignedUrl,
  }
}
