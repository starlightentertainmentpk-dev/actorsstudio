"use client"

import { Suspense, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle, Lock, Mail } from "lucide-react"

import { loginWithEmail } from "./actions"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const res = await loginWithEmail({
        email: values.email,
        password: values.password,
      })

      if (!res.success) {
        throw new Error(res.error || "Invalid email or password")
      }

      const nextParam = searchParams.get("next")
      const destination = nextParam
        ? decodeURIComponent(nextParam)
        : (res.destination || "/talent/dashboard")

      // Use full browser navigation to ensure cookies are immediately available and avoid RSC header issues
      window.location.href = destination
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid email or password")
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setErrorMsg(null)
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Google authentication failed")
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground tracking-tight">
          Welcome back
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Sign in with your email or social credentials to access your dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/25 p-3 rounded-xl flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-xs font-semibold text-foreground/90"
          >
            Email address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              disabled={isLoading || isGoogleLoading}
              {...register("email")}
              className="w-full h-9 rounded-lg bg-background border border-border/70 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50"
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-destructive leading-none mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-foreground/90"
            >
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              disabled={isLoading || isGoogleLoading}
              {...register("password")}
              className="w-full h-9 rounded-lg bg-background border border-border/70 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50"
            />
          </div>
          {errors.password && (
            <p className="text-[11px] text-destructive leading-none mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading || isGoogleLoading}
          className="w-full h-9 font-semibold bg-brand-600 text-white hover:bg-brand-500 transition-all rounded-lg shadow-xs cursor-pointer mt-2 text-xs"
        >
          Sign In
        </Button>
      </form>

      <div className="relative flex items-center justify-center my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <span className="relative bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Or continue with
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={isLoading || isGoogleLoading}
        onClick={handleGoogleLogin}
        className="w-full h-9 flex items-center justify-center gap-2.5 font-semibold border-border/70 hover:bg-muted/50 transition-colors rounded-lg text-xs text-foreground cursor-pointer"
      >
        {isGoogleLoading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        ) : (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        <span>Sign in with Google</span>
      </Button>

      <p className="text-xs text-center text-muted-foreground pt-1">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-brand-600 dark:text-brand-400 hover:underline transition-colors"
        >
          Create an account
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
