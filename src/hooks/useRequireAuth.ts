import { useUser } from "./useUser"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function useRequireAuth(requiredRole?: string | string[]) {
  const { data: user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.replace("/auth/login")
      return
    }

    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      if (!roles.includes(user.role)) {
        router.replace("/unauthorized")
      }
    }
  }, [user, isLoading, requiredRole, router])

  return { user, isLoading }
}
