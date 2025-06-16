"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createBrowserClient } from "@supabase/ssr"
import { Database } from "@/lib/database.types"

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    job_title: "",
    linkedin_account: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || user.user_metadata?.full_name?.split(' ')[0] || "",
        last_name: user.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "",
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
    if (!user) {
      toast.error("You must be logged in to update your profile.")
      return
    }
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          job_title: formData.job_title,
          linkedin_account: formData.linkedin_account,
          avatar_url: user.user_metadata.avatar_url,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      toast.success("Profile updated successfully!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast.error(error.message || "Failed to update profile.")
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Complete Your Profile</h1>
          <p className="text-gray-400 mt-2">
            Just a few more details to get you started.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-gray-300">First Name</Label>
              <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-gray-300">Last Name</Label>
              <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="job_title" className="text-gray-300">Job Title</Label>
            <Input id="job_title" name="job_title" value={formData.job_title} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin_account" className="text-gray-300">LinkedIn Profile URL</Label>
            <Input id="linkedin_account" name="linkedin_account" value={formData.linkedin_account} onChange={handleInputChange} />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save and Continue"}
          </Button>
        </form>
      </div>
    </div>
  )
} 