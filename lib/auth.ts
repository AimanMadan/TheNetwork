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
    
    // Extract data from Google user metadata
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ""
    const nameParts = fullName.split(' ')
    const firstName = user.user_metadata?.given_name || user.user_metadata?.first_name || nameParts[0] || null
    const lastName = user.user_metadata?.family_name || user.user_metadata?.last_name || nameParts.slice(1).join(' ') || null

    // Get avatar URL from various sources
    const avatarUrl = user.user_metadata?.avatar_url || 
                     user.user_metadata?.picture || 
                     user.user_metadata?.linkedin_picture || 
                     user.user_metadata?.picture_url || 
                     null

    const profileData = {
      id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      job_title: null,
      linkedin_account: null,
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
    console.log('Profile will be incomplete - user must complete onboarding')
    return profile as Profile
  },

  isProfileComplete(profile: Profile): boolean {
    const isComplete = !!(
      profile.first_name && profile.first_name.trim() !== "" &&
      profile.last_name && profile.last_name.trim() !== "" &&
      profile.job_title && profile.job_title.trim() !== "" &&
      profile.linkedin_account && profile.linkedin_account.trim() !== ""
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
