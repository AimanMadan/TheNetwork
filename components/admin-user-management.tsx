"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useVirtualizer } from "@tanstack/react-virtual"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Linkedin, Mail } from "lucide-react"
import type { Profile } from "@/lib/types"
import { databaseService } from "@/lib/database"
import { toast } from "sonner"

interface AdminUserManagementProps {
  onUpdateUserRole: (userId: string, newRole: "user" | "admin") => Promise<void>
}

export function AdminUserManagement({
  onUpdateUserRole,
}: AdminUserManagementProps) {
  const router = useRouter()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set())

  const tableContainerRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 65, // Adjust this to your row's estimated height
    overscan: 5,
  })

  useEffect(() => {
    const fetchAllUsers = async () => {
      setLoading(true)
      try {
        const allUsers = await databaseService.getAllProfiles()
        setUsers(allUsers)
      } catch (error) {
        toast.error("Failed to fetch users.")
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchAllUsers()
  }, [])

  const handleRoleChange = async (
    userId: string,
    newRole: "user" | "admin"
  ) => {
    setUpdatingUsers(prev => new Set(prev).add(userId))
    try {
      await onUpdateUserRole(userId, newRole)
      setUsers(prevUsers =>
        prevUsers.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      )
      toast.success("User role updated.")
    } catch (error) {
      console.error("Failed to update user role:", error)
      toast.error("Failed to update user role.")
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Manage Users ({users.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-400 py-4">Loading users...</div>
        ) : (
          <div ref={tableContainerRef} className="h-[600px] overflow-auto relative">
            <Table className="w-full table-fixed">
              <TableHeader className="sticky top-0 z-10 bg-gray-800">
                <TableRow className="border-gray-700 flex">
                  <TableHead className="w-[30%] px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</TableHead>
                  <TableHead className="w-[30%] px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Job Title</TableHead>
                  <TableHead className="w-[20%] px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</TableHead>
                  <TableHead className="w-[20%] px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map(virtualItem => {
                  const user = users[virtualItem.index]
                  if (!user) return null
                  return (
                    <TableRow
                      key={user.id}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className="border-b border-gray-700 flex items-center"
                    >
                      <TableCell
                        className="w-[30%] px-4 py-2 text-gray-200 cursor-pointer hover:underline"
                        onClick={() => router.push(`/profile/${user.id}`)}
                      >
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell className="w-[30%] px-4 py-2 text-gray-200">
                        {user.job_title || "N/A"}
                      </TableCell>
                      <TableCell className="w-[20%] px-4 py-2">
                        <Select
                          value={user.role}
                          onValueChange={(newRole: "user" | "admin") =>
                            handleRoleChange(user.id, newRole)
                          }
                          disabled={updatingUsers.has(user.id)}
                        >
                          <SelectTrigger className="w-[120px] bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 text-white border-gray-600">
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="w-[20%] px-4 py-2">
                        <div className="flex items-center space-x-4">
                          {user.linkedin_account && (
                            <a
                              href={user.linkedin_account}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              aria-label="LinkedIn Profile"
                            >
                              <Linkedin className="w-5 h-5" />
                            </a>
                          )}
                          {user.email && (
                            <a
                              href={`mailto:${user.email}`}
                              className="text-gray-400 hover:text-gray-300 transition-colors"
                              aria-label="Send an email"
                            >
                              <Mail className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 