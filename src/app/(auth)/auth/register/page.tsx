"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { User, Briefcase, Camera, ArrowLeft, Mail, Lock, AlertCircle, Check } from "lucide-react"

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must match"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>
type RoleType = "talent" | "producer_brand" | "casting_director"

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<RoleType>("talent")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const handleRoleSelect = (role: RoleType) => {
    setSelectedRole(role)
    setStep(2)
  }

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true)
    setErrorMsg(null)
    const supabase = createClient()

    try {
      // 1. Sign up the user in auth.users
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data?.user) {
        // 2. Update the role in public.users (which was created by trigger with default 'talent')
        const { error: roleError } = await supabase
          .from("users")
          .update({ role: selectedRole })
          .eq("id", data.user.id)

        if (roleError) {
          throw new Error("Account created but failed to set role: " + roleError.message)
        }

        // 3. For Talent, we also want to create a blank profile or insert their full name
        // because the next step is onboarding.
        if (selectedRole === "talent") {
          const { error: profileError } = await supabase
            .from("talent_profiles")
            .insert({
              user_id: data.user.id,
              full_name: values.fullName,
              verification_status: "pending",
            })
          if (profileError) {
            console.error("Profile creation error:", profileError)
          }
          router.push("/talent/onboarding")
        } else if (selectedRole === "producer_brand") {
          const { error: profileError } = await supabase
            .from("producer_profiles")
            .insert({
              user_id: data.user.id,
              company_name: values.fullName, // Default to their name for now
            })
          if (profileError) {
            console.error("Profile creation error:", profileError)
          }
          router.push("/producer/onboarding")
        } else {
          // Casting Director
          router.push("/casting/dashboard")
        }

        router.refresh()
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Please try again.")
      setIsLoading(false)
    }
  }

  const roleOptions: {
    role: RoleType
    title: string
    description: string
    icon: typeof User
    badge: string
    badgeVariant: "default" | "purple" | "cyan"
  }[] = [
    {
      role: "talent",
      title: "Talent & Performer",
      description: "Actors, models, voice artists, dancers, and creative performers.",
      icon: User,
      badge: "Artists",
      badgeVariant: "default",
    },
    {
      role: "producer_brand",
      title: "Producer / Brand",
      description: "Production houses, ad agencies, casting agencies, and commercial brands.",
      icon: Briefcase,
      badge: "Enterprise",
      badgeVariant: "purple",
    },
    {
      role: "casting_director",
      title: "Casting Director",
      description: "Direct audition rounds, screen applicants, and manage production shortlists.",
      icon: Camera,
      badge: "Casting",
      badgeVariant: "cyan",
    },
  ]

  return (
    <div>
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground tracking-tight">
              Join Actor&apos;s Studio
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Select how you will participate in the talent network.
            </p>
          </div>

          <div className="grid gap-3">
            {roleOptions.map((opt) => {
              const Icon = opt.icon
              const isSelected = selectedRole === opt.role

              return (
                <div
                  key={opt.role}
                  onClick={() => handleRoleSelect(opt.role)}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 group relative ${
                    isSelected
                      ? "border-brand-500 bg-brand-500/10 shadow-xs ring-1 ring-brand-500/30"
                      : "border-border/60 hover:border-brand-500/30 hover:bg-muted/40"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg border transition-colors shrink-0 ${
                      isSelected
                        ? "bg-brand-600 text-white border-brand-500"
                        : "bg-muted/70 text-muted-foreground border-border/60 group-hover:text-foreground group-hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">
                        {opt.title}
                      </h3>
                      <Badge variant={opt.badgeVariant} size="sm">
                        {opt.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="absolute right-3.5 top-3.5 h-4.5 w-4.5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-brand-600 dark:text-brand-400 hover:underline transition-colors"
            >
              Sign in instead
            </Link>
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer border border-border/60"
              aria-label="Back to role selection"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground tracking-tight">
                Create account
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Registering as{" "}
                <strong className="text-brand-600 dark:text-brand-400 capitalize">
                  {selectedRole.replace("_", " ")}
                </strong>
              </p>
            </div>
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
                htmlFor="fullName"
                className="text-xs font-semibold text-foreground/90"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Maya Ali"
                  disabled={isLoading}
                  {...register("fullName")}
                  className="w-full h-9 rounded-lg bg-background border border-border/70 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50"
                />
              </div>
              {errors.fullName && (
                <p className="text-[11px] text-destructive leading-none mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-foreground/90"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="maya@example.com"
                  disabled={isLoading}
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
              <label
                htmlFor="password"
                className="text-xs font-semibold text-foreground/90"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
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

            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-semibold text-foreground/90"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...register("confirmPassword")}
                  className="w-full h-9 rounded-lg bg-background border border-border/70 pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-destructive leading-none mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full h-10 font-semibold bg-brand-600 text-white hover:bg-brand-500 transition-all rounded-xl shadow-sm shadow-brand-500/25 cursor-pointer mt-2"
            >
              Complete Registration
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
