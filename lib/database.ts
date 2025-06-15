import { supabase } from "./supabase"
import type { Profile, Organization, Membership } from "./types"

/**
 * Database service that handles all interactions with Supabase database.
 * Implements CRUD operations for profiles, organizations, and user-organization relationships.
 */
export const databaseService = {
  // Profile operations
  /**
   * Retrieves all user profiles from the database.
   * @returns Promise<Profile[]> Array of all user profiles, sorted by first name
   * @throws Error if database query fails
   */
  async getAllProfiles(): Promise<Profile[]> {
    try {
      // Use RPC function to get all profiles, bypassing RLS restrictions for admin users
      const { data, error } = await supabase.rpc("get_all_profiles_admin")

      if (error) {
        throw new Error(`Failed to get all profiles: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("Error getting all profiles:", error)
      throw error
    }
  },

  async getPaginatedProfiles(
    page: number,
    limit: number
  ): Promise<{ data: Profile[]; hasMore: boolean }> {
    try {
      const from = page * limit
      const to = from + limit - 1

      const { data, error } = await supabase
        .rpc("get_all_profiles_admin")
        .range(from, to)

      if (error) {
        throw new Error(`Failed to get paginated profiles: ${error.message}`)
      }

      // To check if there are more pages, we fetch one more item than the limit
      const { data: nextPageData, error: nextPageError } = await supabase
        .rpc("get_all_profiles_admin")
        .range(from + limit, from + limit)
        .limit(1)

      if (nextPageError) {
        console.warn(`Could not check for more pages: ${nextPageError.message}`)
      }

      return {
        data: data || [],
        hasMore: !!nextPageData && nextPageData.length > 0,
      }
    } catch (error) {
      console.error("Error getting paginated profiles:", error)
      throw error
    }
  },

  /**
   * Retrieves a single user profile by their ID.
   * @param userId - The unique identifier of the user
   * @returns Promise<Profile | null> The user's profile or null if not found
   * @throws Error if database query fails (except for not found case)
   */
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      if (error.code === "PGRST116") return null // No rows returned
      throw error
    }
    return data as Profile
  },

  /**
   * Updates a user's profile with new information, or creates it if it doesn't exist.
   * @param userId - The unique identifier of the user
   * @param profileData - The profile data to update
   * @returns Promise<Profile> The updated/created profile
   * @throws Error if database operation fails
   */
  async updateProfile(userId: string, profileData: Partial<Omit<Profile, 'id' | 'email' | 'role'>>): Promise<Profile> {
    // First, try to get the current user's auth data to ensure we have email
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      throw new Error('Unable to get authenticated user')
    }

    // Prepare the full profile data for upsert
    const fullProfileData = {
      id: userId,
      email: authUser.email,
      role: 'user' as const, // Default role for new profiles
      ...profileData
    }

    console.log('Upserting profile with data:', fullProfileData)

    // Use upsert to either update existing profile or create new one
    const { data: profile, error } = await supabase
      .from("profiles")
      .upsert(fullProfileData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting profile:', error)
      throw error
    }
    
    console.log('Profile upsert successful:', profile)
    return profile as Profile
  },

  // Organization operations
  /**
   * Retrieves all organizations from the database.
   * @returns Promise<Organization[]> Array of all organizations, sorted by name
   * @throws Error if database query fails
   */
  async getAllOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase.from("organizations").select("*").order("name")

    if (error) throw error
    return data as Organization[]
  },

  /**
   * Creates a new organization in the database.
   * Only accessible by users with admin role (enforced by RLS).
   * @param name - The name of the organization to create
   * @returns Promise<Organization> The newly created organization
   * @throws Error if database insert fails or user lacks permission
   */
  async createOrganization(name: string): Promise<Organization> {
    const { data, error } = await supabase.from("organizations").insert({ name }).select().single()

    if (error) throw error
    return data as Organization
  },

  /**
   * Deletes an organization and all its user relationships.
   * Only accessible by users with admin role (enforced by RLS).
   * @param id - The ID of the organization to delete
   * @throws Error if database delete fails or user lacks permission
   */
  async deleteOrganization(id: number): Promise<void> {
    // First delete all user_organizations relationships
    const { error: relationError } = await supabase.from("user_organizations").delete().eq("organization_id", id)

    if (relationError) throw relationError

    // Then delete the organization
    const { error } = await supabase.from("organizations").delete().eq("id", id)

    if (error) throw error
  },

  // User-Organization relationships
  /**
   * Adds a user to an organization.
   * @param userId - The ID of the user joining the organization
   * @param organizationId - The ID of the organization to join
   * @throws Error if database insert fails or user lacks permission
   */
  async joinOrganization(userId: string, organizationId: number): Promise<void> {
    const { error } = await supabase.from("user_organizations").insert({
      user_id: userId,
      organization_id: organizationId,
    })

    if (error) throw error
  },

  /**
   * Removes a user from an organization.
   * @param userId - The ID of the user leaving the organization
   * @param organizationId - The ID of the organization to leave
   * @throws Error if database delete fails or user lacks permission
   */
  async leaveOrganization(userId: string, organizationId: number): Promise<void> {
    const { error } = await supabase
      .from("user_organizations")
      .delete()
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("status", 'approved')

    if (error) throw error
  },

  /**
   * Retrieves all organization IDs that a user has joined.
   * @param userId - The ID of the user
   * @returns Promise<number[]> Array of organization IDs the user has joined
   * @throws Error if database query fails
   */
  async getUserOrganizations(userId: string): Promise<number[]> {
    const { data, error } = await supabase.from("user_organizations").select("organization_id").eq("user_id", userId)

    if (error) throw error
    return data.map((item) => item.organization_id)
  },

  /**
   * Retrieves all organizations that a user has not yet joined.
   * @param userId - The ID of the user
   * @returns Promise<Organization[]> Array of organizations the user can join
   * @throws Error if database queries fail
   */
  async getAvailableOrganizations(userId: string): Promise<Organization[]> {
    // Get user's current organizations
    const userOrgIds = await this.getUserOrganizations(userId)

    // Get all organizations
    const allOrgs = await this.getAllOrganizations()

    // Filter out organizations user has already joined
    return allOrgs.filter((org) => !userOrgIds.includes(org.id))
  },

  /**
   * Updates a user's role in the database.
   * Only accessible by users with admin role (enforced by RPC function).
   * @param userId - The ID of the user to update
   * @param role - The new role to assign ("user" or "admin")
   * @throws Error if database update fails or user lacks permission
   */
  async updateUserRole(userId: string, role: "user" | "admin"): Promise<void> {
    const { error } = await supabase.rpc("update_user_role_admin", {
      target_user_id: userId,
      new_role: role
    })

    if (error) throw error
  },

  /**
   * Gets the number of members for each organization.
   * @returns Promise<{ [key: number]: number }> Object mapping organization IDs to their member counts
   * @throws Error if database query fails
   */
  async getOrganizationMemberCounts(): Promise<{ [key: number]: number }> {
    try {
      // Get all organizations first
      const allOrgs = await this.getAllOrganizations()
      const orgIds = allOrgs.map(org => org.id)

      // Use RPC function to get memberships, respecting RLS
      const { data, error } = await supabase.rpc("get_memberships_by_org_ids", {
        org_ids: orgIds
      })

      if (error) {
        throw new Error(`Failed to get member counts: ${error.message}`)
      }

      // Count only approved members for each organization
      const counts: { [key: number]: number } = {}
      data.forEach((item: any) => {
        if (item.status === 'approved') {
          const orgId = item.organization_id
          counts[orgId] = (counts[orgId] || 0) + 1
        }
      })
      return counts
    } catch (error) {
      console.error('Error fetching member counts:', error)
      throw error
    }
  },

  /**
   * Gets all members of a specific organization.
   * @param organizationId - The ID of the organization
   * @returns Promise<Profile[]> Array of profiles that are members of the organization
   * @throws Error if database query fails
   */
  async getOrganizationMembers(orgId: number): Promise<Profile[]> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Get user's profile to check if they're an admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw new Error('Failed to get user profile')
      }

      // Check access permissions
      if (profile.role !== 'admin') {
        // Regular users can only view members of organizations they are approved members of
        const userMemberships = await this.getUserMemberships(user.id)
        const isApprovedMember = userMemberships.some(m => 
          m.organization_id === orgId && m.status === 'approved'
        )
        
        if (!isApprovedMember) {
          throw new Error('Access denied. You must be an approved member of this organization to view its members.')
        }
      }

      // Use direct query to get organization members
      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          user_id,
          profiles!inner(*)
        `)
        .eq('organization_id', orgId)
        .eq('status', 'approved')

      if (error) {
        throw new Error(`Failed to get organization members: ${error.message}`)
      }

      return data.map(item => item.profiles).flat()
    } catch (error) {
      console.error("Error getting organization members:", error)
      throw error
    }
  },

  async getMembershipsByOrgIds(
    orgIds: number[]
  ): Promise<Membership[]> {
    if (orgIds.length === 0) return []

    const { data, error } = await supabase.rpc("get_memberships_by_org_ids", {
      org_ids: orgIds,
    })

    if (error) {
      // Supabase RPC calls can return user-friendly errors from the DB
      throw new Error(
        `Failed to get memberships: ${error.message}`
      )
    }
    return data || []
  },

  /**
   * Gets a user's memberships with their statuses.
   * @param userId - The ID of the user
   * @returns Promise<Membership[]> Array of memberships with their statuses
   * @throws Error if database query fails
   */
  async getUserMemberships(userId: string): Promise<Membership[]> {
    try {
      // Get all organizations first
      const allOrgs = await this.getAllOrganizations()
      const orgIds = allOrgs.map(org => org.id)

      // Use RPC function to get memberships, respecting RLS
      const { data, error } = await supabase.rpc("get_memberships_by_org_ids", {
        org_ids: orgIds
      })

      if (error) {
        throw new Error(`Failed to get memberships: ${error.message}`)
      }

      // Filter memberships for the specific user
      return (data || []).filter((m: Membership) => m.user_id === userId)
    } catch (error) {
      console.error("Error getting user memberships:", error)
      throw error
    }
  },

  /**
   * Requests to join an organization.
   * @param userId - The ID of the user requesting to join
   * @param organizationId - The ID of the organization to join
   * @throws Error if database insert fails or user lacks permission
   */
  async requestToJoin(userId: string, organizationId: number): Promise<void> {
    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    if (profileError) throw profileError

    // Admins are automatically approved, regular users are pending
    const status = profile.role === 'admin' ? 'approved' : 'pending'

    const { error } = await supabase.from("user_organizations").insert({
      user_id: userId,
      organization_id: organizationId,
      status: status
    })

    if (error) throw error
  },

  /**
   * Cancels a pending join request.
   * @param userId - The ID of the user cancelling the request
   * @param organizationId - The ID of the organization
   * @throws Error if database delete fails or user lacks permission
   */
  async cancelJoinRequest(userId: string, organizationId: number): Promise<void> {
    const { error } = await supabase
      .from("user_organizations")
      .delete()
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("status", 'pending')

    if (error) throw error
  },

  /**
   * Gets the number of pending requests for each organization.
   * @returns Promise<{ [key: number]: number }> Object mapping organization IDs to their pending request counts
   * @throws Error if database query fails
   */
  async getOrganizationPendingCounts(): Promise<{ [key: number]: number }> {
    try {
      // Get all organizations first
      const allOrgs = await this.getAllOrganizations()
      const orgIds = allOrgs.map(org => org.id)

      // Use RPC function to get memberships, respecting RLS
      const { data, error } = await supabase.rpc("get_memberships_by_org_ids", {
        org_ids: orgIds
      })

      if (error) {
        throw new Error(`Failed to get pending counts: ${error.message}`)
      }

      // Count only pending requests for each organization
      const counts: { [key: number]: number } = {}
      data.forEach((item: any) => {
        if (item.status === 'pending') {
          const orgId = item.organization_id
          counts[orgId] = (counts[orgId] || 0) + 1
        }
      })
      return counts
    } catch (error) {
      console.error('Error fetching pending counts:', error)
      throw error
    }
  },

  /**
   * Gets pending membership requests for a specific organization.
   * @param organizationId - The ID of the organization
   * @returns Promise<Profile[]> Array of profiles with pending requests
   * @throws Error if database query fails
   */
  async getPendingRequests(organizationId: number): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          user_id,
          profiles!inner(*)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')

      if (error) {
        throw new Error(`Failed to get pending requests: ${error.message}`)
      }

      return data.map(item => item.profiles).flat()
    } catch (error) {
      console.error("Error getting pending requests:", error)
      throw error
    }
  },

  /**
   * Approves a pending membership request.
   * @param userId - The ID of the user to approve
   * @param organizationId - The ID of the organization
   * @throws Error if database update fails or user lacks permission
   */
  async approveMembershipRequest(userId: string, organizationId: number): Promise<void> {
    const { error } = await supabase
      .from("user_organizations")
      .update({ status: 'approved' })
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("status", 'pending')

    if (error) throw error
  },

  /**
   * Rejects a pending membership request.
   * @param userId - The ID of the user to reject
   * @param organizationId - The ID of the organization
   * @throws Error if database delete fails or user lacks permission
   */
  async rejectMembershipRequest(userId: string, organizationId: number): Promise<void> {
    const { error } = await supabase
      .from("user_organizations")
      .delete()
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("status", 'pending')

    if (error) throw error
  }
}
