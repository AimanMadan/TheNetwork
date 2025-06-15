"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { authService, type SignUpData } from "@/lib/auth"
import type { Profile } from "@/lib/types"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)

      if (session?.user) {
        const profile = await authService.getCurrentUser()
        setUser(profile)
      }
      setLoading(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session?.user) {
        const profile = await authService.getCurrentUser()
        setUser(profile)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    await authService.signIn({ email, password })
  }

  const signUp = async (data: SignUpData) => {
    await authService.signUp(data)
  }

  const signOut = async () => {
    await authService.signOut()
    setUser(null)
  }

  const refreshUser = async () => {
    const profile = await authService.getCurrentUser()
    setUser(profile)
  }

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
        signInWithGoogle,
      }}
    >
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
