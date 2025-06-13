"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/components/auth-layout"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { databaseService } from "@/lib/database"

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    job_title: "",
    linkedin_account: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { user, refreshUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Pre-fill form with existing user data if available
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        job_title: user.job_title || "",
        linkedin_account: user.linkedin_account || "",
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      // Update the user's profile with the provided information
      await databaseService.updateProfile(user.id, {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        job_title: formData.job_title.trim(),
        linkedin_account: formData.linkedin_account.trim(),
      })

      // Refresh user data
      await refreshUser()
      
      toast.success("Profile completed successfully!")
      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.first_name.trim() && 
                     formData.last_name.trim() && 
                     formData.job_title.trim() && 
                     formData.linkedin_account.trim()

  return (
    <AuthGuard skipProfileCheck={true}>
      <AuthLayout title="Complete Your Profile">
        <div className="mb-6 text-center">
          <p className="text-gray-400 text-sm">
            Please complete your profile information to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-gray-300">
                First Name *
              </Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-gray-300">
                Last Name *
              </Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_title" className="text-gray-300">
              Job Title *
            </Label>
            <Input
              id="job_title"
              name="job_title"
              value={formData.job_title}
              onChange={handleInputChange}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_account" className="text-gray-300">
              LinkedIn Profile URL *
            </Label>
            <Input
              id="linkedin_account"
              name="linkedin_account"
              type="url"
              value={formData.linkedin_account}
              onChange={handleInputChange}
              placeholder="https://linkedin.com/in/yourprofile"
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? "Completing Profile..." : "Complete Profile"}
          </Button>
        </form>
      </AuthLayout>
    </AuthGuard>
  )
} 