import { supabase } from "./supabase"
import type { Profile } from "./types"

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
    if (!user) return null

    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (error) {
      if (error.code === "PGRST116") {
        // Profile doesn't exist, create one (this happens with OAuth)
        return await this.createProfileFromAuthUser(user)
      }
      throw error
    }
    return profile as Profile
  },

  async createProfileFromAuthUser(user: any): Promise<Profile> {
    // Extract data from Google user metadata
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ""
    const nameParts = fullName.split(' ')
    const firstName = user.user_metadata?.given_name || user.user_metadata?.first_name || nameParts[0] || null
    const lastName = user.user_metadata?.family_name || user.user_metadata?.last_name || nameParts.slice(1).join(' ') || null

    const profileData = {
      id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      job_title: null,
      linkedin_account: null,
      role: "user" as const,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .insert(profileData)
      .select()
      .single()

    if (error) throw error
    return profile as Profile
  },

  isProfileComplete(profile: Profile): boolean {
    return !!(
      profile.first_name &&
      profile.last_name &&
      profile.job_title &&
      profile.linkedin_account
    )
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
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    return data
  },
}
