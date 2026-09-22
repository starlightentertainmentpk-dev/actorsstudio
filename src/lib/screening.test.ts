import { describe, it, expect } from "vitest"
import {
  parseScreeningData,
  encodeScreeningData,
  getEffectiveStage,
  ScreeningMetadata,
} from "./screening"

describe("Screening Helper Functions", () => {
  it("parses clean cover note when no screening tag is present", () => {
    const raw = "I am excited to audition for the role."
    const { cleanCoverNote, screening } = parseScreeningData(raw)
    expect(cleanCoverNote).toBe("I am excited to audition for the role.")
    expect(screening).toEqual({})
  })

  it("handles null or empty cover note gracefully", () => {
    const { cleanCoverNote, screening } = parseScreeningData(null)
    expect(cleanCoverNote).toBe("")
    expect(screening).toEqual({})
  })

  it("encodes and parses screening metadata seamlessly", () => {
    const note = "Available on weekdays."
    const meta: ScreeningMetadata = {
      isDeferred: true,
      rating: 4,
      notes: "Promising theatre background.",
      interview: {
        mode: "video_call",
        scheduledAt: "2026-10-01T10:00:00Z",
        locationOrLink: "https://meet.google.com/xyz-abc",
        instructions: "Prepare monologue",
      },
    }

    const encoded = encodeScreeningData(note, meta)
    expect(encoded).toContain("Available on weekdays.")
    expect(encoded).toContain("<!--ATS_SCREENING:")

    const parsed = parseScreeningData(encoded)
    expect(parsed.cleanCoverNote).toBe("Available on weekdays.")
    expect(parsed.screening.isDeferred).toBe(true)
    expect(parsed.screening.rating).toBe(4)
    expect(parsed.screening.notes).toBe("Promising theatre background.")
    expect(parsed.screening.interview?.mode).toBe("video_call")
  })

  it("correctly resolves effective ATS stages", () => {
    expect(getEffectiveStage("applied", {})).toBe("applied")
    expect(getEffectiveStage("applied", { isDeferred: true })).toBe("deferred")
    expect(getEffectiveStage("shortlisted", {})).toBe("shortlisted")
    expect(getEffectiveStage("audition", {})).toBe("audition")
    expect(getEffectiveStage("selected", {})).toBe("selected")
    expect(getEffectiveStage("rejected", {})).toBe("rejected")
  })
})
