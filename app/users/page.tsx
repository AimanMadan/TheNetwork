"use client"
import { useState, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"

interface User {
  id: number
  name: string
  role: string
  avatar: string
  fallback: string
}

export default function UserDirectory() {
  const { user, session } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedJobTitles, setSelectedJobTitles] = useState<string[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [jobTitles, setJobTitles] = useState<string[]>([])

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch("/api/users/filters")
        const data = await response.json()
        if (response.ok) {
          setRoles(data.roles)
          setJobTitles(data.jobTitles)
        } else {
          toast.error(data.error || "Failed to fetch filters.")
        }
      } catch (error) {
        toast.error("An unexpected error occurred while fetching filters.")
      }
    }
    fetchFilters()
  }, [])

  useEffect(() => {
    if (!session) return
    const fetchUsers = async () => {
      try {
        const params = new URLSearchParams()
        params.append("query", searchQuery)
        selectedRoles.forEach((role) => params.append("roles", role))
        selectedJobTitles.forEach((title) => params.append("jobTitles", title))
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
  }, [searchQuery, selectedRoles, selectedJobTitles, session])

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

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-gray-900 text-white py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search by name or email"
                className="col-span-1 md:col-span-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="col-span-1 md:col-span-2">
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
              <div className="col-span-1 md:col-span-2">
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
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {users.map((user) => (
              <Card key={user.id} className="p-4 flex flex-col items-center">
                <Avatar className="w-20 h-20 mb-4">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.fallback}</AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-bold">{user.name}</h3>
                <p className="text-gray-500 dark:text-gray-400">{user.role}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 