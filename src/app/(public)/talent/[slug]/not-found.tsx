import Link from "next/link"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TalentNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="max-w-md w-full space-y-6 bg-card border border-border/80 p-8 rounded-3xl shadow-xl backdrop-blur-md">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-heading text-foreground">
            Profile Not Found
          </h2>
          <p className="text-sm text-muted-foreground">
            This talent profile doesn't exist, is no longer active, or is currently awaiting administrator review.
          </p>
        </div>
        <div className="pt-2">
          <Link href="/talent">
            <Button className="w-full flex items-center justify-center gap-2 py-5 font-semibold text-sm cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Back to Talent Directory
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
