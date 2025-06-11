import { supabase } from "./supabase"
import type { Profile, Organization } from "./types"

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
    const { data, error } = await supabase.from("profiles").select("*").order("first_name")

    if (error) throw error
    return data as Profile[]
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
    const { error } = await supabase.from("user_organizations")
      .delete()
      .eq("user_id", userId)
      .eq("organization_id", organizationId)

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
}
