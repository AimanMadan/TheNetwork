"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { authService, type SignUpData } from "@/lib/auth"
import type { Profile } from "@/lib/types"

interface AuthContextType {
  user: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    authService
      .getCurrentUser()
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false))

    // Listen for auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (authUser) => {
      if (authUser) {
        try {
          const profile = await authService.getCurrentUser()
          setUser(profile)
        } catch (error) {
          console.error("Error fetching user profile:", error)
          setUser(null)
        }
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
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
