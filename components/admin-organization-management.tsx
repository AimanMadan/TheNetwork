"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import type { Organization } from "@/lib/types"

interface AdminOrganizationManagementProps {
  organizations: Organization[]
  onAddOrganization: (name: string) => Promise<void>
  onDeleteOrganization: (id: number) => Promise<void>
}

export function AdminOrganizationManagement({
  organizations,
  onAddOrganization,
  onDeleteOrganization,
}: AdminOrganizationManagementProps) {
  const [newOrgName, setNewOrgName] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [deletingOrgs, setDeletingOrgs] = useState<Set<number>>(new Set())

  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return

    setIsAdding(true)
    try {
      await onAddOrganization(newOrgName.trim())
      setNewOrgName("")
    } catch (error) {
      console.error("Failed to add organization:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteOrganization = async (id: number) => {
    setDeletingOrgs((prev) => new Set(prev).add(id))
    try {
      await onDeleteOrganization(id)
    } catch (error) {
      console.error("Failed to delete organization:", error)
    } finally {
      setDeletingOrgs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Manage Organizations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Organization Form */}
        <form onSubmit={handleAddOrganization} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName" className="text-gray-300">
              Organization Name
            </Label>
            <Input
              id="orgName"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Enter organization name"
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isAdding || !newOrgName.trim()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isAdding ? "Adding..." : "Add Organization"}
          </Button>
        </form>

        {/* Organizations List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Existing Organizations</h3>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Organization Name</TableHead>
                <TableHead className="text-gray-300">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id} className="border-gray-700">
                  <TableCell className="text-gray-200">{org.name}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingOrgs.has(org.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {deletingOrgs.has(org.id) ? "Deleting..." : "Delete"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-800 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-300">
                            Are you sure you want to delete this organization? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteOrganization(org.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
