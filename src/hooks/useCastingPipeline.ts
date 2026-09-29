"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import {
  CastingProject,
  CastingRole,
  PipelineCandidate,
  PipelineStage,
} from "@/types/pipeline"
import {
  moveCandidateStageAction,
  submitCandidateToClientAction,
  bulkUpdateStageAction,
  createCastingRoleAction,
  addTalentToPipelineAction,
  removeCandidateFromPipelineAction,
} from "@/app/(dashboard)/agency/casting/[id]/pipeline/actions"
import { addSubmissionToClientProject } from "@/hooks/useClientPortal"

// Represented Talent Pool available to be added into casting projects
export const REPRESENTED_TALENT_ROSTER: PipelineCandidate["talent"][] = [
  {
    id: "t-zara-noor",
    user_id: "u-zara",
    full_name: "Zara Noor",
    stage_name: "Zara Noor",
    city: "Karachi",
    height_cm: 168,
    is_available: true,
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    skills: ["Method Acting", "Classical Kathak", "Urdu Diction", "Crying on Cue", "Voice Modulation"],
    bio: "NAPA gold medalist with 3 years television drama experience. Exceptional expressive eyes and flawless Urdu pronunciation.",
    showreel_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    voice_sample_url: "https://actions.google.com/sounds/v1/speech/person_speaking.ogg",
  },
  {
    id: "t-bilal-khan",
    user_id: "u-bilal",
    full_name: "Bilal Khan",
    stage_name: "Bilal Khan",
    city: "Lahore",
    height_cm: 183,
    is_available: true,
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    skills: ["Intense Gaze", "Action & Stunts", "Commercial Diction", "Horse Riding"],
    bio: "Experienced cinema actor known for commanding screen presence in indie features and TV commercials.",
    showreel_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    voice_sample_url: "https://actions.google.com/sounds/v1/speech/person_speaking.ogg",
  },
  {
    id: "t-mahnoor-s",
    user_id: "u-mahnoor",
    full_name: "Mahnoor Sheikh",
    stage_name: "Mahnoor Sheikh",
    city: "Islamabad",
    height_cm: 163,
    is_available: true,
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    skills: ["Natural Dialog", "Youth Appeal", "Fluent English & Urdu", "Guitar"],
    bio: "Social media creator and theater graduate. Natural comedic timing with understated vulnerability.",
    showreel_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    voice_sample_url: null,
  },
  {
    id: "t-fawad-m",
    user_id: "u-fawad",
    full_name: "Fawad Malik",
    stage_name: "Fawad Malik",
    city: "Karachi",
    height_cm: 180,
    is_available: false, // On hold
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    skills: ["Deep Baritone", "Villainous Charm", "Stage Combat", "Method Preparation"],
    bio: "Seasoned theater and film veteran with critical acclaim across Pakistani theater festivals.",
    showreel_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    voice_sample_url: "https://actions.google.com/sounds/v1/speech/person_speaking.ogg",
  },
  {
    id: "t-alizeh-r",
    user_id: "u-alizeh",
    full_name: "Alizeh Rehman",
    stage_name: "Alizeh R.",
    city: "Lahore",
    height_cm: 178,
    is_available: true,
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    skills: ["Editorial Posing", "Runway Walk", "Fabric Flow Control", "Expressive Eyes"],
    bio: "Top commercial runway model who headlined PFDC Sunsilk Fashion Week.",
    showreel_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    voice_sample_url: null,
  },
  {
    id: "t-hamza-ali",
    user_id: "u-hamza",
    full_name: "Hamza Ali",
    stage_name: "Hamza Ali",
    city: "Karachi",
    height_cm: 185,
    is_available: true,
    avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
    skills: ["Action Stunts", "Swordplay", "Martial Arts", "English Accent"],
    bio: "Action performer and athletic screen actor with commercial television background.",
    showreel_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    voice_sample_url: null,
  },
  {
    id: "t-sarah-khan",
    user_id: "u-sarah",
    full_name: "Sarah Tariq",
    stage_name: "Sarah Tariq",
    city: "Lahore",
    height_cm: 165,
    is_available: true,
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
    skills: ["Voice Acting", "Radio Host", "Improv", "Commercial Pitch"],
    bio: "Versatile actor and professional voice talent with national FMCG commercial experience.",
    showreel_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    voice_sample_url: null,
  },
]

