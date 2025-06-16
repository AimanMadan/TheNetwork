"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AuthLayout } from "@/components/auth-layout"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/app/hooks/use-auth"

// Enable dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function HomePage() {
  const router = useRouter()
  const { signInWithLinkedIn } = useAuth()

  const handleSignIn = async () => {
    try {
      await signInWithLinkedIn()
    } catch (error) {
      console.error("Error signing in:", error)
    }
  }

  return (
    <AuthGuard requireAuth={false}>
      <AuthLayout title="Welcome">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-white">Sign in with LinkedIn</h2>
            <p className="text-gray-400 text-sm">
              Connect your LinkedIn account to access the platform
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSignIn}
            className="w-full bg-[#0077B5] hover:bg-[#005582] text-white"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
            </svg>
            Sign in with LinkedIn
          </Button>

          <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-200 font-medium mb-2">Important Notice:</p>
            <p className="text-sm text-blue-100">
              You will be redirected to LinkedIn to sign in. After signing in, you may need to complete your profile information if any details are missing.
            </p>
          </div>
        </div>
      </AuthLayout>
    </AuthGuard>
  )
}
