import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query") || ""
  const roles = searchParams.getAll("roles")
  const jobTitles = searchParams.getAll("jobTitles")

  try {
    const supabase_session = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    )

    const {
      data: { user },
    } = await supabase_session.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let queryBuilder = supabase.from("profiles").select("*, organizations:organization_members!inner(organization_id)")

    if (query) {
      queryBuilder = queryBuilder.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    }

    if (roles.length > 0) {
      queryBuilder = queryBuilder.in("role", roles)
    }

    if (jobTitles.length > 0) {
      queryBuilder = queryBuilder.in("job_title", jobTitles)
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, organizations:organization_members!inner(organization_id)")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Failed to fetch user profile." }, { status: 500 })
    }

    if (profile.role !== "admin") {
      const userOrgIds = profile.organizations.map((org) => org.organization_id)
      queryBuilder = queryBuilder.filter("organizations.organization_id", "in", `(${userOrgIds.join(",")})`)
    }

    const { data, error } = await queryBuilder

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const users = data.map((profile) => ({
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      role: profile.job_title,
      avatar: profile.avatar_url || "/placeholder-user.jpg",
      fallback: `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase(),
    }))

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
} 