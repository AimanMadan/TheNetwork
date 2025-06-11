"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import type { Profile } from "@/lib/types"

interface AdminUserManagementProps {
  users: Profile[]
  onUpdateUserRole: (userId: string, newRole: "user" | "admin") => Promise<void>
}

export function AdminUserManagement({ users, onUpdateUserRole }: AdminUserManagementProps) {
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
              <TableHead className="text-gray-300">Email</TableHead>
              <TableHead className="text-gray-300">Job Title</TableHead>
              <TableHead className="text-gray-300">Role</TableHead>
              <TableHead className="text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-gray-700">
                <TableCell className="text-gray-200">
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell className="text-gray-200">{user.email}</TableCell>
                <TableCell className="text-gray-200">{user.job_title}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"} className="bg-blue-600">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    
                    {user.linkedin_account && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        asChild
                      >
                        <a href={user.linkedin_account} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
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