export const INITIAL_CASTING_PROJECTS: CastingProject[] = [
  {
    id: "p-ramadan-2026",
    title: "Ramadan Prime-Time Drama Serial 'Khwaab Nagar'",
    project_type: "Television Drama (30 Episodes)",
    client_id: "c1-dawn-films",
    client_name: "Dawn Films & Media",
    organization_id: "default-org",
    status: "active",
    shoot_dates: "Dec 15, 2026 - Jan 25, 2027",
    location: "Karachi & Lahore",
    budget_range: "PKR 12,000,000 Total Casting Budget",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    roles: [
      {
        id: "role-lead-female",
        casting_call_id: "p-ramadan-2026",
        role_name: "Female Lead — 'Arfa'",
        role_type: "lead",
        gender_requirement: "female",
        age_min: 20,
        age_max: 26,
        pay_rate: "PKR 450,000 / month",
        description: "Emotionally resilient architecture student carrying the central family narrative arc.",
      },
      {
        id: "role-lead-male",
        casting_call_id: "p-ramadan-2026",
        role_name: "Male Lead — 'Daniyal'",
        role_type: "lead",
        gender_requirement: "male",
        age_min: 24,
        age_max: 30,
        pay_rate: "PKR 550,000 / month",
        description: "Charismatic corporate scion dealing with ethical conflicts and dramatic romance.",
      },
      {
        id: "role-supporting-sister",
        casting_call_id: "p-ramadan-2026",
        role_name: "Supporting Sister — 'Zehra'",
        role_type: "supporting",
        gender_requirement: "female",
        age_min: 18,
        age_max: 23,
        pay_rate: "PKR 250,000 / month",
        description: "Spirited younger sibling offering comic relief and grounded emotional warmth.",
      },
    ],
    candidates: [
      {
        id: "sub-101",
        casting_call_id: "p-ramadan-2026",
        casting_role_id: "role-lead-female",
        talent_id: "t-zara-noor",
        stage: "client_review",
        proposed_fee: 450000,
        currency: "PKR",
        client_id: "c1-dawn-films",
        agent_pitch_note: "Zara matches the emotional depth required for Arfa. Disciplined and camera-ready.",
        client_decision: "shortlist",
        client_feedback: "Loved her screen presence in the dramatic reel. Top pick for Arfa.",
        client_reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
        updated_at: new Date().toISOString(),
        talent: REPRESENTED_TALENT_ROSTER[0],
        role: {
          id: "role-lead-female",
          casting_call_id: "p-ramadan-2026",
          role_name: "Female Lead — 'Arfa'",
          role_type: "lead",
          gender_requirement: "female",
          age_min: 20,
          age_max: 26,
        },
      },
      {
        id: "sub-102",
        casting_call_id: "p-ramadan-2026",
        casting_role_id: "role-lead-male",
        talent_id: "t-bilal-khan",
        stage: "audition",
        proposed_fee: 550000,
        currency: "PKR",
        client_id: "c1-dawn-films",
        agent_pitch_note: "Bilal brings intense romantic gravity. Look tests confirm strong chemistry opposite Zara.",
        client_decision: "audition_request",
        client_feedback: "Please schedule an in-person chemistry read at our Clifton office next Tuesday.",
        client_reviewed_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
        updated_at: new Date().toISOString(),
        talent: REPRESENTED_TALENT_ROSTER[1],
        role: {
          id: "role-lead-male",
          casting_call_id: "p-ramadan-2026",
          role_name: "Male Lead — 'Daniyal'",
          role_type: "lead",
          gender_requirement: "male",
          age_min: 24,
          age_max: 30,
        },
      },
      {
        id: "sub-103",
        casting_call_id: "p-ramadan-2026",
        casting_role_id: "role-supporting-sister",
        talent_id: "t-mahnoor-s",
        stage: "shortlisted",
        proposed_fee: 250000,
        currency: "PKR",
        client_id: null,
        agent_pitch_note: "Fresh face with natural charm. Very relatable for the younger sibling dynamic.",
        client_decision: null,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        updated_at: new Date().toISOString(),
        talent: REPRESENTED_TALENT_ROSTER[2],
        role: {
          id: "role-supporting-sister",
          casting_call_id: "p-ramadan-2026",
          role_name: "Supporting Sister — 'Zehra'",
          role_type: "supporting",
          gender_requirement: "female",
          age_min: 18,
          age_max: 23,
        },
      },
      {
        id: "sub-104",
        casting_call_id: "p-ramadan-2026",
        casting_role_id: "role-lead-male",
        talent_id: "t-fawad-m",
        stage: "searching",
        proposed_fee: 600000,
        currency: "PKR",
        client_id: null,
        agent_pitch_note: "Powerful commanding persona, strong alternative for Daniyal if schedule opens.",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        updated_at: new Date().toISOString(),
        talent: REPRESENTED_TALENT_ROSTER[3],
        role: {
          id: "role-lead-male",
          casting_call_id: "p-ramadan-2026",
          role_name: "Male Lead — 'Daniyal'",
          role_type: "lead",
          gender_requirement: "male",
          age_min: 24,
          age_max: 30,
        },
      },
      {
        id: "sub-105",
        casting_call_id: "p-ramadan-2026",
        casting_role_id: "role-lead-female",
        talent_id: "t-sarah-khan",
        stage: "submitted",
        proposed_fee: 400000,
        currency: "PKR",
        client_id: "c1-dawn-films",
        agent_pitch_note: "Outstanding voice and presence. Great alternate candidate for Arfa.",
        client_decision: "pending",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
        updated_at: new Date().toISOString(),
        talent: REPRESENTED_TALENT_ROSTER[6],
        role: {
          id: "role-lead-female",
          casting_call_id: "p-ramadan-2026",
          role_name: "Female Lead — 'Arfa'",
          role_type: "lead",
          gender_requirement: "female",
          age_min: 20,
          age_max: 26,
        },
      },
      {
        id: "sub-106",
        casting_call_id: "p-ramadan-2026",
        casting_role_id: "role-lead-male",
        talent_id: "t-hamza-ali",
        stage: "callback",
        proposed_fee: 520000,
        currency: "PKR",
        client_id: "c1-dawn-films",
        agent_pitch_note: "Director requested second callback for Hamza to test screen chemistry.",
        client_decision: "audition_request",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        updated_at: new Date().toISOString(),
        talent: REPRESENTED_TALENT_ROSTER[5],
        role: {
          id: "role-lead-male",
          casting_call_id: "p-ramadan-2026",
          role_name: "Male Lead — 'Daniyal'",
          role_type: "lead",
          gender_requirement: "male",
          age_min: 24,
          age_max: 30,
        },
      },
      {
        id: "sub-107",
        casting_call_id: "p-ramadan-2026",
        casting_role_id: "role-lead-female",
        talent_id: "t-alizeh-r",
        stage: "selected",
        proposed_fee: 420000,
        currency: "PKR",
        client_id: "c1-dawn-films",
        agent_pitch_note: "Finalist for secondary female track.",
        client_decision: "selected",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        updated_at: new Date().toISOString(),
        talent: REPRESENTED_TALENT_ROSTER[4],
        role: {
          id: "role-lead-female",
          casting_call_id: "p-ramadan-2026",
          role_name: "Female Lead — 'Arfa'",
          role_type: "lead",
          gender_requirement: "female",
          age_min: 20,
          age_max: 26,
        },
      },
    ],
  },
  {
    id: "p-commercial-citrus",
    title: "National TVC & Billboard Campaign — 'Citrus Fizz'",
    project_type: "Commercial TVC & Digital",
    client_id: "c2-hum-tv",
    client_name: "Hum Network Studios",
    organization_id: "default-org",
    status: "active",
    shoot_dates: "Nov 02 - Nov 05, 2026",
    location: "Islamabad",
    budget_range: "PKR 4,500,000",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    roles: [
      {
        id: "role-citrus-lead",
        casting_call_id: "p-commercial-citrus",
        role_name: "Hero Brand Ambassador",
        role_type: "lead",
        gender_requirement: "male",
        age_min: 22,
        age_max: 29,
        pay_rate: "PKR 750,000 total",
        description: "Energetic, athletic youth with infectious smile and screen charisma.",
      },
      {
        id: "role-citrus-co",
        casting_call_id: "p-commercial-citrus",
        role_name: "Co-Lead Gym Enthusiast",
        role_type: "supporting",
        gender_requirement: "female",
        age_min: 20,
        age_max: 27,
        pay_rate: "PKR 350,000 total",
        description: "Fitness enthusiast for dynamic outdoor montage shots.",
      },
    ],
    candidates: [],
  },
  {
    id: "p-feature-lyari",
    title: "Crime Thriller Feature Film 'Lyari Highway'",
    project_type: "Cinema Theatrical Feature",
    client_id: "c3-multiverse",
    client_name: "Multiverse Productions",
    organization_id: "default-org",
    status: "in_review",
    shoot_dates: "Feb 10 - April 15, 2027",
    location: "Karachi",
    budget_range: "PKR 25,000,000",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    roles: [
      {
        id: "role-lyari-detective",
        casting_call_id: "p-feature-lyari",
        role_name: "Inspector Farooq",
        role_type: "lead",
        gender_requirement: "male",
        age_min: 35,
        age_max: 48,
        pay_rate: "PKR 2,000,000",
        description: "Grit-hardened CID investigator investigating high-profile port syndicate.",
      },
    ],
    candidates: [],
  },
]

