"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Users, X, Loader2 } from "lucide-react"

interface CreateRoleModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
  onAddRole: (roleData: {
    role_name: string
    role_type: string
    gender_requirement?: string
    age_min?: number
    age_max?: number
    pay_rate?: string
    description?: string
  }) => Promise<any>
}

export function CreateRoleModal({
  projectId,
  isOpen,
  onClose,
  onAddRole,
}: CreateRoleModalProps) {
  const [roleName, setRoleName] = useState("")
  const [roleType, setRoleType] = useState("lead")
  const [gender, setGender] = useState("female")
  const [ageMin, setAgeMin] = useState<number | "">("")
  const [ageMax, setAgeMax] = useState<number | "">("")
  const [payRate, setPayRate] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName.trim()) {
      setErrorMsg("Role name is required.")
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMsg(null)
      await onAddRole({
        role_name: roleName.trim(),
        role_type: roleType,
        gender_requirement: gender,
        age_min: ageMin ? Number(ageMin) : undefined,
        age_max: ageMax ? Number(ageMax) : undefined,
        pay_rate: payRate.trim() || undefined,
        description: description.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create casting role.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Add Casting Role
              </h2>
              <p className="text-xs text-muted-foreground">
                Define a character or part for this casting project.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Role Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Main Lead — Hamza, Mother, Stunt Artist"
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Role Type</label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="lead">Lead</option>
                <option value="supporting">Supporting</option>
                <option value="extra">Background / Extra</option>
                <option value="voiceover">Voiceover</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Gender Requirement</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">Any / Not Specified</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Age Range Min</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 22"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Age Range Max</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value ? Number(e.target.value) : "")}
                placeholder="e.g. 28"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Target Pay Rate / Budget</label>
            <Input
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
              placeholder="e.g. PKR 500,000 / month, PKR 150,000 / day"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Description & Character Notes</label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key physical look, personality traits, dramatic nuances, dialect requirements..."
              className="text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating Role...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Create Role
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
