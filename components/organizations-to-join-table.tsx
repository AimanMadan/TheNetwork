"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { Organization } from "@/lib/types"

interface OrganizationsToJoinTableProps {
  organizations: Organization[]
  onJoinOrganization: (orgId: number) => Promise<void>
  onLeaveOrganization: (orgId: number) => Promise<void>
  joinedOrganizationIds: number[]
}

export function OrganizationsToJoinTable({ 
  organizations, 
  onJoinOrganization, 
  onLeaveOrganization,
  joinedOrganizationIds 
}: OrganizationsToJoinTableProps) {
  const [joiningOrgs, setJoiningOrgs] = useState<Set<number>>(new Set())
  const [leavingOrgs, setLeavingOrgs] = useState<Set<number>>(new Set())

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
              <TableHead className="text-gray-300">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id} className="border-gray-700">
                <TableCell className="text-gray-200">{org.name}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleJoin(org.id)}
                      disabled={joiningOrgs.has(org.id) || joinedOrganizationIds.includes(org.id)}
                      className={`${
                        joinedOrganizationIds.includes(org.id)
                          ? "bg-gray-600 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white`}
                    >
                      {joiningOrgs.has(org.id) ? "Joining..." : joinedOrganizationIds.includes(org.id) ? "Joined" : "Join"}
                    </Button>
                    {joinedOrganizationIds.includes(org.id) && (
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
