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
      console.log('AuthGuard check:', { 
        requireAuth, 
        user: !!user, 
        userEmail: user?.email,
        skipProfileCheck, 
        pathname 
      })
      
      if (requireAuth && !user) {
        console.log('User not authenticated, redirecting to:', redirectTo)
        router.push(redirectTo)
      } else if (!requireAuth && user) {
        console.log('User authenticated but auth not required, redirecting to dashboard')
        router.push("/dashboard")
      } else if (requireAuth && user && !skipProfileCheck && pathname !== "/onboarding") {
        // Check if profile is complete, redirect to onboarding if not
        const isComplete = authService.isProfileComplete(user)
        console.log('Profile completion check in AuthGuard:', {
          isComplete,
          currentPath: pathname,
          willRedirect: !isComplete
        })
        
        if (!isComplete) {
          console.log('Redirecting to onboarding due to incomplete profile')
          router.push("/onboarding")
          return // Exit early to prevent rendering
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

  // If user is authenticated but profile is incomplete and we're not skipping the check
  if (requireAuth && user && !skipProfileCheck && pathname !== "/onboarding" && !authService.isProfileComplete(user)) {
    console.log('AuthGuard: Blocking render due to incomplete profile')
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return <>{children}</>
}
