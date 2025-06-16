import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { isProfileComplete } from "@/lib/utils"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/login?error=Authentication failed", request.url))
    }

    // Use the user-authenticated client to fetch the profile, relying on RLS.
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = 'exact one row not found'
      console.error("Error fetching profile:", error)
      // Redirect to an error page or onboarding if there's a serious db error
      return NextResponse.redirect(new URL("/onboarding?error=db_error", request.url))
    }
    
    // If the profile is complete, go to dashboard. Otherwise, go to onboarding.
    if (profile && isProfileComplete(profile)) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL("/login", request.url))
} 