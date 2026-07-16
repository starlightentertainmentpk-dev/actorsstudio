import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CastingCallForm } from "../_components/CastingCallForm"
import { createCastingCall } from "../actions"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "New Casting Call | Producer Portal",
}

export default async function CreateCastingCallPage() {
  const supabase = await createClient()

  // 1. Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // 2. Fetch producer profile
  const { data: producer } = await supabase
    .from("producer_profiles")
    .select("id, verified")
    .eq("user_id", user.id)
    .single()

  if (!producer) {
    redirect("/producer/onboarding")
  }

  // 3. Fetch root categories (parent_id is null) for the form selection
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .is("parent_id", null)
    .order("sort_order", { ascending: true })

  const isVerified = producer.verified

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back to list */}
      <div>
        <Link
          href="/producer/casting"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Casting Calls
        </Link>
      </div>

      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          Create Casting Call
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Post a new role or audition to recruit talent on Actors Studio.
        </p>
      </div>

      {/* Casting call form */}
      <CastingCallForm
        categories={categories || []}
        isVerified={isVerified}
        onSubmitAction={createCastingCall}
      />
    </div>
  )
}