// Session reactive memory store
let localCastingProjectsStore: CastingProject[] = [...INITIAL_CASTING_PROJECTS]

export function useCastingProjects() {
  const queryClient = useQueryClient()

  const { data: projects = localCastingProjectsStore, isLoading } = useQuery({
    queryKey: ["agency-casting-projects"],
    queryFn: async (): Promise<CastingProject[]> => {
      try {
        const supabase = createClient()
        const { data: calls, error } = await supabase
          .from("casting_calls")
          .select("*")
          .order("created_at", { ascending: false })

        if (error || !calls || calls.length === 0) {
          return localCastingProjectsStore
        }

        // Map DB calls
        const mapped: CastingProject[] = calls.map((c: any) => {
          const existing = localCastingProjectsStore.find((lp) => lp.id === c.id)
          return {
            id: c.id,
            title: c.title,
            project_type: c.project_type || "Production",
            client_id: null,
            client_name: "Corporate Client",
            status: c.status || "active",
            shoot_dates: c.shoot_dates || c.shoot_date || null,
            location: c.location || null,
            budget_range: c.budget_range || c.compensation || null,
            roles: existing?.roles || [],
            candidates: existing?.candidates || [],
            created_at: c.created_at,
          }
        })

        return mapped
      } catch {
        return localCastingProjectsStore
      }
    },
    staleTime: 1000 * 30,
  })

  const createProject = (projectData: Partial<CastingProject>) => {
    const newProject: CastingProject = {
      id: projectData.id || `proj-${Date.now()}`,
      title: projectData.title || "New Casting Project",
      project_type: projectData.project_type || "Commercial TVC",
      client_id: projectData.client_id || null,
      client_name: projectData.client_name || "Client Partner",
      organization_id: "default-org",
      status: "active",
      shoot_dates: projectData.shoot_dates || "TBD",
      location: projectData.location || "Karachi",
      budget_range: projectData.budget_range || "PKR 500,000",
      roles: projectData.roles || [],
      candidates: projectData.candidates || [],
      created_at: new Date().toISOString(),
    }
    localCastingProjectsStore = [newProject, ...localCastingProjectsStore]
    queryClient.invalidateQueries({ queryKey: ["agency-casting-projects"] })
    return newProject
  }

  return {
    projects,
    isLoading,
    createProject,
  }
}

