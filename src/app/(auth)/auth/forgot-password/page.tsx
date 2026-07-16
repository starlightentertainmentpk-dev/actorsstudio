"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsLoading(true)
    setErrorMsg(null)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw new Error(error.message)
      }

      setIsSuccess(true)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send reset link. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Check your email
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            We have sent a password reset link to your email address. Please follow the instructions to reset your password.
          </p>
        </div>
        <Link href="/auth/login" className="block w-full">
          <Button
            className="w-full h-9 flex items-center justify-center font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors rounded-lg cursor-pointer"
          >
            Back to Login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground">
          Reset password
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your email to receive a password reset link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/25 p-3 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-xs font-medium text-muted-foreground"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={isLoading}
            {...register("email")}
            className="w-full h-9 rounded-lg bg-surface-900 border border-border/60 px-3 py-1 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
          />
          {errors.email && (
            <p className="text-[11px] text-destructive leading-none mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-9 flex items-center justify-center font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors rounded-lg shadow-md cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Sending link...
            </span>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground mt-4">
        Remembered your password?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
