"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { TalentBlackout, CalendarEvent } from "@/types/calendar"
import { INITIAL_DEMO_BLACKOUTS, INITIAL_DEMO_CALENDAR_EVENTS } from "@/hooks/useAgencyCalendar"
import { REPRESENTED_TALENT_ROSTER } from "@/hooks/useCastingPipeline"
import { addBlackoutPeriodAction, deleteBlackoutPeriodAction } from "@/app/(dashboard)/talent/availability/actions"
import { isDateWithinRange, formatDateToISO } from "@/lib/calendar-utils"
import { useToast } from "@/components/ui/toast"

export function useTalentAvailability(defaultTalentId: string = "t-zara-noor") {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [selectedTalentId, setSelectedTalentId] = useState<string>(defaultTalentId)
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(2026, 10, 1))

  // Find talent profile object
  const activeTalent =
    REPRESENTED_TALENT_ROSTER.find((t) => t.id === selectedTalentId) ||
    REPRESENTED_TALENT_ROSTER[0]

  // Query blackouts
  const { data: blackouts = INITIAL_DEMO_BLACKOUTS, isLoading: isLoadingBlackouts } = useQuery<
    TalentBlackout[]
  >({
    queryKey: ["talent-blackouts", selectedTalentId],
    queryFn: async () => {
      try {
        const supabase = createClient()
        const { data, error } = await (supabase as any)
          .from("talent_availability")
          .select("*")
          .eq("talent_id", selectedTalentId)
          .order("start_date", { ascending: true })

        if (error || !data || data.length === 0) {
          return INITIAL_DEMO_BLACKOUTS.filter((b) => b.talent_id === selectedTalentId)
        }
        return data as TalentBlackout[]
      } catch {
        return INITIAL_DEMO_BLACKOUTS.filter((b) => b.talent_id === selectedTalentId)
      }
    },
  })

  // Relevant bookings and holds for this talent
  const talentEvents = INITIAL_DEMO_CALENDAR_EVENTS.filter(
    (e) => e.talent_id === selectedTalentId
  )

  // Add blackout mutation
  const addBlackoutMutation = useMutation({
    mutationFn: async ({
      startDate,
      endDate,
      reason,
    }: {
      startDate: string
      endDate: string
      reason?: string
    }) => {
      return await addBlackoutPeriodAction(startDate, endDate, reason, selectedTalentId)
    },
    onSuccess: (_, variables) => {
      // Optimistically update query data
      queryClient.setQueryData<TalentBlackout[]>(
        ["talent-blackouts", selectedTalentId],
        (prev = []) => [
          ...prev,
          {
            id: `blackout-${Date.now()}`,
            talent_id: selectedTalentId,
            start_date: variables.startDate,
            end_date: variables.endDate,
            status: "unavailable",
            reason: variables.reason || null,
            created_at: new Date().toISOString(),
          },
        ]
      )
      toast({
        title: "Blackout Dates Added",
        description: `Successfully marked unavailable from ${variables.startDate} to ${variables.endDate}.`,
        variant: "default",
      })
    },
    onError: (err: any) => {
      toast({
        title: "Action Failed",
        description: err.message || "Could not save blackout dates.",
        variant: "destructive",
      })
    },
  })

  // Delete blackout mutation
  const deleteBlackoutMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteBlackoutPeriodAction(id)
    },
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<TalentBlackout[]>(
        ["talent-blackouts", selectedTalentId],
        (prev = []) => prev.filter((b) => b.id !== deletedId)
      )
      toast({
        title: "Blackout Removed",
        description: "Dates are now marked as available for casting offers.",
      })
    },
  })

  // Helper to determine status and details of a single day
  const getDayAvailabilityStatus = (dateStr: string) => {
    // 1. Confirmed Shoot Booking takes precedence
    const booking = talentEvents.find(
      (e) =>
        e.event_type === "booking" &&
        isDateWithinRange(dateStr, e.start_time.split("T")[0], e.end_time.split("T")[0])
    )
    if (booking) {
      return {
        status: "booking" as const,
        title: booking.title,
        color: "#10b981",
        label: "Confirmed Shoot",
        event: booking,
      }
    }

    // 2. Blackout dates marked by talent
    const blackout = blackouts.find((b) =>
      isDateWithinRange(dateStr, b.start_date, b.end_date)
    )
    if (blackout) {
      return {
        status: "blackout" as const,
        title: blackout.reason || "Unavailable",
        color: "#6b7280",
        label: "Blackout Period",
        blackout,
      }
    }

    // 3. Active Hold
    const hold = talentEvents.find(
      (e) =>
        e.event_type === "hold" &&
        isDateWithinRange(dateStr, e.start_time.split("T")[0], e.end_time.split("T")[0])
    )
    if (hold) {
      return {
        status: "hold" as const,
        title: hold.title,
        color: hold.details_json?.priority === 1 ? "#f59e0b" : "#f97316",
        label: hold.details_json?.priority === 1 ? "1st Priority Hold" : "2nd Priority Hold",
        event: hold,
      }
    }

    // 4. Audition
    const audition = talentEvents.find(
      (e) =>
        e.event_type === "audition" &&
        isDateWithinRange(dateStr, e.start_time.split("T")[0], e.end_time.split("T")[0])
    )
    if (audition) {
      return {
        status: "audition" as const,
        title: audition.title,
        color: "#3b82f6",
        label: "Audition Slot",
        event: audition,
      }
    }

    return {
      status: "available" as const,
      title: "Available",
      color: "#22c55e",
      label: "Available for Bookings",
    }
  }

  return {
    selectedTalentId,
    setSelectedTalentId,
    activeTalent,
    talentRoster: REPRESENTED_TALENT_ROSTER,
    blackouts,
    talentEvents,
    currentMonthDate,
    setCurrentMonthDate,
    isLoading: isLoadingBlackouts,
    addBlackout: addBlackoutMutation.mutate,
    isAddingBlackout: addBlackoutMutation.isPending,
    deleteBlackout: deleteBlackoutMutation.mutate,
    isDeletingBlackout: deleteBlackoutMutation.isPending,
    getDayAvailabilityStatus,
  }
}
