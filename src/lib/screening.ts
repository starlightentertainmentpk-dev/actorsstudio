export type ScreeningStage =
  | "applied"
  | "shortlisted"
  | "deferred"
  | "audition"
  | "selected"
  | "rejected"

export interface InterviewDetails {
  mode: "in_person" | "video_call" | "self_tape"
  scheduledAt: string
  locationOrLink: string
  instructions?: string
}

export interface ScreeningMetadata {
  isDeferred?: boolean
  rating?: number // 1 to 5
  notes?: string
  interview?: InterviewDetails
  history?: Array<{
    stage: ScreeningStage
    changedAt: string
    actorEmail?: string
  }>
}

const ATS_TAG_REGEX = /<!--ATS_SCREENING:([\s\S]*?)-->/

/**
 * Extracts candidate's clean cover note and screening metadata.
 */
export function parseScreeningData(rawCoverNote: string | null): {
  cleanCoverNote: string
  screening: ScreeningMetadata
} {
  if (!rawCoverNote) {
    return { cleanCoverNote: "", screening: {} }
  }

  const match = rawCoverNote.match(ATS_TAG_REGEX)
  if (!match) {
    return { cleanCoverNote: rawCoverNote.trim(), screening: {} }
  }

  const cleanCoverNote = rawCoverNote.replace(ATS_TAG_REGEX, "").trim()
  try {
    const screening: ScreeningMetadata = JSON.parse(match[1])
    return { cleanCoverNote, screening }
  } catch {
    return { cleanCoverNote, screening: {} }
  }
}

/**
 * Encodes clean cover note and updated screening metadata into a single string.
 */
export function encodeScreeningData(
  cleanCoverNote: string,
  screening: ScreeningMetadata
): string {
  const jsonStr = JSON.stringify(screening)
  const base = cleanCoverNote.trim()
  if (!base) {
    return `<!--ATS_SCREENING:${jsonStr}-->`
  }
  return `${base}\n\n<!--ATS_SCREENING:${jsonStr}-->`
}

/**
 * Resolves the effective human-facing stage of an application in the ATS pipeline.
 */
export function getEffectiveStage(
  dbStatus: string,
  screening: ScreeningMetadata
): ScreeningStage {
  if (dbStatus === "withdrawn") return "rejected"
  if (dbStatus === "selected") return "selected"
  if (dbStatus === "rejected") return "rejected"
  if (dbStatus === "audition") return "audition"

  // If flagged as deferred and not in a terminal state
  if (screening.isDeferred) {
    return "deferred"
  }

  if (dbStatus === "shortlisted") return "shortlisted"

  return "applied"
}

export const STAGE_CONFIG: Record<
  ScreeningStage,
  {
    label: string
    badgeColor: string
    cardBorder: string
    columnHeaderColor: string
    description: string
  }
> = {
  applied: {
    label: "New / Applied",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    cardBorder: "border-blue-500/20",
    columnHeaderColor: "bg-blue-500",
    description: "New incoming applications awaiting first review",
  },
  shortlisted: {
    label: "Shortlisted",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    cardBorder: "border-emerald-500/20",
    columnHeaderColor: "bg-emerald-500",
    description: "Strong matches meeting requirements",
  },
  deferred: {
    label: "Deferred / Maybe",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    cardBorder: "border-amber-500/20",
    columnHeaderColor: "bg-amber-500",
    description: "Kept on hold for backup or secondary consideration",
  },
  audition: {
    label: "Interview / Audition",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    cardBorder: "border-purple-500/20",
    columnHeaderColor: "bg-purple-500",
    description: "Scheduled for in-person, video call, or self-tape",
  },
  selected: {
    label: "Hired / Booked",
    badgeColor: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    cardBorder: "border-teal-500/20",
    columnHeaderColor: "bg-teal-500",
    description: "Offer accepted / booked for the role",
  },
  rejected: {
    label: "Rejected / Archived",
    badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    cardBorder: "border-rose-500/20",
    columnHeaderColor: "bg-rose-500",
    description: "Not selected for this casting call",
  },
}
