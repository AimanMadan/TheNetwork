"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { OrganizationsToJoinTable } from "@/components/organizations-to-join-table"
import { AdminOrganizationManagement } from "@/components/admin-organization-management"
import { AdminUserManagement } from "@/components/admin-user-management"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth } from "@/hooks/use-auth"
import { databaseService } from "@/lib/database"
import type { Profile, Organization } from "@/lib/types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"

// Add type definitions for membership status
type MembershipStatus = 'pending' | 'approved'
type Membership = {
  organization_id: number
  status: MembershipStatus
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [members, setMembers] = useState<Profile[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [availableOrganizations, setAvailableOrganizations] = useState<Organization[]>([])
  const [memberships, setMemberships] = useState<Map<number, MembershipStatus>>(new Map())
  const [loading, setLoading] = useState(true)
  const [memberCounts, setMemberCounts] = useState<{ [key: number]: number }>({})
  const [pendingCounts, setPendingCounts] = useState<{ [key: number]: number }>({})
  const router = useRouter()

  useEffect(() => {
    console.log('Dashboard - User changed:', user)
    if (user) {
      console.log('Dashboard - User profile:', {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        job_title: user.job_title,
        linkedin_account: user.linkedin_account,
        role: user.role
      })

      // Double-check profile completion before loading dashboard data
      const isComplete = !!(
        user.first_name && user.first_name.trim() !== "" &&
        user.last_name && user.last_name.trim() !== "" &&
        user.job_title && user.job_title.trim() !== "" &&
        user.linkedin_account && user.linkedin_account.trim() !== ""
      )

      if (!isComplete) {
        console.log('Dashboard - Profile incomplete, redirecting to onboarding')
        router.push('/onboarding')
        return
      }

      loadData()
    }
  }, [user, router])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('Dashboard - Loading data for user:', user?.email)
      
      const [allOrgs, userMemberships, counts, pendingRequestCounts] = await Promise.all([
        databaseService.getAllOrganizations(),
        databaseService.getUserMemberships(user!.id),
        databaseService.getOrganizationMemberCounts(),
        databaseService.getOrganizationPendingCounts(),
      ])

      const membershipsMap = new Map(
        userMemberships.map((m: Membership) => [m.organization_id, m.status])
      )

      setMemberships(membershipsMap)
      setMemberCounts(counts)
      setPendingCounts(pendingRequestCounts)

      if (user?.role === "admin") {
        console.log('Dashboard - Loading admin data')
        setOrganizations(allOrgs)
        // Defer loading all members
      } else {
        console.log('Dashboard - Loading regular user data')
        setAvailableOrganizations(allOrgs)
      }
    } catch (error: any) {
      console.error('Dashboard - Error loading data:', error)
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

  const handleRequestToJoin = async (orgId: number) => {
    if (!user) return

    try {
      await databaseService.requestToJoin(user.id, orgId)
      
      // Determine the status based on user role
      const status = user.role === 'admin' ? 'approved' : 'pending'
      const message = user.role === 'admin' ? 'Successfully joined organization!' : 'Request sent successfully!'
      
      toast.success(message)

      // Update memberships map
      setMemberships(prev => new Map(prev).set(orgId, status))
    } catch (error: any) {
      toast.error(error.message || "Failed to send join request")
      throw error
    }
  }

  const handleCancelOrLeave = async (orgId: number) => {
    if (!user) return

    try {
      const status = memberships.get(orgId)
      
      if (status === 'pending') {
        await databaseService.cancelJoinRequest(user.id, orgId)
        toast.success("Request cancelled")
      } else if (status === 'approved') {
        await databaseService.leaveOrganization(user.id, orgId)
        toast.success("Successfully left organization!")
      }

      // Update memberships map by removing the entry
      setMemberships(prev => {
        const newMap = new Map(prev)
        newMap.delete(orgId)
        return newMap
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to process request")
      throw error
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

  const handleUpdateUserRole = async (userId: string, newRole: "user" | "admin") => {
    try {
      await databaseService.updateUserRole(userId, newRole)
      // Refresh members list to show updated roles
      // This will be handled by the AdminUserManagement component
      toast.success("User role updated successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to update user role")
      throw error
    }
  }

  const refreshCounts = async () => {
    try {
      const [counts, pendingRequestCounts] = await Promise.all([
        databaseService.getOrganizationMemberCounts(),
        databaseService.getOrganizationPendingCounts()
      ])
      setMemberCounts(counts)
      setPendingCounts(pendingRequestCounts)
    } catch (error: any) {
      console.error('Error refreshing counts:', error)
    }
  }

  const refreshUserMemberships = async () => {
    if (!user) return
    
    try {
      const userMemberships = await databaseService.getUserMemberships(user.id)
      const membershipsMap = new Map(
        userMemberships.map((m: Membership) => [m.organization_id, m.status])
      )
      setMemberships(membershipsMap)
    } catch (error: any) {
      console.error('Error refreshing user memberships:', error)
    }
  }

  // Add effect to refresh memberships when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      refreshUserMemberships()
      if (user?.role === "admin") {
        refreshCounts()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  // Add periodic refresh for memberships
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      refreshUserMemberships()
      if (user?.role === "admin") {
        refreshCounts()
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <DashboardHeader
          firstName={user?.first_name || "User"}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 p-6 space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Community</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/users" className="flex items-center space-x-2 text-blue-400 hover:underline">
                <Search className="w-5 h-5" />
                <span>Explore the Community</span>
              </Link>
            </CardContent>
          </Card>
          <div className="space-y-8">
            {user?.role === "admin" && (
              <>
                <AdminOrganizationManagement
                  organizations={organizations}
                  memberCounts={memberCounts}
                  pendingCounts={pendingCounts}
                  onAddOrganization={handleAddOrganization}
                  onDeleteOrganization={handleDeleteOrganization}
                  onRefreshCounts={refreshCounts}
                  onJoinOrganization={handleRequestToJoin}
                  onLeaveOrganization={handleCancelOrLeave}
                  memberships={memberships}
                  onRefreshMemberships={refreshUserMemberships}
                />
                <AdminUserManagement
                  onUpdateUserRole={handleUpdateUserRole}
                />
              </>
            )}

            {user?.role !== "admin" && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold text-white">
                  Organizations
                </h1>
                <OrganizationsToJoinTable
                  organizations={availableOrganizations}
                  onJoinOrganization={handleRequestToJoin}
                  onLeaveOrganization={handleCancelOrLeave}
                  memberships={memberships}
                  memberCounts={memberCounts}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
