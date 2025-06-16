import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { useCallback, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signInWithLinkedIn = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            scope: "openid profile email",
          },
        },
      })
      if (error) throw error
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error signing in with LinkedIn:", error)
      throw error
    }
  }, [supabase.auth])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }, [supabase.auth, router])

  return {
    user,
    loading,
    signInWithLinkedIn,
    signOut,
  }
} 