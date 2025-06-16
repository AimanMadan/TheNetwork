"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuthChangeEvent, Session, User as SupabaseUser } from "@supabase/supabase-js"

// This is the user profile from our "profiles" table
interface UserProfile {
  id: string
  full_name: string
  avatar_url: string
  company: string
}

// The user object available in our hook will be a combination of auth user and profile
type User = SupabaseUser & UserProfile

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithLinkedIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const getFullUserProfile = async (authUser: SupabaseUser): Promise<User | null> => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()
      
      return profile ? { ...authUser, ...profile } : null
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          const fullUserProfile = await getFullUserProfile(session.user)
          setUser(fullUserProfile)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    // Check for initial session
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const fullUserProfile = await getFullUserProfile(session.user)
        setUser(fullUserProfile)
      }
      setLoading(false)
    }

    checkInitialSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

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
    <AuthContext.Provider value={{ user, loading, signInWithLinkedIn, signOut }}>
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