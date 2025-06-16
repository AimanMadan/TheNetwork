"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/app/hooks/use-auth"
import { supabase } from "@/lib/supabase"

interface User {
  id: number
  name: string
  role: string
  avatar: string
  fallback: string
}

interface Organization {
  id: number
  name: string
}

export default function UserDirectory() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([])
  const [selectedOrganizations, setSelectedOrganizations] = useState<number[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [jobTitles, setJobTitles] = useState<string[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])

  // Get session when needed
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session
  }

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await fetch("/api/organizations")
        const data = await response.json()
        if (response.ok) {
          setOrganizations(data)
        } else {
          toast.error(data.error || "Failed to fetch organizations.")
        }
      } catch (error) {
        toast.error("An unexpected error occurred while fetching organizations.")
      }
    }
    fetchOrgs()
  }, [])

  useEffect(() => {
    if (!user) return
    const fetchScopedFilters = async () => {
      try {
        const session = await getSession()
        if (!session) return
        
        const params = new URLSearchParams()
        selectedOrganizations.forEach((orgId) => params.append("organizationIds", orgId.toString()))
        const response = await fetch(`/api/users/filters?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
        const data = await response.json()
        if (response.ok) {
          setRoles(data.roles)
          setJobTitles(data.jobTitles)
          setSelectedRoles((prev) => prev.filter((r) => data.roles.includes(r)))
          setSelectedJobTitles((prev) => prev.filter((t) => data.jobTitles.includes(t)))
        } else {
          toast.error(data.error || "Failed to fetch filters.")
        }
      } catch (error) {
        toast.error("An unexpected error occurred while fetching filters.")
      }
    }

    fetchScopedFilters()
  }, [selectedOrganizations, user])

  useEffect(() => {
    if (!user) return
    const fetchUsers = async () => {
      try {
        const session = await getSession()
        if (!session) return
        
        const params = new URLSearchParams()
        params.append("query", searchQuery)
        selectedRoles.forEach((role) => params.append("roles", role))
        selectedJobTitles.forEach((title) => params.append("jobTitles", title))
        selectedOrganizations.forEach((orgId) => params.append("organizationIds", orgId.toString()))
        const response = await fetch(`/api/users?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
        const data = await response.json()
        if (response.ok) {
          if (Array.isArray(data)) {
            setUsers(data)
          } else {
            setUsers([])
            toast.error("Received unexpected data from server.")
          }
        } else {
          setUsers([])
          toast.error(data.error || "Failed to fetch users.")
        }
      } catch (error) {
        setUsers([])
        toast.error("An unexpected error occurred.")
      }
    }
    fetchUsers()
  }, [searchQuery, selectedRoles, selectedJobTitles, selectedOrganizations, user])

  const handleRoleChange = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    )
  }

  const handleJobTitleChange = (title: string) => {
    setSelectedJobTitles((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    )
  }

  const handleOrganizationChange = (orgId: number) => {
    setSelectedOrganizations((prev) =>
      prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-900 text-white py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={user?.avatar_url || "/placeholder-user.jpg"} />
              <AvatarFallback>
                {`${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{`${user?.first_name} ${user?.last_name}`}</h1>
              <p className="text-gray-400">{user?.job_title}</p>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 bg-gray-100 dark:bg-gray-800 p-6">
        <div className="container mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 md:col-span-3">
                <Input
                  placeholder="Search by name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Roles</h3>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={role}
                        checked={selectedRoles.includes(role)}
                        onCheckedChange={() => handleRoleChange(role)}
                      />
                      <Label htmlFor={role}>{role}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Job Titles</h3>
                <div className="space-y-2">
                  {jobTitles.map((title) => (
                    <div key={title} className="flex items-center space-x-2">
                      <Checkbox
                        id={title}
                        checked={selectedJobTitles.includes(title)}
                        onCheckedChange={() => handleJobTitleChange(title)}
                      />
                      <Label htmlFor={title}>{title}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Organizations</h3>
                <div className="space-y-2">
                  {organizations.map((org) => (
                    <div key={org.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`org-${org.id}`}
                        checked={selectedOrganizations.includes(org.id)}
                        onCheckedChange={() => handleOrganizationChange(org.id)}
                      />
                      <Label htmlFor={`org-${org.id}`}>{org.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {users.map((user) => (
              <Link key={user.id} href={`/profile/${user.id}?from=/users`}>
                <Card className="p-4 flex flex-col items-center h-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <Avatar className="w-20 h-20 mb-4">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.fallback}</AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-bold text-center">{user.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-center">{user.role}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 