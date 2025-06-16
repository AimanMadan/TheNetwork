import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createProfileFromAuthUser } from "@/lib/auth"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      }
    )

    const { error: signInError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (signInError) {
      console.error("Error exchanging code for session:", signInError)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(signInError.message)}`)
    }

    // Get the user after successful sign in
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Error getting user:", userError)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent("Failed to get user data")}`)
    }

    // Create or update profile
    const { data: profile, error: profileError } = await createProfileFromAuthUser(supabase, user)
    
    if (profileError) {
      console.error("Error creating/updating profile:", profileError)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(profileError.message)}`)
    }

    // Check if profile is complete
    const isProfileComplete = profile && 
      profile.first_name && 
      profile.last_name && 
      profile.email && 
      profile.avatar_url &&
      profile.job_title &&
      profile.company &&
      profile.linkedin_account

    console.log("Profile completeness check:", {
      profile,
      isComplete: isProfileComplete,
      hasFirstName: !!profile?.first_name,
      hasLastName: !!profile?.last_name,
      hasEmail: !!profile?.email,
      hasAvatar: !!profile?.avatar_url,
      hasJobTitle: !!profile?.job_title,
      hasCompany: !!profile?.company,
      hasLinkedIn: !!profile?.linkedin_account
    })

    // If profile is incomplete, redirect to onboarding
    if (!isProfileComplete) {
      console.log("Profile incomplete, redirecting to onboarding")
      return NextResponse.redirect(`${requestUrl.origin}/onboarding`)
    }

    // If profile is complete, redirect to dashboard
    return NextResponse.redirect(`${requestUrl.origin}${next}`)
  }

  // If no code is present, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
} 