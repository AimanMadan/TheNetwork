"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ExternalLink } from "lucide-react"
import type { Organization, Profile } from "@/lib/types"
import { databaseService } from "@/lib/database"

interface OrganizationsToJoinTableProps {
  organizations: Organization[]
  onJoinOrganization: (orgId: number) => Promise<void>
  onLeaveOrganization: (orgId: number) => Promise<void>
  memberships: Map<number, 'pending' | 'approved'>
  memberCounts: { [key: number]: number }
}

export function OrganizationsToJoinTable({ 
  organizations, 
  onJoinOrganization, 
  onLeaveOrganization,
  memberships,
  memberCounts
}: OrganizationsToJoinTableProps) {
  const [joiningOrgs, setJoiningOrgs] = useState<Set<number>>(new Set())
  const [leavingOrgs, setLeavingOrgs] = useState<Set<number>>(new Set())
  const [selectedOrgMembers, setSelectedOrgMembers] = useState<Profile[]>([])
  const [selectedOrgName, setSelectedOrgName] = useState("")
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

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

  const handleJoin = async (orgId: number) => {
    setJoiningOrgs((prev) => new Set(prev).add(orgId))
    try {
      await onJoinOrganization(orgId)
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

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Organizations to Join</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-300">Organization Name</TableHead>
              <TableHead className="text-gray-300">Members</TableHead>
              <TableHead className="text-gray-300">Action</TableHead>
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
                        disabled={!memberships.has(org.id)}
                        className={`${
                          memberships.has(org.id)
                            ? "text-blue-400 hover:text-blue-300 hover:bg-transparent cursor-pointer"
                            : "text-gray-500 cursor-not-allowed"
                        } p-0 h-auto`}
                        onClick={() => memberships.has(org.id) && handleViewMembers(org)}
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
                      {joiningOrgs.has(org.id) ? "Joining..." : memberships.has(org.id) ? "Requested" : "Join"}
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
