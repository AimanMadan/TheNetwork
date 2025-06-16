"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/app/hooks/use-auth"
import { isProfileComplete } from "@/lib/utils"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireProfileComplete?: boolean
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireProfileComplete = false,
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) {
      return // Wait until the user's auth state is confirmed
    }

    // 1. If auth is required and user is not logged in, redirect to home
    if (requireAuth && !user) {
      router.push("/")
      return
    }

    // 2. If a page doesn't require auth but the user is logged in, redirect to dashboard
    if (!requireAuth && user) {
      router.push("/dashboard")
      return
    }

    // 3. If a complete profile is required but the user's is not, redirect to onboarding
    if (user && requireProfileComplete && !isProfileComplete(user)) {
      if (pathname !== "/onboarding") {
        router.push("/onboarding")
      }
      return
    }
  }, [user, loading, requireAuth, requireProfileComplete, router, pathname])

  // Show a loading screen while auth state is being determined
  if (loading || (requireAuth && !user)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }
  
  // While redirecting to onboarding, don't render the children
  if (requireProfileComplete && user && !isProfileComplete(user)) {
    return null
  }

  return <>{children}</>
}
