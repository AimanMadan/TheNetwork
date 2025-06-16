"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { Profile } from "@/lib/types"
import { supabase } from "@/lib/supabase"
import { authService } from "@/lib/auth"

// The user object available in our hook will be the auth user merged with their profile data.
type EnrichedUser = SupabaseUser & Profile

interface AuthContextType {
  user: EnrichedUser | null
  loading: boolean
  supabase: typeof supabase
  refreshUser: () => Promise<void>
  signInWithLinkedIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<EnrichedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchUserProfile = useCallback(async (authUser: SupabaseUser | null) => {
    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const profile = await authService.getCurrentUser()
      if (profile) {
        setUser({ ...authUser, ...profile })
      } else {
        setUser(authUser as EnrichedUser)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setUser(authUser as EnrichedUser)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserProfile(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  const refreshUser = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    await fetchUserProfile(authUser)
  }, [fetchUserProfile])

  const signInWithLinkedIn = async () => {
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

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Error signing in with LinkedIn:", error)
      toast.error("Failed to sign in with LinkedIn")
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out")
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, supabase, refreshUser, signInWithLinkedIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 