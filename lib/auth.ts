import { supabase } from "./supabase"
import type { Profile } from "./types"
import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import type { Database } from "./database.types"

export interface SignUpData {
  email: string
  password: string
  first_name: string
  last_name: string
  job_title: string
  linkedin_account: string
}

export interface SignInData {
  email: string
  password: string
}

export const authService = {
  async signUp(data: SignUpData) {
    const { email, password, ...profileData } = data

    // Create auth user with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: profileData // This will be available in raw_user_meta_data
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error("Failed to create user")

    return authData
  },

  async signIn(data: SignInData) {
    const { data: authData, error } = await supabase.auth.signInWithPassword(data)
    if (error) throw error
    return authData
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser(): Promise<Profile | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.log('No authenticated user found')
      return null
    }

    console.log('Authenticated user found:', user.email)

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error) {
      if (error.code === "PGRST116") {
        // Profile doesn't exist, create one (this happens with OAuth)
        console.log('Profile not found, creating new profile for OAuth user')
        return await this.createProfileFromAuthUser(user)
      }
      console.error('Error fetching profile:', error)
      throw error
    }
    console.log('Profile found:', profile)
    return profile as Profile
  },

  async createProfileFromAuthUser(user: any): Promise<Profile> {
    console.log('Creating profile from auth user:', user.email)
    console.log('User metadata:', user.user_metadata)
    
    const isLinkedInSignIn = user.app_metadata?.provider === 'linkedin_oidc'

    // Extract data from user metadata
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ""
    const nameParts = fullName.split(' ')
    const firstName = user.user_metadata?.given_name || user.user_metadata?.first_name || nameParts[0] || null
    const lastName = user.user_metadata?.family_name || user.user_metadata?.last_name || nameParts.slice(1).join(' ') || null
    
    // For LinkedIn sign-ins, we use their LinkedIn picture and try to find a profile URL
    const avatarUrl = isLinkedInSignIn 
      ? (user.user_metadata?.picture || user.user_metadata?.avatar_url) 
      : null
    
    // LinkedIn doesn't provide a clean profile URL, so we mark it for onboarding completion
    const linkedinAccount = isLinkedInSignIn
      ? "https://linkedin.com/in/me" // Placeholder, user must update
      : null

    const profileData = {
      id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      job_title: null,
      linkedin_account: linkedinAccount,
      role: "user" as const,
      avatar_url: avatarUrl,
    }

    console.log('Profile data to insert:', profileData)

    const { data: profile, error } = await supabase
      .from("profiles")
      .insert(profileData)
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      throw error
    }
    
    console.log('Profile created successfully:', profile)
    return profile as Profile
  },

  isProfileComplete(profile: Profile): boolean {
    const isComplete = !!(
      profile.first_name &&
      profile.first_name.trim() !== "" &&
      profile.last_name &&
      profile.last_name.trim() !== "" &&
      profile.job_title &&
      profile.job_title.trim() !== "" &&
      profile.linkedin_account &&
      profile.linkedin_account.trim() !== ""
    )

    console.log('Profile completion check:', {
      first_name: profile.first_name ? `"${profile.first_name}"` : 'NULL/EMPTY',
      last_name: profile.last_name ? `"${profile.last_name}"` : 'NULL/EMPTY', 
      job_title: profile.job_title ? `"${profile.job_title}"` : 'NULL/EMPTY',
      linkedin_account: profile.linkedin_account ? `"${profile.linkedin_account}"` : 'NULL/EMPTY',
      isComplete
    })
    return isComplete
  },

  isLinkedInConnected(profile: Profile): boolean {
    // Check if the user has connected their LinkedIn account
    const hasLinkedInAvatar = profile.avatar_url?.includes('linkedin') || false
    const hasLinkedInAccount = profile.linkedin_account?.trim() !== "" || false
    
    return hasLinkedInAvatar || hasLinkedInAccount
  },

  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null)
    })
  },

  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          scope: 'openid profile email'
        }
      }
    })
    if (error) throw error
    return data
  },

  async signInWithLinkedIn() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          scope: 'openid profile email'
        }
      }
    })
    if (error) throw error
    return data
  },
}

export async function createProfileFromAuthUser(
  supabase: ReturnType<typeof createClient<Database>>,
  user: User
): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError
    }

    if (existingProfile) {
      // Update existing profile with latest user data
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          email: user.email,
          first_name: user.user_metadata.first_name || existingProfile.first_name,
          last_name: user.user_metadata.last_name || existingProfile.last_name,
          avatar_url: user.user_metadata.avatar_url || existingProfile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single()

      if (updateError) throw updateError
      return { data: updatedProfile, error: null }
    }

    // Create new profile
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata.first_name,
        last_name: user.user_metadata.last_name,
        avatar_url: user.user_metadata.avatar_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) throw insertError
    return { data: newProfile, error: null }
  } catch (error) {
    console.error("Error in createProfileFromAuthUser:", error)
    return { data: null, error: error as Error }
  }
}

export async function signInWithLinkedIn(supabase: ReturnType<typeof createClient<Database>>) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "linkedin_oidc",
    options: {
      queryParams: {
        scope: "openid profile email",
      },
    },
  })

  if (error) throw error
  return data
}
