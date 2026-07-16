import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CastingCallForm } from "../../_components/CastingCallForm"
import { updateCastingCall } from "../../actions"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type PageProps = {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: "Edit Casting Call | Producer Portal",
}

export default async function EditCastingCallPage({ params }: PageProps) {
  const resolvedParams = await params
  const { id } = resolvedParams

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

  // 3. Fetch casting call details
  const { data: castingCall } = await supabase
    .from("casting_calls")
    .select("*")
    .eq("id", id)
    .single()

  if (!castingCall) {
    redirect("/producer/casting")
  }

  // Verify ownership
  if (castingCall.producer_id !== producer.id) {
    redirect("/producer/casting")
  }

  // 4. Fetch root categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .is("parent_id", null)
    .order("sort_order", { ascending: true })

  const isVerified = producer.verified

  // Bind server action with ID
  const updateCastingCallWithId = updateCastingCall.bind(null, id)

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
          Edit Casting Call
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Modify the requirements or details of your posted casting call.
        </p>
      </div>

      {/* Casting call form */}
      <CastingCallForm
        initialData={castingCall}
        categories={categories || []}
        isVerified={isVerified}
        onSubmitAction={updateCastingCallWithId}
      />
    </div>
  )
}
