"use client"

import React from "react"
import Link from "next/link"
import { CalendarEvent, EVENT_TYPE_CONFIG } from "@/types/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  X,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Phone,
  User,
  Building2,
  Video,
  FileText,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Flame,
  CreditCard,
  Tv,
} from "lucide-react"
import { formatTimeRange } from "@/lib/calendar-utils"
import { useToast } from "@/components/ui/toast"

interface EventDrawerProps {
  isOpen: boolean
  onClose: () => void
  event: CalendarEvent | null
}

export function EventDrawer({ isOpen, onClose, event }: EventDrawerProps) {
  const { toast } = useToast()

  if (!isOpen || !event) return null

  const isBooking = event.event_type === "booking"
  const isAudition = event.event_type === "audition"
  const isHold = event.event_type === "hold"
  const isBlackout = event.event_type === "blackout"

  const holdPriority = event.details_json?.priority || 1
  const typeKey =
    isHold && holdPriority === 2
      ? "hold2nd"
      : isHold
      ? "hold1st"
      : event.event_type
  const typeConfig = EVENT_TYPE_CONFIG[typeKey as keyof typeof EVENT_TYPE_CONFIG] || EVENT_TYPE_CONFIG.booking

  const startDateStr = event.start_time.split("T")[0]
  const endDateStr = event.end_time.split("T")[0]
  const isSingleDay = startDateStr === endDateStr

  const handleActionToast = (actionName: string) => {
    toast({
      title: `${actionName} Initiated`,
      description: `Action dispatched for ${event.title}.`,
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-card border-l border-border shadow-2xl flex flex-col justify-between overflow-y-auto">
          {/* Drawer Header */}
          <div>
            <div className="p-6 border-b border-border/60 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeConfig.badgeClass}`}
                  >
                    {typeConfig.label}
                  </span>
                  {event.details_json?.status && (
                    <Badge variant="outline" className="text-[11px] capitalize">
                      {event.details_json.status}
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-heading font-bold text-foreground leading-snug">
                  {event.title}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground shrink-0 rounded-full"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6">
              {/* Talent Profile Card */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Represented Talent
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-600 font-bold text-sm">
                      {event.talent_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">
                        {event.talent_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {event.talent_id}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/talent/profile`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 px-2.5 py-1 rounded-md transition-colors"
                  >
                    Comp Card <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Date & Time Window */}
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Schedule & Timing
                </div>
                <div className="rounded-xl border border-border/60 p-4 space-y-2.5 bg-card">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Calendar className="h-4 w-4 text-brand-500 shrink-0" />
                    <span className="font-medium">
                      {isSingleDay
                        ? startDateStr
                        : `${startDateStr} to ${endDateStr}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>
                      {isBooking && event.details_json?.call_time
                        ? `Call Time: ${event.details_json.call_time} — Wrap: ${event.details_json?.wrap_time || "20:00"}`
                        : formatTimeRange(event.start_time, event.end_time)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client & Production Details */}
              {event.client_name && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Client & Production House
                  </div>
                  <div className="rounded-xl border border-border/60 p-4 space-y-2 bg-card">
                    <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground">
                      <Building2 className="h-4 w-4 text-brand-500" />
                      {event.client_name}
                    </div>
                    {event.details_json?.director && (
                      <div className="text-xs text-muted-foreground">
                        Director: <span className="text-foreground font-medium">{event.details_json.director}</span>
                      </div>
                    )}
                    {event.details_json?.contact_person && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {event.details_json.contact_person} ({event.details_json?.contact_phone})
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Location or Meeting Link */}
              {event.details_json?.location && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Location & Access
                  </div>
                  <div className="rounded-xl border border-border/60 p-4 space-y-2 bg-card">
                    {String(event.details_json.location).startsWith("http") ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Video className="h-4 w-4 text-blue-500" />
                          <span>Virtual Video Audition</span>
                        </div>
                        <a
                          href={event.details_json.location}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md"
                        >
                          Join Zoom <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start gap-2.5 text-sm text-foreground">
                          <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{event.details_json.location}</span>
                        </div>
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(event.details_json.location)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline pt-1"
                        >
                          Open in Google Maps <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Commercial Rights & Financials (For Bookings) */}
              {isBooking && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Commercial Terms & Usage Rights
                  </div>
                  <div className="rounded-xl border border-border/60 p-4 space-y-2.5 bg-card">
                    {event.details_json?.fee_amount && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-emerald-500" /> Total Booking Fee
                        </span>
                        <span className="font-bold text-foreground">
                          PKR {Number(event.details_json.fee_amount).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {event.details_json?.usage_rights && (
                      <div className="text-xs text-muted-foreground border-t border-border/40 pt-2">
                        <span className="font-semibold text-foreground">Usage Rights:</span>{" "}
                        {event.details_json.usage_rights}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Audition Notes & Feedback */}
              {isAudition && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Audition Evaluation
                  </div>
                  <div className="rounded-xl border border-border/60 p-4 space-y-2 bg-card">
                    {event.details_json?.score && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Audition Score:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {event.details_json.score} / 10.0
                        </span>
                      </div>
                    )}
                    {event.details_json?.feedback && (
                      <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-2">
                        &quot;{event.details_json.feedback}&quot;
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Hold Priority Information */}
              {isHold && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    {holdPriority === 1 ? "1st Priority Hold Active" : "2nd Priority Hold"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {holdPriority === 1
                      ? "First right of refusal held by client. In case of 2nd hold booking challenge, 24-hour response clock will activate."
                      : "Placed behind 1st hold. If ready to book, issue a 24-hour challenge to force client decision."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-6 border-t border-border/60 bg-muted/20 space-y-2 shrink-0">
            {isBooking && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold"
                  onClick={() => handleActionToast("Call Sheet Dispatched")}
                >
                  <FileText className="h-3.5 w-3.5 mr-1" /> View Call Sheet
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleActionToast("Edit Booking")}
                >
                  Edit Booking
                </Button>
              </div>
            )}

            {isHold && (
              <div className="space-y-2">
                {holdPriority === 2 && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                    onClick={() => handleActionToast("24-Hour Hold Challenge")}
                  >
                    <Flame className="h-3.5 w-3.5 mr-1" /> Issue 24h Challenge
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs text-red-600 border-red-500/30 hover:bg-red-500/10"
                    onClick={() => handleActionToast("Release Hold")}
                  >
                    Release Hold
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                    onClick={() => handleActionToast("Confirm Booking")}
                  >
                    Confirm Shoot
                  </Button>
                </div>
              </div>
            )}

            {isAudition && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold"
                  onClick={() => handleActionToast("Reschedule Audition")}
                >
                  Reschedule
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => handleActionToast("Record Audition Score")}
                >
                  Grade Audition
                </Button>
              </div>
            )}

            {isBlackout && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-red-600 border-red-500/30 hover:bg-red-500/10"
                onClick={() => handleActionToast("Unblock Dates")}
              >
                Clear Unavailability
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
