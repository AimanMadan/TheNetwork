import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('Auth callback triggered with code:', !!code)

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    try {
      console.log('Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      console.log('Code exchange result:', { user: !!data.user, error })

      if (error) {
        console.error('Error exchanging code:', error)
        return NextResponse.redirect(new URL('/login?error=auth_callback_error', request.url))
      }

      if (data.user) {
        console.log('User authenticated, checking profile...')
        
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        console.log('Profile check result:', { profile: !!profile, error: profileError?.code })

        if (profileError && profileError.code === "PGRST116") {
          // Profile doesn't exist, user will need to complete onboarding
          console.log('No profile found, redirecting to onboarding')
          return NextResponse.redirect(new URL('/onboarding', request.url))
        }

        if (profile) {
          // Check if profile is complete - all required fields must be non-null and non-empty
          const isComplete = !!(
            profile.first_name && profile.first_name.trim() !== "" &&
            profile.last_name && profile.last_name.trim() !== "" &&
            profile.job_title && profile.job_title.trim() !== "" &&
            profile.linkedin_account && profile.linkedin_account.trim() !== "" &&
            !profile.needs_linkedin
          )
          
          console.log('Profile completeness:', {
            first_name: profile.first_name ? `"${profile.first_name}"` : 'NULL/EMPTY',
            last_name: profile.last_name ? `"${profile.last_name}"` : 'NULL/EMPTY',
            job_title: profile.job_title ? `"${profile.job_title}"` : 'NULL/EMPTY',
            linkedin_account: profile.linkedin_account ? `"${profile.linkedin_account}"` : 'NULL/EMPTY',
            needs_linkedin: profile.needs_linkedin,
            isComplete
          })

          if (!isComplete) {
            console.log('Profile incomplete, redirecting to onboarding')
            return NextResponse.redirect(new URL('/onboarding', request.url))
          }
        }
      }

    } catch (error) {
      console.error('Error in auth callback:', error)
    }
  }

  console.log('Redirecting to dashboard')
  return NextResponse.redirect(new URL('/dashboard', request.url))
} 