"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Users, ExternalLink, Check, X } from "lucide-react"
import { databaseService } from "@/lib/database"
import type { Organization, Profile } from "@/lib/types"

interface AdminOrganizationManagementProps {
  organizations: Organization[]
  onAddOrganization: (name: string) => Promise<void>
  onDeleteOrganization: (id: number) => Promise<void>
  onJoinOrganization: (orgId: number) => Promise<void>
  onLeaveOrganization: (orgId: number) => Promise<void>
  memberships: Map<number, 'pending' | 'approved'>
  memberCounts: { [key: number]: number }
  pendingCounts: { [key: number]: number }
  onRefreshCounts: () => Promise<void>
}

export function AdminOrganizationManagement({
  organizations,
  onAddOrganization,
  onDeleteOrganization,
  onJoinOrganization,
  onLeaveOrganization,
  memberships,
  memberCounts,
  pendingCounts,
  onRefreshCounts
}: AdminOrganizationManagementProps) {
  const [newOrgName, setNewOrgName] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [deletingOrgs, setDeletingOrgs] = useState<Set<number>>(new Set())
  const [joiningOrgs, setJoiningOrgs] = useState<Set<number>>(new Set())
  const [leavingOrgs, setLeavingOrgs] = useState<Set<number>>(new Set())
  const [selectedOrgMembers, setSelectedOrgMembers] = useState<Profile[]>([])
  const [selectedOrgName, setSelectedOrgName] = useState("")
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<Profile[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)
  const [isLoadingPending, setIsLoadingPending] = useState(false)
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadMemberCounts()
  }, [organizations])

  const loadMemberCounts = async () => {
    try {
      const counts = await databaseService.getOrganizationMemberCounts()
      console.log('Member counts:', counts)
    } catch (error) {
      console.error("Failed to load member counts:", error)
    }
  }

  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return

    setIsAdding(true)
    try {
      await onAddOrganization(newOrgName.trim())
      setNewOrgName("")
      await loadMemberCounts() // Refresh member counts after adding
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
      await loadMemberCounts() // Refresh member counts after deleting
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

  const handleJoin = async (orgId: number) => {
    setJoiningOrgs((prev) => new Set(prev).add(orgId))
    try {
      await onJoinOrganization(orgId)
      await loadMemberCounts() // Refresh member counts after joining
    } catch (error) {
      console.error("Failed to join organization:", error)
    } finally {
      setJoiningOrgs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(orgId)
        return newSet
      })
    }
  }

  const handleLeave = async (orgId: number) => {
    setLeavingOrgs((prev) => new Set(prev).add(orgId))
    try {
      await onLeaveOrganization(orgId)
      await loadMemberCounts() // Refresh member counts after leaving
    } catch (error) {
      console.error("Failed to leave organization:", error)
    } finally {
      setLeavingOrgs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(orgId)
        return newSet
      })
    }
  }

  const handleViewMembers = async (org: Organization) => {
    setIsLoadingMembers(true)
    setSelectedOrgName(org.name)
    try {
      console.log('Attempting to load members for organization:', org.id, org.name)
      const members = await databaseService.getOrganizationMembers(org.id)
      console.log('Members loaded successfully:', members)
      setSelectedOrgMembers(members)
    } catch (error) {
      console.error("Failed to load organization members:", error)
      console.error("Error details:", error)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const handleViewPendingRequests = async (org: Organization) => {
    setIsLoadingPending(true)
    setSelectedOrgName(org.name)
    setSelectedOrgId(org.id)
    try {
      console.log('Loading pending requests for organization:', org.id, org.name)
      const requests = await databaseService.getPendingRequests(org.id)
      console.log('Pending requests loaded:', requests)
      setPendingRequests(requests)
    } catch (error) {
      console.error("Failed to load pending requests:", error)
    } finally {
      setIsLoadingPending(false)
    }
  }

  const handleApproveRequest = async (userId: string) => {
    if (!selectedOrgId) return
    
    setProcessingRequests(prev => new Set(prev).add(userId))
    try {
      await databaseService.approveMembershipRequest(userId, selectedOrgId)
      // Remove from pending requests list
      setPendingRequests(prev => prev.filter(req => req.id !== userId))
      // Refresh data to update counts
      await onRefreshCounts()
    } catch (error) {
      console.error("Failed to approve request:", error)
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleRejectRequest = async (userId: string) => {
    if (!selectedOrgId) return
    
    setProcessingRequests(prev => new Set(prev).add(userId))
    try {
      await databaseService.rejectMembershipRequest(userId, selectedOrgId)
      // Remove from pending requests list
      setPendingRequests(prev => prev.filter(req => req.id !== userId))
      // Refresh data to update counts
      await onRefreshCounts()
    } catch (error) {
      console.error("Failed to reject request:", error)
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
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
                <TableHead className="text-gray-300">Members</TableHead>
                <TableHead className="text-gray-300">Pending Requests</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id} className="border-gray-700">
                  <TableCell className="text-gray-200">{org.name}</TableCell>
                  <TableCell className="text-gray-200">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 hover:bg-transparent p-0 h-auto"
                          onClick={() => handleViewMembers(org)}
                        >
                          {memberCounts[org.id] || 0} members
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-white">{selectedOrgName} Members</DialogTitle>
                        </DialogHeader>
                        {isLoadingMembers ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                          </div>
                        ) : (
                          <div className="max-h-[400px] overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-gray-700">
                                  <TableHead className="text-gray-300">Name</TableHead>
                                  <TableHead className="text-gray-300">Job Title</TableHead>
                                  <TableHead className="text-gray-300">Role</TableHead>
                                  <TableHead className="text-gray-300">LinkedIn</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedOrgMembers.map((member) => (
                                  <TableRow key={member.id} className="border-gray-700">
                                    <TableCell className="text-gray-200">
                                      {member.first_name} {member.last_name}
                                    </TableCell>
                                    <TableCell className="text-gray-200">{member.job_title || "N/A"}</TableCell>
                                    <TableCell className="text-gray-200">
                                      <span className={`px-2 py-1 rounded-full text-xs ${
                                        member.role === "admin" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                                      }`}>
                                        {member.role}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-gray-200">
                                      {member.linkedin_account ? (
                                        <a
                                          href={member.linkedin_account}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center justify-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </a>
                                      ) : (
                                        "N/A"
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell className="text-gray-200">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`px-2 py-1 rounded-full text-xs ${
                            (pendingCounts[org.id] || 0) > 0 
                              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' 
                              : 'bg-gray-500/20 text-gray-400 cursor-default'
                          }`}
                          onClick={() => (pendingCounts[org.id] || 0) > 0 && handleViewPendingRequests(org)}
                          disabled={(pendingCounts[org.id] || 0) === 0}
                        >
                          {pendingCounts[org.id] || 0} pending
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-white">Pending Requests - {selectedOrgName}</DialogTitle>
                        </DialogHeader>
                        {isLoadingPending ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                          </div>
                        ) : pendingRequests.length === 0 ? (
                          <div className="text-center py-4 text-gray-400">
                            No pending requests
                          </div>
                        ) : (
                          <div className="max-h-[400px] overflow-y-auto">
                            <div className="space-y-3">
                              {pendingRequests.map((request) => (
                                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                      <div>
                                        <h4 className="font-medium text-white">
                                          {request.first_name} {request.last_name}
                                        </h4>
                                        <p className="text-sm text-gray-400">{request.job_title || "N/A"}</p>
                                        <p className="text-sm text-gray-400">{request.email}</p>
                                      </div>
                                      {request.linkedin_account && (
                                        <a
                                          href={request.linkedin_account}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-400 hover:text-blue-300"
                                        >
                                          <ExternalLink className="h-4 w-4" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveRequest(request.id)}
                                      disabled={processingRequests.has(request.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      {processingRequests.has(request.id) ? "Approving..." : "Approve"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleRejectRequest(request.id)}
                                      disabled={processingRequests.has(request.id)}
                                      variant="destructive"
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      {processingRequests.has(request.id) ? "Rejecting..." : "Reject"}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleJoin(org.id)}
                        disabled={joiningOrgs.has(org.id) || memberships.has(org.id)}
                        className={`${
                          memberships.has(org.id)
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        } text-white`}
                      >
                        {joiningOrgs.has(org.id) ? "Joining..." : memberships.has(org.id) ? "Joined" : "Join"}
                      </Button>
                      {memberships.has(org.id) && (
                        <Button
                          size="sm"
                          onClick={() => handleLeave(org.id)}
                          disabled={leavingOrgs.has(org.id)}
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {leavingOrgs.has(org.id) ? "Leaving..." : "Leave"}
                        </Button>
                      )}
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
                    </div>
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