export function useCastingPipeline(projectId: string) {
  const queryClient = useQueryClient()

  const project =
    localCastingProjectsStore.find((p) => p.id === projectId) ||
    INITIAL_CASTING_PROJECTS.find((p) => p.id === projectId) ||
    INITIAL_CASTING_PROJECTS[0]

  // Optimistic Move Stage
  const moveCandidateMutation = useMutation({
    mutationFn: async ({
      submissionId,
      newStage,
    }: {
      submissionId: string
      newStage: PipelineStage
    }) => {
      // 1. Instant local update
      localCastingProjectsStore = localCastingProjectsStore.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            candidates: p.candidates.map((c) =>
              c.id === submissionId ? { ...c, stage: newStage, updated_at: new Date().toISOString() } : c
            ),
          }
        }
        return p
      })

      // 2. Call server action
      await moveCandidateStageAction(submissionId, newStage)
      return { submissionId, newStage }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-casting-pipeline", projectId] })
      queryClient.invalidateQueries({ queryKey: ["agency-casting-projects"] })
    },
  })

  // Submit Candidate to Client
  const submitToClientMutation = useMutation({
    mutationFn: async ({
      submissionId,
      clientId,
      proposedFee,
      currency,
      agentPitchNote,
    }: {
      submissionId: string
      clientId: string
      proposedFee: number
      currency: string
      agentPitchNote?: string
    }) => {
      let targetCandidate: PipelineCandidate | undefined

      // 1. Instant local update
      localCastingProjectsStore = localCastingProjectsStore.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            candidates: p.candidates.map((c) => {
              if (c.id === submissionId) {
                targetCandidate = {
                  ...c,
                  stage: "submitted",
                  client_id: clientId,
                  proposed_fee: proposedFee,
                  currency,
                  agent_pitch_note: agentPitchNote,
                  client_decision: "pending",
                  updated_at: new Date().toISOString(),
                }
                return targetCandidate
              }
              return c
            }),
          }
        }
        return p
      })

      // 2. Sync into Client Portal so the client immediately sees this candidate at /client/projects/[id]
      if (targetCandidate) {
        addSubmissionToClientProject({
          projectId: projectId,
          submission: {
            id: targetCandidate.id,
            casting_call_id: projectId,
            project_title: project?.title || "Casting Presentation",
            role_name: targetCandidate.role?.role_name || "Featured Role",
            talent_id: targetCandidate.talent_id,
            talent_name: targetCandidate.talent.full_name,
            stage_name: targetCandidate.talent.stage_name || targetCandidate.talent.full_name,
            headshot_url:
              targetCandidate.talent.avatar_url ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
            gender: targetCandidate.role?.gender_requirement || "Talent",
            age: 24,
            age_range: "20 - 30",
            height_cm: targetCandidate.talent.height_cm ? `${targetCandidate.talent.height_cm} cm` : "170 cm",
            location: targetCandidate.talent.city || "Karachi",
            skills: targetCandidate.talent.skills || ["Acting", "Commercial"],
            bio: targetCandidate.talent.bio || "Represented professional talent.",
            showreel_url: targetCandidate.talent.showreel_url || null,
            voice_sample_url: targetCandidate.talent.voice_sample_url || null,
            proposed_fee: proposedFee,
            currency: currency || "PKR",
            agent_pitch_note: agentPitchNote || "",
            client_decision: "pending",
            client_feedback: null,
            client_reviewed_at: null,
          },
        })
      }

      // 3. Call server action
      await submitCandidateToClientAction({
        submissionId,
        clientId,
        proposedFee,
        currency,
        agentPitchNote,
      })

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-casting-pipeline", projectId] })
      queryClient.invalidateQueries({ queryKey: ["client-portal-projects"] })
    },
  })

  // Add Role Mutation
  const addRoleMutation = useMutation({
    mutationFn: async (roleData: {
      role_name: string
      role_type: string
      gender_requirement?: string
      age_min?: number
      age_max?: number
      pay_rate?: string
      description?: string
    }) => {
      const newRole: CastingRole = {
        id: `role-${Date.now()}`,
        casting_call_id: projectId,
        role_name: roleData.role_name,
        role_type: roleData.role_type,
        gender_requirement: roleData.gender_requirement || null,
        age_min: roleData.age_min || null,
        age_max: roleData.age_max || null,
        pay_rate: roleData.pay_rate || null,
        description: roleData.description || null,
        created_at: new Date().toISOString(),
      }

      localCastingProjectsStore = localCastingProjectsStore.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            roles: [...p.roles, newRole],
          }
        }
        return p
      })

      await createCastingRoleAction({
        ...roleData,
        casting_call_id: projectId,
        role_type: roleData.role_type as any,
        gender_requirement: roleData.gender_requirement as any,
      })

      return newRole
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-casting-pipeline", projectId] })
    },
  })

  // Add Candidate to Pipeline
  const addCandidateMutation = useMutation({
    mutationFn: async ({
      talentId,
      roleId,
      stage = "shortlisted",
      proposedFee,
      currency = "PKR",
      pitchNote,
    }: {
      talentId: string
      roleId?: string | null
      stage?: PipelineStage
      proposedFee?: number
      currency?: string
      pitchNote?: string
    }) => {
      const talent =
        REPRESENTED_TALENT_ROSTER.find((t) => t.id === talentId) ||
        REPRESENTED_TALENT_ROSTER[0]

      const role = project.roles.find((r) => r.id === roleId) || null

      const newCandidate: PipelineCandidate = {
        id: `sub-${Date.now()}`,
        casting_call_id: projectId,
        casting_role_id: roleId || null,
        talent_id: talentId,
        stage,
        proposed_fee: proposedFee || (role?.pay_rate ? 400000 : null),
        currency,
        agent_pitch_note: pitchNote || null,
        client_decision: null,
        client_feedback: null,
        client_reviewed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        talent,
        role,
      }

      localCastingProjectsStore = localCastingProjectsStore.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            candidates: [newCandidate, ...p.candidates],
          }
        }
        return p
      })

      await addTalentToPipelineAction({
        casting_call_id: projectId,
        talent_id: talentId,
        casting_role_id: roleId || null,
        stage,
        proposed_fee: proposedFee,
        currency,
        agent_pitch_note: pitchNote,
      })

      return newCandidate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-casting-pipeline", projectId] })
    },
  })

  // Remove Candidate
  const removeCandidateMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      localCastingProjectsStore = localCastingProjectsStore.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            candidates: p.candidates.filter((c) => c.id !== submissionId),
          }
        }
        return p
      })

      await removeCandidateFromPipelineAction(submissionId)
      return submissionId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-casting-pipeline", projectId] })
    },
  })

  // Bulk Move Stage
  const bulkMoveStageMutation = useMutation({
    mutationFn: async ({
      submissionIds,
      newStage,
    }: {
      submissionIds: string[]
      newStage: PipelineStage
    }) => {
      localCastingProjectsStore = localCastingProjectsStore.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            candidates: p.candidates.map((c) =>
              submissionIds.includes(c.id) ? { ...c, stage: newStage, updated_at: new Date().toISOString() } : c
            ),
          }
        }
        return p
      })

      await bulkUpdateStageAction(submissionIds, newStage)
      return { submissionIds, newStage }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-casting-pipeline", projectId] })
    },
  })

  return {
    project,
    roles: project.roles,
    candidates: project.candidates,
    talentRoster: REPRESENTED_TALENT_ROSTER,
    moveCandidate: moveCandidateMutation.mutateAsync,
    isMoving: moveCandidateMutation.isPending,
    submitToClient: submitToClientMutation.mutateAsync,
    isSubmitting: submitToClientMutation.isPending,
    addRole: addRoleMutation.mutateAsync,
    isAddingRole: addRoleMutation.isPending,
    addCandidate: addCandidateMutation.mutateAsync,
    isAddingCandidate: addCandidateMutation.isPending,
    removeCandidate: removeCandidateMutation.mutateAsync,
    bulkMoveStage: bulkMoveStageMutation.mutateAsync,
    isBulkMoving: bulkMoveStageMutation.isPending,
  }
}
