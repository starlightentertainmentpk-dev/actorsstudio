import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Organization } from "@/types/organization"
import { switchActiveOrganizationAction } from "@/lib/actions/organizations"
import { useRouter } from "next/navigation"

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? decodeURIComponent(match[2]) : null
}

export function useOrganizations() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["user-organizations"],
    queryFn: async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return { organizations: [], activeOrg: null }

      try {
        const { data: members, error } = await supabase
          .from("organization_members")
          .select("organization_id, role, organizations(*)")
          .eq("user_id", user.id)

        if (error || !members) {
          return { organizations: [], activeOrg: null }
        }

        const orgs = members
          .map((m: any) => m.organizations)
          .filter(Boolean) as Organization[]

        const cookieOrgId = getCookie("active_org_id")
        const active = orgs.find((o) => o.id === cookieOrgId) || orgs[0] || null

        return {
          organizations: orgs,
          activeOrg: active,
        }
      } catch {
        return { organizations: [], activeOrg: null }
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })

  const switchMutation = useMutation({
    mutationFn: async (orgId: string) => {
      await switchActiveOrganizationAction(orgId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-organizations"] })
      router.refresh()
    },
  })

  return {
    organizations: data?.organizations || [],
    activeOrg: data?.activeOrg || null,
    isLoading,
    refetch,
    switchOrganization: switchMutation.mutate,
    isSwitching: switchMutation.isPending,
  }
}
