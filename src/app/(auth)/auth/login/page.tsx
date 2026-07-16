"use client"

import { Suspense, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data?.user) {
        // Fetch role from public.users
        const { data: userData, error: roleError } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single()

        if (roleError) {
          console.error("Error fetching user role:", roleError)
        }

        const role = userData?.role ?? "talent"

        const dashboardMap: Record<string, string> = {
          super_admin: "/admin",
          studio_admin: "/admin",
          studio_staff: "/admin/talent",
          talent: "/talent/dashboard",
          agent_manager: "/agent/dashboard",
          producer_brand: "/producer/dashboard",
          casting_director: "/casting/dashboard",
        }

        const nextParam = searchParams.get("next")
        const destination = nextParam
          ? decodeURIComponent(nextParam)
          : (dashboardMap[role] ?? "/talent/dashboard")

        router.push(destination)
        router.refresh()
      }
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
        <h2 className="text-xl font-heading font-semibold text-foreground">
          Welcome back
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMsg && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/25 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
            {errorMsg}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-xs font-medium text-muted-foreground"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={isLoading || isGoogleLoading}
            {...register("email")}
            className="w-full h-9 rounded-lg bg-surface-900 border border-border/60 px-3 py-1 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
          />
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
              className="text-xs font-medium text-muted-foreground"
            >
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-[11px] font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            disabled={isLoading || isGoogleLoading}
            {...register("password")}
            className="w-full h-9 rounded-lg bg-surface-900 border border-border/60 px-3 py-1 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
          />
          {errors.password && (
            <p className="text-[11px] text-destructive leading-none mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full h-9 flex items-center justify-center font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors rounded-lg shadow-md cursor-pointer"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="relative flex items-center justify-center my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/40" />
        </div>
        <span className="relative bg-card/60 px-3 text-[10px] uppercase text-muted-foreground">
          Or continue with
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={isLoading || isGoogleLoading}
        onClick={handleGoogleLogin}
        className="w-full h-9 flex items-center justify-center gap-2.5 font-medium border-border/60 hover:bg-surface-900 transition-colors rounded-lg text-foreground cursor-pointer"
      >
        {isGoogleLoading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        ) : (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Continue with Google
      </Button>

      <p className="text-xs text-center text-muted-foreground mt-4">
        Don't have an account?{" "}
        <Link
          href="/auth/register"
          className="font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          Create one now
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
