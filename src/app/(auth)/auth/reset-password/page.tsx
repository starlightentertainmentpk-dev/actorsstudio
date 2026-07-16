"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must match"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (values: ResetPasswordValues) => {
    setIsLoading(true)
    setErrorMsg(null)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (error) {
        throw new Error(error.message)
      }

      setIsSuccess(true)
      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password. Please try again.")
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground">
            Password updated!
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            Your password has been successfully reset. You will be redirected to the login page in a few seconds...
          </p>
        </div>
        <div className="flex items-center justify-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-semibold text-foreground">
          Set new password
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your new password below
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
            htmlFor="password"
            className="text-xs font-medium text-muted-foreground"
          >
            New Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            disabled={isLoading}
            {...register("password")}
            className="w-full h-9 rounded-lg bg-surface-900 border border-border/60 px-3 py-1 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
          />
          {errors.password && (
            <p className="text-[11px] text-destructive leading-none mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className="text-xs font-medium text-muted-foreground"
          >
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            disabled={isLoading}
            {...register("confirmPassword")}
            className="w-full h-9 rounded-lg bg-surface-900 border border-border/60 px-3 py-1 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
          />
          {errors.confirmPassword && (
            <p className="text-[11px] text-destructive leading-none mt-1">
              {errors.confirmPassword.message}
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
              Updating password...
            </span>
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>
    </div>
  )
}
