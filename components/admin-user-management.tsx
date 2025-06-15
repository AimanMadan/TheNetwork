"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Linkedin, Mail } from "lucide-react"
import type { Profile } from "@/lib/types"

interface AdminUserManagementProps {
  users: Profile[]
  onUpdateUserRole: (userId: string, newRole: "user" | "admin") => Promise<void>
}

export function AdminUserManagement({ users, onUpdateUserRole }: AdminUserManagementProps) {
  const router = useRouter()
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set())

  const handleRoleChange = async (userId: string, newRole: "user" | "admin") => {
    setUpdatingUsers((prev) => new Set(prev).add(userId))
    try {
      await onUpdateUserRole(userId, newRole)
    } catch (error) {
      console.error("Failed to update user role:", error)
    } finally {
      setUpdatingUsers((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Manage Users</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-300">Name</TableHead>
              <TableHead className="text-gray-300">Job Title</TableHead>
              <TableHead className="text-gray-300">Role</TableHead>
              <TableHead className="text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-gray-700">
                <TableCell 
                  className="text-gray-200 cursor-pointer hover:underline"
                  onClick={() => router.push(`/profile/${user.id}`)}
                >
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell className="text-gray-200">{user.job_title || 'N/A'}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(newRole: "user" | "admin") => handleRoleChange(user.id, newRole)}
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
                <TableCell>
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 