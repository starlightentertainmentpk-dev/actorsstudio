import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      if (!user) return null
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()
        
      if (error) {
        // If row is not found in public.users, return standard auth user info
        return {
          id: user.id,
          email: user.email ?? "",
          role: "talent" as const,
          status: "active",
          phone: user.phone ?? null,
          locale: "en",
          created_at: user.created_at,
        }
      }
      
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
