"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { CommunityMembersTable } from "@/components/community-members-table"
import { OrganizationsToJoinTable } from "@/components/organizations-to-join-table"
import { AdminOrganizationManagement } from "@/components/admin-organization-management"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { databaseService } from "@/lib/database"
import type { Profile, Organization } from "@/lib/types"
import { toast } from "sonner"

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [members, setMembers] = useState<Profile[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([])
  const [joinedOrganizationIds, setJoinedOrganizationIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load all members
      const membersData = await databaseService.getAllProfiles()
      setMembers(membersData)

      if (user?.role === "admin") {
        // Admin: Load all organizations
        const orgsData = await databaseService.getAllOrganizations()
        setOrganizations(orgsData)
      } else {
        // Regular user: Load all organizations and joined status
        const allOrgs = await databaseService.getAllOrganizations()
        const joinedOrgs = await databaseService.getUserOrganizations(user!.id)
        setAvailableOrganizations(allOrgs)
        setJoinedOrganizationIds(joinedOrgs)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("Signed out successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out")
    }
  }

  const handleJoinOrganization = async (orgId: number) => {
    if (!user) return

    try {
      await databaseService.joinOrganization(user.id, orgId)
      toast.success("Successfully joined organization!")

      // Update joined organizations
      const joinedOrgs = await databaseService.getUserOrganizations(user.id)
      setJoinedOrganizationIds(joinedOrgs)
    } catch (error: any) {
      toast.error(error.message || "Failed to join organization")
      throw error // Re-throw to handle loading state in component
    }
  }

  const handleLeaveOrganization = async (orgId: number) => {
    if (!user) return

    try {
      await databaseService.leaveOrganization(user.id, orgId)
      toast.success("Successfully left organization!")

      // Update joined organizations
      const joinedOrgs = await databaseService.getUserOrganizations(user.id)
      setJoinedOrganizationIds(joinedOrgs)
    } catch (error: any) {
      toast.error(error.message || "Failed to leave organization")
      throw error // Re-throw to handle loading state in component
    }
  }

  const handleAddOrganization = async (name: string) => {
    try {
      const newOrg = await databaseService.createOrganization(name)
      setOrganizations((prev) => [...prev, newOrg])
      toast.success("Organization created successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to create organization")
      throw error
    }
  }

  const handleDeleteOrganization = async (id: number) => {
    try {
      await databaseService.deleteOrganization(id)
      setOrganizations((prev) => prev.filter((org) => org.id !== id))
      toast.success("Organization deleted successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete organization")
      throw error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900">
        <DashboardHeader firstName={user?.first_name || "User"} onSignOut={handleSignOut} />

        <main className="p-6">
          {user?.role === "admin" ? (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <AdminOrganizationManagement
                organizations={organizations}
                onAddOrganization={handleAddOrganization}
                onDeleteOrganization={handleDeleteOrganization}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CommunityMembersTable members={members} />
              <OrganizationsToJoinTable
                organizations={availableOrganizations}
                onJoinOrganization={handleJoinOrganization}
                onLeaveOrganization={handleLeaveOrganization}
                joinedOrganizationIds={joinedOrganizationIds}
              />
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
