"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/components/auth-layout"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import type { Database } from "@/lib/database.types"
import type { User } from "@supabase/supabase-js"

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    job_title: "",
    company: "",
    linkedin_account: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (user) {
      // Pre-fill form with user data
      setFormData(prev => ({
        ...prev,
        first_name: user.user_metadata.first_name || "",
        last_name: user.user_metadata.last_name || "",
        email: user.email || "",
      }))
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!user) {
        throw new Error("No user found")
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          job_title: formData.job_title,
          company: formData.company,
          linkedin_account: formData.linkedin_account,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      toast.success("Profile updated successfully!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error(error.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard>
      <AuthLayout title="Complete Your Profile">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first_name" className="text-gray-300">
              First Name
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
              Last Name
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

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_title" className="text-gray-300">
              Job Title
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
            <Label htmlFor="company" className="text-gray-300">
              Company
            </Label>
            <Input
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin_account" className="text-gray-300">
              LinkedIn Profile URL
            </Label>
            <Input
              id="linkedin_account"
              name="linkedin_account"
              value={formData.linkedin_account}
              onChange={handleInputChange}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
            {isLoading ? "Saving..." : "Complete Profile"}
          </Button>
        </form>
      </AuthLayout>
    </AuthGuard>
  )
} 