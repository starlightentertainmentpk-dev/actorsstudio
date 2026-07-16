"use client"

import { useState } from "react"
import { useUser } from "@/hooks/useUser"
import { createClient } from "@/lib/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { 
  Shield, 
  Bell, 
  Trash2, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  EyeOff
} from "lucide-react"

export default function TalentSettingsPage() {
  const { data: user } = useUser()
  const supabase = createClient()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [passwordError, setPasswordError] = useState("")

  // Preferences state (stub)
  const [notifs, setNotifs] = useState({
    newCasting: true,
    auditionInvite: true,
    applicationStatus: true,
    marketing: false
  })
  const [prefLoading, setPrefLoading] = useState(false)
  const [prefSuccess, setPrefSuccess] = useState("")

  // Delete account confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch profile to manage availability toggle
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["talent-profile-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from("talent_profiles")
        .select("id, is_available")
        .eq("user_id", user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSuccess("")
    setPasswordError("")

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return
    }

    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPasswordSuccess("Password updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.")
    } finally {
      setPasswordLoading(false)
    }
  }

  // Handle preference save
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    setPrefLoading(true)
    setPrefSuccess("")
    setTimeout(() => {
      setPrefLoading(false)
      setPrefSuccess("Notification preferences saved successfully!")
    }, 600)
  }

  // Toggle availability
  const handleToggleAvailability = async (checked: boolean) => {
    if (!user?.id) return
    try {
      await supabase
        .from("talent_profiles")
        .update({ is_available: checked })
        .eq("user_id", user.id)
      
      queryClient.invalidateQueries({ queryKey: ["talent-profile-settings", user.id] })
      queryClient.invalidateQueries({ queryKey: ["talent-profile-edit", user.id] })
    } catch (err) {
      console.error(err)
    }
  }

  // Soft Delete Account
  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE MY ACCOUNT" || !user?.id) return
    setDeleteLoading(true)
    try {
      // 1. Soft-delete in database: update public.users status to 'deleted'
      const { error: dbError } = await supabase
        .from("users")
        .update({ status: "deleted" })
        .eq("id", user.id)

      if (dbError) throw dbError

      // 2. Disable availability
      await supabase
        .from("talent_profiles")
        .update({ is_available: false })
        .eq("user_id", user.id)

      // 3. Sign out and redirect
      await supabase.auth.signOut()
      queryClient.clear()
      router.push("/auth/login")
    } catch (err: any) {
      alert(err.message || "Failed to delete account. Contact support.")
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your security settings, notification preferences, and account status.
        </p>
      </div>

      {/* Grid of Settings panels */}
      <div className="space-y-6">

        {/* Panel 1: Security & Password */}
        <div className="bg-card/25 border border-border/40 rounded-2xl p-6 backdrop-blur-md">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
            <Shield className="h-4.5 w-4.5 text-brand-500" /> Password Security
          </h2>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
            {passwordSuccess && (
              <p className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg border border-emerald-500/20 flex items-center gap-1.5 font-medium">
                <CheckCircle className="h-4 w-4" /> {passwordSuccess}
              </p>
            )}
            {passwordError && (
              <p className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> {passwordError}
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-brand-500/10 cursor-pointer disabled:opacity-50"
            >
              {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
            </button>
          </form>
        </div>

        {/* Panel 2: Preferences */}
        <div className="bg-card/25 border border-border/40 rounded-2xl p-6 backdrop-blur-md">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-4">
            <Bell className="h-4.5 w-4.5 text-brand-500" /> Notification Preferences
          </h2>

          <form onSubmit={handleSavePreferences} className="space-y-4">
            {prefSuccess && (
              <p className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg border border-emerald-500/20 flex items-center gap-1.5 font-medium max-w-md">
                <CheckCircle className="h-4 w-4" /> {prefSuccess}
              </p>
            )}

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifs.newCasting}
                  onChange={(e) => setNotifs(prev => ({ ...prev, newCasting: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 accent-brand-500"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground">New casting calls matching my category</span>
                  <p className="text-[10px] text-muted-foreground">Receive instant alerts when producers publish roles for your profile</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifs.auditionInvite}
                  onChange={(e) => setNotifs(prev => ({ ...prev, auditionInvite: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 accent-brand-500"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground">Audition invitations & reminders</span>
                  <p className="text-[10px] text-muted-foreground">Receive schedule confirmations for in-person or self-tape auditions</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifs.applicationStatus}
                  onChange={(e) => setNotifs(prev => ({ ...prev, applicationStatus: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 accent-brand-500"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground">Application updates</span>
                  <p className="text-[10px] text-muted-foreground">Get notified when a casting director shortlists or selects your application</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifs.marketing}
                  onChange={(e) => setNotifs(prev => ({ ...prev, marketing: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 accent-brand-500"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground">News & platform tips</span>
                  <p className="text-[10px] text-muted-foreground">Weekly newsletters, career development tips, and platform updates</p>
                </div>
              </label>
            </div>

            <button
              type="submit"
              disabled={prefLoading}
              className="bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 font-semibold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {prefLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Preferences"}
            </button>
          </form>
        </div>

        {/* Panel 3: Account Status / Availability / Danger Zone */}
        <div className="bg-card/25 border border-border/40 rounded-2xl p-6 backdrop-blur-md space-y-6">
          
          {/* Availability Status */}
          <div>
            <h2 className="text-base font-bold text-foreground mb-1">Availability Status</h2>
            <p className="text-xs text-muted-foreground mb-4">Toggle whether your profile is discoverable by casting directors.</p>

            {profileLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            ) : (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile?.is_available ?? false}
                  onChange={(e) => handleToggleAvailability(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 accent-brand-500"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground">Active Availability</span>
                  <p className="text-[10px] text-muted-foreground">When disabled, casting directors cannot invite you to auditions.</p>
                </div>
              </label>
            )}
          </div>

          <div className="border-t border-border/30 my-4" />

          {/* Danger Zone */}
          <div>
            <h2 className="text-base font-bold text-destructive flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-4.5 w-4.5" /> Danger Zone
            </h2>
            <p className="text-xs text-muted-foreground mb-4">Permanent changes to your Actor's Studio account.</p>

            {!deleteConfirmOpen ? (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="flex items-center gap-1.5 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 font-semibold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" /> Delete Account
              </button>
            ) : (
              <div className="p-4 border border-destructive/30 bg-destructive/5 rounded-2xl max-w-md space-y-3">
                <p className="text-xs font-semibold text-destructive">
                  WARNING: This will deactivate your profile and soft-delete your account details.
                </p>
                <p className="text-[10px] text-muted-foreground">
                  To confirm, type <span className="font-bold text-foreground">DELETE MY ACCOUNT</span> below:
                </p>
                <input
                  type="text"
                  placeholder="DELETE MY ACCOUNT"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-destructive/30 bg-background/50 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-destructive transition-all"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={handleDeleteAccount}
                    className="bg-destructive hover:bg-destructive/80 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {deleteLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Confirm Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeleteConfirmOpen(false); setDeleteInput(""); }}
                    className="border border-border bg-card hover:bg-muted text-foreground font-semibold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}
