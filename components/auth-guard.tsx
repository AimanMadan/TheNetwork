"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { authService } from "@/lib/auth"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  skipProfileCheck?: boolean
}

export function AuthGuard({ children, requireAuth = true, redirectTo = "/login", skipProfileCheck = false }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push(redirectTo)
      } else if (!requireAuth && user) {
        router.push("/dashboard")
      } else if (requireAuth && user && !skipProfileCheck && pathname !== "/onboarding") {
        // Check if profile is complete, redirect to onboarding if not
        if (!authService.isProfileComplete(user)) {
          router.push("/onboarding")
        }
      }
    }
  }, [user, loading, requireAuth, redirectTo, router, skipProfileCheck, pathname])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return null
  }

  if (!requireAuth && user) {
    return null
  }

  return <>{children}</>
}
