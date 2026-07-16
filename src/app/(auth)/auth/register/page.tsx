"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { User, Briefcase, Camera, ArrowLeft } from "lucide-react"

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
        // because the next step is onboarding. Let's see:
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

  return (
    <div>
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-heading font-semibold text-foreground">
              Choose your account type
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Select how you want to use Actor's Studio
            </p>
          </div>

          <div className="grid gap-4">
            {/* Talent Card */}
            <div
              onClick={() => handleRoleSelect("talent")}
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:border-brand-500 hover:bg-surface-900 group ${
                selectedRole === "talent"
                  ? "border-brand-500 bg-brand-950/20"
                  : "border-border/60 bg-transparent"
              }`}
            >
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all">
                <User className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-foreground">
                  Talent (Actor, Model, Artist)
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Showcase your portfolio, apply to casting calls, and connect with top brands.
                </p>
              </div>
            </div>

            {/* Producer / Brand Card */}
            <div
              onClick={() => handleRoleSelect("producer_brand")}
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:border-brand-500 hover:bg-surface-900 group ${
                selectedRole === "producer_brand"
                  ? "border-brand-500 bg-brand-950/20"
                  : "border-border/60 bg-transparent"
              }`}
            >
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-foreground">
                  Producer / Brand
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Post projects, discover verified talent, and manage your productions.
                </p>
              </div>
            </div>

            {/* Casting Director Card */}
            <div
              onClick={() => handleRoleSelect("casting_director")}
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:border-brand-500 hover:bg-surface-900 group ${
                selectedRole === "casting_director"
                  ? "border-brand-500 bg-brand-950/20"
                  : "border-border/60 bg-transparent"
              }`}
            >
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 group-hover:bg-brand-500 group-hover:text-white transition-all">
                <Camera className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-foreground">
                  Casting Director
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Organize auditions, screen applicants, and manage talent selections.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              Sign in instead
            </Link>
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-3 duration-250">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-xl font-heading font-semibold text-foreground">
                Create your account
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Registering as a{" "}
                <span className="text-brand-400 font-medium capitalize">
                  {selectedRole.replace("_", " ")}
                </span>
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMsg && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/25 p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="fullName"
                className="text-xs font-medium text-muted-foreground"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                disabled={isLoading}
                {...register("fullName")}
                className="w-full h-9 rounded-lg bg-surface-900 border border-border/60 px-3 py-1 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors disabled:opacity-50"
              />
              {errors.fullName && (
                <p className="text-[11px] text-destructive leading-none mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

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
                placeholder="john@example.com"
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

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-muted-foreground"
              >
                Password
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
                Confirm Password
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
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
