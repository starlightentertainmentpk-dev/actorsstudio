"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Deal, Booking, Hold, DealStatus, ConflictResult } from "@/types/deals"
import {
  createDealAction,
  updateDealStatusAction,
  createBookingAction,
  createHoldAction,
  challengeFirstHoldAction,
  releaseHoldAction,
  confirmHoldToBookingAction,
} from "@/app/(dashboard)/agency/deals/actions"
import { evaluateTalentConflicts } from "@/lib/services/conflict-detector"
import { REPRESENTED_TALENT_ROSTER } from "@/hooks/useCastingPipeline"

export const INITIAL_DEMO_DEALS: Deal[] = [
  {
    id: "deal-shan-ramadan",
    organization_id: "default-org",
    client_id: "c4-shan-foods",
    client_name: "Shan Foods Global",
    casting_call_id: "p-ramadan-2026",
    talent_id: "t-zara-noor",
    talent_name: "Zara Noor",
    talent_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    deal_name: "Shan Foods Festive Ramadan TVC & Digital Campaign",
    deal_value: 1200000,
    agency_commission_amount: 240000,
    agency_commission_rate: 20,
    talent_payout_amount: 960000,
    currency: "PKR",
    payment_terms: "50% Advance, 50% on Wrap",
    status: "proposal",
    start_date: "2026-11-01",
    end_date: "2026-11-03",
    notes: "Hero family protagonist role. Client requested exclusive non-compete for spice brands.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "deal-pepsi-series",
    organization_id: "default-org",
    client_id: "c3-multiverse",
    client_name: "Multiverse Productions",
    casting_call_id: null,
    talent_id: "t-bilal-khan",
    talent_name: "Bilal Khan",
    talent_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    deal_name: "Pepsi Youth Music & Sports Anthem Series",
    deal_value: 2500000,
    agency_commission_amount: 500000,
    agency_commission_rate: 20,
    talent_payout_amount: 2000000,
    currency: "PKR",
    payment_terms: "Net 30",
    status: "negotiation",
    start_date: "2026-11-15",
    end_date: "2026-11-18",
    notes: "Negotiating exclusivity buyout clause for GCC digital release.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "deal-dawn-khwaab",
    organization_id: "default-org",
    client_id: "c1-dawn-films",
    client_name: "Dawn Films & Media",
    casting_call_id: "p-ramadan-2026",
    talent_id: "t-mahnoor-s",
    talent_name: "Mahnoor Sheikh",
    talent_avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    deal_name: "Prime-Time Drama 'Khwaab Nagar' 30-Episode Run",
    deal_value: 1800000,
    agency_commission_amount: 270000,
    agency_commission_rate: 15,
    talent_payout_amount: 1530000,
    currency: "PKR",
    payment_terms: "Monthly Retainer (Net 15)",
    status: "approved",
    start_date: "2026-12-15",
    end_date: "2027-01-25",
    notes: "Cast approval received from Director. Ready for contract generation.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: "deal-jazz-billboard",
    organization_id: "default-org",
    client_id: "c3-multiverse",
    client_name: "Multiverse Productions",
    casting_call_id: null,
    talent_id: "t-alizeh-r",
    talent_name: "Alizeh Rehman",
    talent_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    deal_name: "Jazz 4G National Billboard & TVC Campaign",
    deal_value: 3200000,
    agency_commission_amount: 640000,
    agency_commission_rate: 20,
    talent_payout_amount: 2560000,
    currency: "PKR",
    payment_terms: "Net 30",
    status: "contract",
    start_date: "2026-11-10",
    end_date: "2026-11-12",
    notes: "Contract legal review completed. Awaiting client signature.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "deal-khaadi-lawn",
    organization_id: "default-org",
    client_id: "c2-hum-network",
    client_name: "Hum Network Studios",
    casting_call_id: null,
    talent_id: "t-sarah-khan",
    talent_name: "Sarah Tariq",
    talent_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
    deal_name: "Khaadi Festive Lawn Commercial & Catalog",
    deal_value: 1500000,
    agency_commission_amount: 300000,
    agency_commission_rate: 20,
    talent_payout_amount: 1200000,
    currency: "PKR",
    payment_terms: "100% on Completion",
    status: "booked",
    start_date: "2026-10-20",
    end_date: "2026-10-22",
    notes: "Call sheet issued. Confirmed booking locked in system.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "deal-hum-mystery",
    organization_id: "default-org",
    client_id: "c2-hum-network",
    client_name: "Hum Network Studios",
    casting_call_id: null,
    talent_id: "t-hamza-ali",
    talent_name: "Hamza Ali",
    talent_avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
    deal_name: "Hum TV Mystery Thriller Series Lead",
    deal_value: 4000000,
    agency_commission_amount: 600000,
    agency_commission_rate: 15,
    talent_payout_amount: 3400000,
    currency: "PKR",
    payment_terms: "Net 45",
    status: "invoiced",
    start_date: "2026-09-01",
    end_date: "2026-10-05",
    notes: "Principal photography wrapped. Invoice #INV-2026-088 dispatched.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "deal-cornetto-love",
    organization_id: "default-org",
    client_id: "c4-shan-foods",
    client_name: "Shan Foods Global",
    casting_call_id: null,
    talent_id: "t-fawad-m",
    talent_name: "Fawad Malik",
    talent_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    deal_name: "Cornetto Pop Rock TV Commercial",
    deal_value: 1000000,
    agency_commission_amount: 200000,
    agency_commission_rate: 20,
    talent_payout_amount: 800000,
    currency: "PKR",
    payment_terms: "Net 15",
    status: "paid",
    start_date: "2026-08-10",
    end_date: "2026-08-12",
    notes: "Payment received via bank transfer. Talent payout processed.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
]

export const INITIAL_DEMO_BOOKINGS: Booking[] = [
  {
    id: "b-khaadi-shoot",
    organization_id: "default-org",
    deal_id: "deal-khaadi-lawn",
    client_id: "c2-hum-network",
    client_name: "Hum Network Studios",
    talent_id: "t-sarah-khan",
    talent_name: "Sarah Tariq",
    talent_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
    project_name: "Khaadi Festive Lawn Commercial",
    shoot_date_start: "2026-10-20",
    shoot_date_end: "2026-10-22",
    call_time: "07:00",
    wrap_time: "19:00",
    location_address: "Eastern Studios, Studio 3, Korangi, Karachi",
    fee_amount: 1500000,
    currency: "PKR",
    usage_rights: "1 Year Digital + TVC",
    territory: "Pakistan",
    media: "TV, Digital, Social, Print",
    status: "confirmed",
    conflict_override: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: "b-jazz-shoot",
    organization_id: "default-org",
    deal_id: "deal-jazz-billboard",
    client_id: "c3-multiverse",
    client_name: "Multiverse Productions",
    talent_id: "t-alizeh-r",
    talent_name: "Alizeh Rehman",
    talent_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    project_name: "Jazz 4G National Commercial",
    shoot_date_start: "2026-11-10",
    shoot_date_end: "2026-11-12",
    call_time: "06:30",
    wrap_time: "18:00",
    location_address: "DHA Phase 8 Outdoor Sets, Karachi",
    fee_amount: 3200000,
    currency: "PKR",
    usage_rights: "2 Years Full Media",
    territory: "Pakistan + GCC / Middle East",
    media: "TV, Digital, Billboards, Cinema",
    status: "confirmed",
    conflict_override: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
]

export const INITIAL_DEMO_HOLDS: Hold[] = [
  {
    id: "h-zara-festive",
    organization_id: "default-org",
    client_id: "c4-shan-foods",
    client_name: "Shan Foods Global",
    talent_id: "t-zara-noor",
    talent_name: "Zara Noor",
    talent_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    hold_date_start: "2026-11-01",
    hold_date_end: "2026-11-03",
    priority_level: 1, // First Hold
    project_title: "Shan Foods Ramadan Commercial",
    status: "active",
    notes: "First priority hold for 3-day television commercial shoot in Lahore.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "h-bilal-hum",
    organization_id: "default-org",
    client_id: "c2-hum-network",
    client_name: "Hum Network Studios",
    talent_id: "t-bilal-khan",
    talent_name: "Bilal Khan",
    talent_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    hold_date_start: "2026-11-15",
    hold_date_end: "2026-11-18",
    priority_level: 1, // First Hold
    project_title: "Hum Network Action Series Pilot",
    status: "active",
    notes: "First hold placed by Producer Mustafa for desert stunt sequences.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: "h-bilal-olpers-2nd",
    organization_id: "default-org",
    client_id: "c3-multiverse",
    client_name: "Multiverse Productions",
    talent_id: "t-bilal-khan",
    talent_name: "Bilal Khan",
    talent_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    hold_date_start: "2026-11-15",
    hold_date_end: "2026-11-17",
    priority_level: 2, // Second Hold
    project_title: "Olper's Dairy National Commercial",
    status: "active",
    notes: "Second hold waiting behind Hum Network. Ready to challenge if required.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
  {
    id: "h-mahnoor-challenged",
    organization_id: "default-org",
    client_id: "c1-dawn-films",
    client_name: "Dawn Films & Media",
    talent_id: "t-mahnoor-s",
    talent_name: "Mahnoor Sheikh",
    talent_avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    hold_date_start: "2026-11-25",
    hold_date_end: "2026-11-27",
    priority_level: 1,
    project_title: "Vital Tea Seasonal Campaign",
    status: "challenged",
    challenged_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    challenge_expires_at: new Date(Date.now() + 1000 * 60 * 60 * 19).toISOString(),
    notes: "Challenged by 2nd hold holder (Lipton TVC). 19 hours remaining for Dawn Films to confirm or release.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
]

// In-memory reactive state stores for session preview
let localDealsStore: Deal[] = [...INITIAL_DEMO_DEALS]
let localBookingsStore: Booking[] = [...INITIAL_DEMO_BOOKINGS]
let localHoldsStore: Hold[] = [...INITIAL_DEMO_HOLDS]

export function useDeals() {
  const queryClient = useQueryClient()

  // Deals Query
  const { data: deals = localDealsStore, isLoading: isDealsLoading } = useQuery({
    queryKey: ["agency-deals"],
    queryFn: async (): Promise<Deal[]> => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("deals")
          .select("*, clients(company_name), talent_profiles(stage_name, full_name, avatar_url)")
          .order("created_at", { ascending: false })

        if (error || !data || data.length === 0) {
          return localDealsStore
        }

        const mapped: Deal[] = data.map((d: any) => ({
          id: d.id,
          organization_id: d.organization_id,
          client_id: d.client_id,
          client_name: d.clients?.company_name || "Client Account",
          casting_call_id: d.casting_call_id,
          talent_id: d.talent_id,
          talent_name: d.talent_profiles?.stage_name || d.talent_profiles?.full_name || "Represented Talent",
          talent_avatar: d.talent_profiles?.avatar_url,
          deal_name: d.deal_name,
          deal_value: Number(d.deal_value),
          agency_commission_amount: Number(d.agency_commission_amount),
          agency_commission_rate: Math.round((Number(d.agency_commission_amount) / Number(d.deal_value)) * 100),
          talent_payout_amount: Number(d.talent_payout_amount),
          currency: d.currency || "PKR",
          payment_terms: d.payment_terms || "Net 30",
          status: d.status,
          start_date: d.start_date,
          end_date: d.end_date,
          notes: d.notes,
          created_at: d.created_at,
          updated_at: d.updated_at,
        }))
        return mapped
      } catch {
        return localDealsStore
      }
    },
  })

  // Bookings Query
  const { data: bookings = localBookingsStore } = useQuery({
    queryKey: ["agency-bookings"],
    queryFn: async (): Promise<Booking[]> => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("bookings")
          .select("*, clients(company_name), talent_profiles(stage_name, full_name, avatar_url)")
          .order("shoot_date_start", { ascending: true })

        if (error || !data || data.length === 0) {
          return localBookingsStore
        }

        return data.map((b: any) => ({
          id: b.id,
          organization_id: b.organization_id,
          deal_id: b.deal_id,
          client_id: b.client_id,
          client_name: b.clients?.company_name || "Client",
          talent_id: b.talent_id,
          talent_name: b.talent_profiles?.stage_name || b.talent_profiles?.full_name || "Represented Talent",
          talent_avatar: b.talent_profiles?.avatar_url,
          project_name: b.project_name,
          shoot_date_start: b.shoot_date_start,
          shoot_date_end: b.shoot_date_end,
          call_time: b.call_time,
          wrap_time: b.wrap_time,
          location_address: b.location_address,
          fee_amount: Number(b.fee_amount),
          currency: b.currency || "PKR",
          usage_rights: b.usage_rights,
          territory: b.territory,
          media: b.media,
          status: b.status,
          conflict_override: b.conflict_override,
          created_at: b.created_at,
          updated_at: b.updated_at,
        }))
      } catch {
        return localBookingsStore
      }
    },
  })

  // Holds Query
  const { data: holds = localHoldsStore } = useQuery({
    queryKey: ["agency-holds"],
    queryFn: async (): Promise<Hold[]> => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("holds")
          .select("*, clients(company_name), talent_profiles(stage_name, full_name, avatar_url)")
          .order("hold_date_start", { ascending: true })

        if (error || !data || data.length === 0) {
          return localHoldsStore
        }

        return data.map((h: any) => ({
          id: h.id,
          organization_id: h.organization_id,
          client_id: h.client_id,
          client_name: h.clients?.company_name || "Client",
          talent_id: h.talent_id,
          talent_name: h.talent_profiles?.stage_name || h.talent_profiles?.full_name || "Represented Talent",
          talent_avatar: h.talent_profiles?.avatar_url,
          hold_date_start: h.hold_date_start,
          hold_date_end: h.hold_date_end,
          priority_level: h.priority_level,
          project_title: h.project_title,
          status: h.status,
          challenged_at: h.challenged_at,
          challenge_expires_at: h.challenge_expires_at,
          notes: h.notes,
          created_at: h.created_at,
        }))
      } catch {
        return localHoldsStore
      }
    },
  })

  // Mutation: Create Deal
  const createDealMutation = useMutation({
    mutationFn: async (input: {
      orgId: string
      clientId: string
      clientName?: string
      talentId: string
      dealName: string
      dealValue: number
      agencyCommissionAmount: number
      talentPayoutAmount: number
      currency?: string
      paymentTerms?: string
      startDate?: string
      endDate?: string
      notes?: string
    }) => {
      const talent = REPRESENTED_TALENT_ROSTER.find((t) => t.id === input.talentId)
      const commissionRate = Math.round((input.agencyCommissionAmount / input.dealValue) * 100)

      const newDeal: Deal = {
        id: `deal-${Date.now()}`,
        organization_id: input.orgId,
        client_id: input.clientId,
        client_name: input.clientName || "Client Account",
        talent_id: input.talentId,
        talent_name: talent?.full_name || "Represented Talent",
        talent_avatar: talent?.avatar_url || null,
        deal_name: input.dealName,
        deal_value: input.dealValue,
        agency_commission_amount: input.agencyCommissionAmount,
        agency_commission_rate: commissionRate,
        talent_payout_amount: input.talentPayoutAmount,
        currency: input.currency || "PKR",
        payment_terms: input.paymentTerms || "Net 30",
        status: "proposal",
        start_date: input.startDate || null,
        end_date: input.endDate || null,
        notes: input.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      localDealsStore = [newDeal, ...localDealsStore]

      await createDealAction(input.orgId, {
        organizationId: input.orgId,
        clientId: input.clientId,
        talentId: input.talentId,
        dealName: input.dealName,
        dealValue: input.dealValue,
        agencyCommissionAmount: input.agencyCommissionAmount,
        talentPayoutAmount: input.talentPayoutAmount,
        currency: input.currency || "PKR",
        paymentTerms: input.paymentTerms || "Net 30",
        status: "proposal",
        startDate: input.startDate,
        endDate: input.endDate,
        notes: input.notes,
      })

      return newDeal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-deals"] })
    },
  })

  // Mutation: Update Deal Status
  const updateDealStatusMutation = useMutation({
    mutationFn: async ({ dealId, status, notes }: { dealId: string; status: DealStatus; notes?: string }) => {
      localDealsStore = localDealsStore.map((d) =>
        d.id === dealId
          ? {
              ...d,
              status,
              notes: notes || d.notes,
              updated_at: new Date().toISOString(),
            }
          : d
      )

      await updateDealStatusAction(dealId, status, notes)
      return { dealId, status }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-deals"] })
    },
  })

  // Mutation: Create Booking
  const createBookingMutation = useMutation({
    mutationFn: async (input: {
      orgId: string
      dealId?: string
      clientId: string
      clientName?: string
      talentId: string
      projectName: string
      shootDateStart: string
      shootDateEnd: string
      callTime?: string
      wrapTime?: string
      locationAddress?: string
      feeAmount: number
      currency?: string
      usageRights: string
      territory?: string
      media?: string
      conflictOverride?: boolean
    }) => {
      const talent = REPRESENTED_TALENT_ROSTER.find((t) => t.id === input.talentId)

      const newBooking: Booking = {
        id: `booking-${Date.now()}`,
        organization_id: input.orgId,
        deal_id: input.dealId || null,
        client_id: input.clientId,
        client_name: input.clientName || "Client Account",
        talent_id: input.talentId,
        talent_name: talent?.full_name || "Represented Talent",
        talent_avatar: talent?.avatar_url || null,
        project_name: input.projectName,
        shoot_date_start: input.shootDateStart,
        shoot_date_end: input.shootDateEnd,
        call_time: input.callTime || null,
        wrap_time: input.wrapTime || null,
        location_address: input.locationAddress || null,
        fee_amount: input.feeAmount,
        currency: input.currency || "PKR",
        usage_rights: input.usageRights,
        territory: input.territory || "Pakistan",
        media: input.media || "TV, Digital, Social",
        status: "confirmed",
        conflict_override: input.conflictOverride || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      localBookingsStore = [newBooking, ...localBookingsStore]

      // If associated with a deal, update deal status to booked
      if (input.dealId) {
        localDealsStore = localDealsStore.map((d) =>
          d.id === input.dealId ? { ...d, status: "booked", updated_at: new Date().toISOString() } : d
        )
      }

      await createBookingAction(input.orgId, {
        organizationId: input.orgId,
        dealId: input.dealId,
        clientId: input.clientId,
        talentId: input.talentId,
        projectName: input.projectName,
        shootDateStart: input.shootDateStart,
        shootDateEnd: input.shootDateEnd,
        callTime: input.callTime,
        wrapTime: input.wrapTime,
        locationAddress: input.locationAddress,
        feeAmount: input.feeAmount,
        currency: input.currency || "PKR",
        usageRights: input.usageRights,
        territory: input.territory || "Pakistan",
        media: input.media || "TV, Digital, Social",
        conflictOverride: input.conflictOverride || false,
      })

      return newBooking
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-bookings"] })
      queryClient.invalidateQueries({ queryKey: ["agency-deals"] })
    },
  })

  // Mutation: Create Hold
  const createHoldMutation = useMutation({
    mutationFn: async (input: {
      orgId: string
      clientId: string
      clientName?: string
      talentId: string
      holdDateStart: string
      holdDateEnd: string
      priorityLevel: number
      projectTitle: string
      notes?: string
    }) => {
      const talent = REPRESENTED_TALENT_ROSTER.find((t) => t.id === input.talentId)

      const newHold: Hold = {
        id: `hold-${Date.now()}`,
        organization_id: input.orgId,
        client_id: input.clientId,
        client_name: input.clientName || "Client Account",
        talent_id: input.talentId,
        talent_name: talent?.full_name || "Represented Talent",
        talent_avatar: talent?.avatar_url || null,
        hold_date_start: input.holdDateStart,
        hold_date_end: input.holdDateEnd,
        priority_level: input.priorityLevel || 1,
        project_title: input.projectTitle,
        status: "active",
        notes: input.notes || null,
        created_at: new Date().toISOString(),
      }

      localHoldsStore = [newHold, ...localHoldsStore]

      await createHoldAction(input.orgId, {
        organizationId: input.orgId,
        clientId: input.clientId,
        talentId: input.talentId,
        holdDateStart: input.holdDateStart,
        holdDateEnd: input.holdDateEnd,
        priorityLevel: input.priorityLevel || 1,
        projectTitle: input.projectTitle,
        notes: input.notes,
      })

      return newHold
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-holds"] })
    },
  })

  // Mutation: Challenge First Hold (24-Hour Challenge)
  const challengeHoldMutation = useMutation({
    mutationFn: async (holdId: string) => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const challengedAt = new Date().toISOString()

      localHoldsStore = localHoldsStore.map((h) =>
        h.id === holdId
          ? {
              ...h,
              status: "challenged",
              challenged_at: challengedAt,
              challenge_expires_at: expiresAt,
            }
          : h
      )

      await challengeFirstHoldAction(holdId)
      return { holdId, expiresAt }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-holds"] })
    },
  })

  // Mutation: Release Hold
  const releaseHoldMutation = useMutation({
    mutationFn: async ({ holdId, reason }: { holdId: string; reason?: string }) => {
      localHoldsStore = localHoldsStore.map((h) =>
        h.id === holdId ? { ...h, status: "released", notes: reason ? `Released: ${reason}` : h.notes } : h
      )

      await releaseHoldAction(holdId, reason)
      return { holdId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-holds"] })
    },
  })

  // Mutation: Confirm Hold to Booking
  const confirmHoldMutation = useMutation({
    mutationFn: async (hold: Hold) => {
      localHoldsStore = localHoldsStore.map((h) =>
        h.id === hold.id ? { ...h, status: "confirmed" } : h
      )

      // Also create confirmed booking
      const newBooking: Booking = {
        id: `booking-${Date.now()}`,
        organization_id: hold.organization_id,
        deal_id: null,
        client_id: hold.client_id,
        client_name: hold.client_name,
        talent_id: hold.talent_id,
        talent_name: hold.talent_name,
        talent_avatar: hold.talent_avatar,
        project_name: hold.project_title,
        shoot_date_start: hold.hold_date_start,
        shoot_date_end: hold.hold_date_end,
        call_time: "08:00",
        wrap_time: "18:00",
        location_address: "To be confirmed by production",
        fee_amount: 500000,
        currency: "PKR",
        usage_rights: "1 Year Digital + TVC",
        territory: "Pakistan",
        media: "TV, Digital, Social",
        status: "confirmed",
        conflict_override: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      localBookingsStore = [newBooking, ...localBookingsStore]

      await confirmHoldToBookingAction(hold.id)
      return { holdId: hold.id, booking: newBooking }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agency-holds"] })
      queryClient.invalidateQueries({ queryKey: ["agency-bookings"] })
    },
  })

  // Synchronous client conflict check method
  const checkConflict = (
    talentId: string,
    startDate: string,
    endDate: string,
    excludeId?: string
  ): ConflictResult => {
    return evaluateTalentConflicts({
      talentId,
      startDate,
      endDate,
      bookings,
      holds,
      excludeId,
    })
  }

  // Financial KPI calculations
  const totalPipelineValue = deals.reduce((sum, d) => sum + (d.status !== "cancelled" ? d.deal_value : 0), 0)
  const projectedCommission = deals.reduce(
    (sum, d) => sum + (d.status !== "cancelled" ? d.agency_commission_amount : 0),
    0
  )
  const closedDealsThisMonth = deals.filter(
    (d) => d.status === "booked" || d.status === "invoiced" || d.status === "paid" || d.status === "completed"
  ).length
  const activeHoldsCount = holds.filter((h) => h.status === "active" || h.status === "challenged").length

  return {
    deals,
    bookings,
    holds,
    talentRoster: REPRESENTED_TALENT_ROSTER,
    isLoading: isDealsLoading,
    totalPipelineValue,
    projectedCommission,
    closedDealsThisMonth,
    activeHoldsCount,
    checkConflict,
    createDeal: createDealMutation.mutateAsync,
    isCreatingDeal: createDealMutation.isPending,
    updateDealStatus: updateDealStatusMutation.mutateAsync,
    isUpdatingStatus: updateDealStatusMutation.isPending,
    createBooking: createBookingMutation.mutateAsync,
    isCreatingBooking: createBookingMutation.isPending,
    createHold: createHoldMutation.mutateAsync,
    isCreatingHold: createHoldMutation.isPending,
    challengeHold: challengeHoldMutation.mutateAsync,
    isChallengingHold: challengeHoldMutation.isPending,
    releaseHold: releaseHoldMutation.mutateAsync,
    isReleasingHold: releaseHoldMutation.isPending,
    confirmHold: confirmHoldMutation.mutateAsync,
    isConfirmingHold: confirmHoldMutation.isPending,
  }
}
