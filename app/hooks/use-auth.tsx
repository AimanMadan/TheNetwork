"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuthChangeEvent, Session, User as SupabaseUser } from "@supabase/supabase-js"
import { Profile } from "@/lib/types"
import { supabase } from "@/lib/supabase"

// The user object available in our hook will be the auth user merged with their profile data.
type User = SupabaseUser & Partial<Profile>

interface AuthContextType {
  user: User | null
  loading: boolean
  supabase: typeof supabase
  refreshUser: () => Promise<void>
  signInWithLinkedIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const getAndSetUser = useCallback(async (authUser: SupabaseUser | null) => {
    try {
      if (!authUser) {
        setUser(null)
        return
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching profile for auth hook:", error)
      }
      
      const mergedUser: User = { ...authUser, ...(profile || {}) }
      setUser(mergedUser)

    } catch (error) {
      console.error("Critical error in getAndSetUser:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])
  
  // This function can be called from other components to force a refresh
  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    await getAndSetUser(authUser)
  }, [getAndSetUser])

  useEffect(() => {
    const initialFetch = async () => {
      await refreshUser()
    }
    initialFetch()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        getAndSetUser(session?.user ?? null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [getAndSetUser, refreshUser])

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