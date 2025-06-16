"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuthChangeEvent, Session, User as SupabaseUser } from "@supabase/supabase-js"

// The user profile from our "profiles" table. These fields are optional on the final user object.
interface UserProfile {
  full_name: string
  avatar_url: string
  company: string
}

// The user object available in our hook will be the auth user merged with their profile data.
type User = SupabaseUser & Partial<UserProfile>

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
    const getAndSetUser = async (authUser: SupabaseUser | null) => {
      if (!authUser) {
        setUser(null)
        setLoading(false)
        return
      }

      // Fetch the user's profile from the database
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, company")
        .eq("id", authUser.id)
        .single()
      
      // Merge the auth user with their profile data
      const mergedUser: User = {
        ...authUser,
        ...profile,
      }
      
      setUser(mergedUser)
      setLoading(false)
    }

    // Run once on mount
    const initialFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      await getAndSetUser(session?.user ?? null)
    }
    initialFetch()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await getAndSetUser(session?.user ?? null)
      }
    )

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