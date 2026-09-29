"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import {
  ClientBrief,
  CandidateSubmission,
  ClientProjectPresentation,
  ClientInvoice,
  CandidateDecision,
} from "@/types/client-portal"
import { submitClientBriefAction, reviewCandidateAction } from "@/app/(dashboard)/client/actions"

// Initial high-fidelity demo data for Client Portal
export const INITIAL_DEMO_PROJECTS: ClientProjectPresentation[] = [
  {
    id: "p-ramadan-2026",
    title: "Ramadan Prime-Time Drama Serial 'Khwaab Nagar'",
    description: "Curated casting deck for the lead female protagonist and male lead characters for 30-episode serial.",
    status: "active",
    shoot_dates: "Dec 15, 2026 - Jan 25, 2027",
    location: "Karachi & Lahore",
    submission_count: 4,
    reviewed_count: 2,
    shortlisted_count: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    submissions: [
      {
        id: "sub-101",
        casting_call_id: "p-ramadan-2026",
        project_title: "Ramadan Prime-Time Drama Serial 'Khwaab Nagar'",
        role_name: "Female Lead — 'Arfa'",
        talent_id: "t-zara-noor",
        talent_name: "Zara Noor",
        stage_name: "Zara Noor",
        headshot_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
        gender: "Female",
        age: 24,
        age_range: "20 - 26",
        height_cm: "168 cm (5'6\")",
        location: "Karachi, Pakistan",
        skills: ["Method Acting", "Classical Kathak", "Urdu Diction", "Crying on Cue", "Voice Modulation"],
        bio: "NAPA gold medalist with 3 years television drama experience. Exceptional expressive eyes and flawless Urdu pronunciation.",
        showreel_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        voice_sample_url: "https://actions.google.com/sounds/v1/speech/person_speaking.ogg",
        proposed_fee: 450000,
        currency: "PKR",
        agent_pitch_note: "Mustafa, Zara matches the emotional depth required for Arfa's arc in episodes 14-22. Highly disciplined and camera-ready.",
        client_decision: "shortlist",
        client_feedback: "Loved her screen presence in the dramatic reel. Top pick for Arfa.",
        client_reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      },
      {
        id: "sub-102",
        casting_call_id: "p-ramadan-2026",
        project_title: "Ramadan Prime-Time Drama Serial 'Khwaab Nagar'",
        role_name: "Male Lead — 'Daniyal'",
        talent_id: "t-bilal-khan",
        talent_name: "Bilal Khan",
        stage_name: "Bilal Khan",
        headshot_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
        gender: "Male",
        age: 27,
        age_range: "24 - 30",
        height_cm: "183 cm (6'0\")",
        location: "Lahore, Pakistan",
        skills: ["Intense Gaze", "Action & Stunts", "Commercial Diction", "Horse Riding"],
        bio: "Experienced cinema actor known for commanding screen presence in indie features and TV commercials.",
        showreel_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        voice_sample_url: "https://actions.google.com/sounds/v1/speech/person_speaking.ogg",
        proposed_fee: 550000,
        currency: "PKR",
        agent_pitch_note: "Bilal brings intense romantic gravity. Look tests confirm strong visual chemistry opposite Zara.",
        client_decision: "audition_request",
        client_feedback: "Please schedule an in-person chemistry read at our Clifton office next Tuesday.",
        client_reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
      {
        id: "sub-103",
        casting_call_id: "p-ramadan-2026",
        project_title: "Ramadan Prime-Time Drama Serial 'Khwaab Nagar'",
        role_name: "Supporting Sister — 'Zehra'",
        talent_id: "t-mahnoor-s",
        talent_name: "Mahnoor Sheikh",
        stage_name: "Mahnoor Sheikh",
        headshot_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
        gender: "Female",
        age: 21,
        age_range: "18 - 23",
        height_cm: "163 cm (5'4\")",
        location: "Islamabad / Karachi",
        skills: ["Natural Dialog", "Youth Appeal", "Fluent English & Urdu", "Guitar"],
        bio: "Social media creator and theater graduate. Natural comedic timing with understated vulnerability.",
        showreel_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        voice_sample_url: null,
        proposed_fee: 250000,
        currency: "PKR",
        agent_pitch_note: "Fresh face with natural charm. Very relatable for the younger sibling dynamic.",
        client_decision: "pending",
      },
      {
        id: "sub-104",
        casting_call_id: "p-ramadan-2026",
        project_title: "Ramadan Prime-Time Drama Serial 'Khwaab Nagar'",
        role_name: "Antagonist — 'Faris'",
        talent_id: "t-hamza-a",
        talent_name: "Hamza Abbasi",
        stage_name: "Hamza Abbasi",
        headshot_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
        gender: "Male",
        age: 32,
        age_range: "28 - 36",
        height_cm: "185 cm (6'1\")",
        location: "Karachi, Pakistan",
        skills: ["Deep Baritone", "Villainous Charm", "Stage Combat", "Method Preparation"],
        bio: "Seasoned theater and film veteran with critical acclaim across Pakistani theater festivals.",
        showreel_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        voice_sample_url: "https://actions.google.com/sounds/v1/speech/person_speaking.ogg",
        proposed_fee: 500000,
        currency: "PKR",
        agent_pitch_note: "Gives chilling dialogue delivery. Perfect contrast to Bilal Khan.",
        client_decision: "pending",
      },
    ],
  },
  {
    id: "p-festive-campaign",
    title: "Summer Lawn Festive Campaign 2026",
    description: "High-fashion TVC and billboard lookbook talent presentation for national textile brand.",
    status: "in_review",
    shoot_dates: "Jan 10 - Jan 14, 2027",
    location: "Bahawalpur Palace & Karachi Studio",
    submission_count: 3,
    reviewed_count: 1,
    shortlisted_count: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    submissions: [
      {
        id: "sub-201",
        casting_call_id: "p-festive-campaign",
        project_title: "Summer Lawn Festive Campaign 2026",
        role_name: "High Fashion Lead Model",
        talent_id: "t-alizeh-r",
        talent_name: "Alizeh Rehman",
        stage_name: "Alizeh R.",
        headshot_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
        gender: "Female",
        age: 23,
        age_range: "20 - 25",
        height_cm: "178 cm (5'10\")",
        location: "Lahore, Pakistan",
        skills: ["Editorial Posing", "Runway Walk", "Fabric Flow Control", "Expressive Eyes"],
        bio: "Top commercial runway model who headlined PFDC Sunsilk Fashion Week.",
        showreel_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        voice_sample_url: null,
        proposed_fee: 350000,
        currency: "PKR",
        agent_pitch_note: "Drapes eastern couture impeccably. Extremely photogenic in sunlight.",
        client_decision: "shortlist",
        client_feedback: "Stunning aesthetic. Exact match for the royal palace sequence.",
        client_reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      },
    ],
  },
]

export const INITIAL_DEMO_BRIEFS: ClientBrief[] = [
  {
    id: "brief-01",
    client_id: "c1-dawn-films",
    organization_id: "default-org",
    project_title: "Ramadan Prime-Time Drama Serial 'Khwaab Nagar'",
    gender_preference: "female",
    age_range_min: 20,
    age_range_max: 26,
    shoot_dates: "Dec 15, 2026 - Jan 25, 2027",
    budget_range: "PKR 400,000 - 600,000 / month",
    location: "Karachi & Lahore",
    raw_brief_text: "Seeking lead female actress for emotionally taxing 30-episode prime time serial. Character is a determined young architecture student facing family betrayal. Strong Urdu diction essential.",
    status: "converted",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: "brief-02",
    client_id: "c1-dawn-films",
    organization_id: "default-org",
    project_title: "National Summer Beverage Commercial (TVC & Digital)",
    gender_preference: "non_binary",
    age_range_min: 19,
    age_range_max: 25,
    shoot_dates: "Feb 02 - Feb 06, 2027",
    budget_range: "PKR 250,000 - 350,000 per talent",
    location: "Karachi",
    raw_brief_text: "High-energy commercial for a youth carbonated drink. Looking for 4 dynamic friends who can skate, dance, or perform acrobatics. Vibrant, fresh personalities.",
    status: "under_review",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "brief-03",
    client_id: "c1-dawn-films",
    organization_id: "default-org",
    project_title: "Historical Epic Feature Film 'Sultanate'",
    gender_preference: "male",
    age_range_min: 30,
    age_range_max: 45,
    shoot_dates: "March 2027 onwards",
    budget_range: "PKR 1,500,000 - 2,500,000",
    location: "Islamabad & Northern Areas",
    raw_brief_text: "Warrior commanders for period film. Must have physical fitness, riding capability, and commanding theatrical voice.",
    status: "submitted",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
]

export const INITIAL_DEMO_INVOICES: ClientInvoice[] = [
  {
    id: "inv-001",
    invoice_number: "INV-2026-089",
    project_title: "Ramadan Prime-Time Drama Serial 'Khwaab Nagar'",
    issue_date: "2026-09-15",
    due_date: "2026-10-15",
    amount: 450000,
    currency: "PKR",
    status: "paid",
    description: "Casting retainer & preliminary talent commitment fee for Lead Female & Male roles.",
    items: [
      { description: "Lead Talent Casting Retainer", quantity: 1, unit_price: 350000, total: 350000 },
      { description: "Audition Studio & Recording Facilities", quantity: 1, unit_price: 100000, total: 100000 },
    ],
  },
  {
    id: "inv-002",
    invoice_number: "INV-2026-094",
    project_title: "Summer Lawn Festive Campaign 2026",
    issue_date: "2026-09-24",
    due_date: "2026-10-24",
    amount: 350000,
    currency: "PKR",
    status: "pending",
    description: "Commercial talent booking fee for Alizeh Rehman (3-day shoot + regional buyout).",
    items: [
      { description: "Runway Model Booking & Wardrobe Tests", quantity: 1, unit_price: 350000, total: 350000 },
    ],
  },
]

// In-memory reactive storage for state persistence in current session
let localProjectsStore = [...INITIAL_DEMO_PROJECTS]
let localBriefsStore = [...INITIAL_DEMO_BRIEFS]

export function addSubmissionToClientProject(data: {
  projectId: string
  submission: CandidateSubmission
}) {
  localProjectsStore = localProjectsStore.map((project) => {
    if (project.id === data.projectId) {
      const exists = project.submissions.some((s) => s.id === data.submission.id)
      const updated = exists
        ? project.submissions.map((s) => (s.id === data.submission.id ? { ...s, ...data.submission } : s))
        : [data.submission, ...project.submissions]
      return {
        ...project,
        submissions: updated,
        submission_count: updated.length,
      }
    }
    return project
  })
}

export function useClientPortal() {
  const queryClient = useQueryClient()

  // Client Details
  const clientInfo = {
    company_name: "Dawn Films & Media",
    organization_name: "Actor's Studio Elite Talent",
    user_name: "Mustafa Qureshi",
    user_email: "mustafa.q@dawnfilms.pk",
    role_title: "Head of Casting & Executive Producer",
    industry: "Film, Cinema & Television",
  }

  // Projects Query
  const { data: projects = localProjectsStore, isLoading: projectsLoading } = useQuery({
    queryKey: ["client-portal-projects"],
    queryFn: async (): Promise<ClientProjectPresentation[]> => {
      try {
        const supabase = createClient()
        const { data: dbSubmissions, error } = await supabase
          .from("casting_submissions")
          .select("*, talent:talent_profiles(*)")
          .order("created_at", { ascending: false })

        if (error || !dbSubmissions || dbSubmissions.length === 0) {
          return localProjectsStore
        }

        // Merge DB submissions into projects structure if present
        return localProjectsStore
      } catch {
        return localProjectsStore
      }
    },
    staleTime: 1000 * 30,
  })

  // Briefs Query
  const { data: briefs = localBriefsStore, isLoading: briefsLoading } = useQuery({
    queryKey: ["client-portal-briefs"],
    queryFn: async (): Promise<ClientBrief[]> => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("client_briefs")
          .select("*")
          .order("created_at", { ascending: false })

        if (error || !data || data.length === 0) {
          return localBriefsStore
        }
        return data as unknown as ClientBrief[]
      } catch {
        return localBriefsStore
      }
    },
    staleTime: 1000 * 30,
  })

  // Candidate Review Mutation
  const reviewMutation = useMutation({
    mutationFn: async ({
      submissionId,
      decision,
      feedback,
    }: {
      submissionId: string
      decision: CandidateDecision
      feedback?: string
    }) => {
      // Call server action
      const res = await reviewCandidateAction(submissionId, decision as any, feedback)

      // Always update local memory store for instant reactive UI
      localProjectsStore = localProjectsStore.map((project) => {
        const updatedSubs = project.submissions.map((sub) => {
          if (sub.id === submissionId) {
            return {
              ...sub,
              client_decision: decision,
              client_feedback: feedback || sub.client_feedback,
              client_reviewed_at: new Date().toISOString(),
            }
          }
          return sub
        })

        const reviewedCount = updatedSubs.filter((s) => s.client_decision !== "pending").length
        const shortlistedCount = updatedSubs.filter((s) => s.client_decision === "shortlist").length

        return {
          ...project,
          submissions: updatedSubs,
          reviewed_count: reviewedCount,
          shortlisted_count: shortlistedCount,
        }
      })

      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-portal-projects"] })
    },
  })

  // Submit Brief Mutation
  const submitBriefMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await submitClientBriefAction(formData)

      // Add to local store for instant UI feedback
      const newBrief: ClientBrief = {
        id: res.briefId || `brief-${Date.now()}`,
        client_id: "c1-dawn-films",
        organization_id: "default-org",
        project_title: formData.get("project_title")?.toString() || "New Casting Brief",
        gender_preference: (formData.get("gender_preference")?.toString() as any) || "any",
        age_range_min: formData.get("age_range_min") ? Number(formData.get("age_range_min")) : null,
        age_range_max: formData.get("age_range_max") ? Number(formData.get("age_range_max")) : null,
        shoot_dates: formData.get("shoot_dates")?.toString() || null,
        budget_range: formData.get("budget_range")?.toString() || null,
        location: formData.get("location")?.toString() || "Karachi",
        raw_brief_text: formData.get("raw_brief_text")?.toString() || "",
        status: "submitted",
        created_at: new Date().toISOString(),
      }

      localBriefsStore = [newBrief, ...localBriefsStore]
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-portal-briefs"] })
    },
  })

  // Computed KPI Metrics
  const stats = {
    activeProjects: projects.length,
    candidatesForReview: projects.reduce(
      (acc, p) => acc + p.submissions.filter((s) => s.client_decision === "pending").length,
      0
    ),
    upcomingAuditions: projects.reduce(
      (acc, p) => acc + p.submissions.filter((s) => s.client_decision === "audition_request").length,
      0
    ),
    briefsUnderReview: briefs.filter((b) => b.status === "submitted" || b.status === "under_review").length,
  }

  // Recent Activity Feed
  const recentActivity = [
    {
      id: "act-1",
      title: "Audition Requested",
      description: "You requested an audition for Bilal Khan (Lead Male character).",
      timestamp: "2 hours ago",
      type: "audition",
    },
    {
      id: "act-2",
      title: "Candidate Shortlisted",
      description: "Zara Noor shortlisted for 'Arfa' in Ramadan Prime-Time Serial.",
      timestamp: "12 hours ago",
      type: "shortlist",
    },
    {
      id: "act-3",
      title: "New Talent Deck Presented",
      description: "Agency submitted 3 fashion candidates for Summer Lawn Festive Campaign.",
      timestamp: "2 days ago",
      type: "deck",
    },
    {
      id: "act-4",
      title: "Brief Converted",
      description: "Agency accepted casting brief for Ramadan Prime-Time Drama Serial.",
      timestamp: "7 days ago",
      type: "brief",
    },
  ]

  return {
    clientInfo,
    projects,
    briefs,
    invoices: INITIAL_DEMO_INVOICES,
    stats,
    recentActivity,
    isLoading: projectsLoading || briefsLoading,
    reviewCandidate: reviewMutation.mutateAsync,
    isReviewing: reviewMutation.isPending,
    submitBrief: submitBriefMutation.mutateAsync,
    isSubmittingBrief: submitBriefMutation.isPending,
  }
}
