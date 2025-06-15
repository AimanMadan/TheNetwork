import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query") || ""
  const roles = searchParams.getAll("roles")
  const jobTitles = searchParams.getAll("jobTitles")
  const organizationIds = searchParams
    .getAll("organizationIds")
    .map((id) => parseInt(id, 10))
    .filter((id) => !isNaN(id))

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

    const { data: currentUserProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role, user_organizations!left(organization_id)")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Failed to fetch user profile." }, { status: 500 })
    }

    let effectiveOrgIds: number[] = []
    let applyOrgFilter = false

    if (currentUserProfile.role === "admin") {
      if (organizationIds.length > 0) {
        effectiveOrgIds = organizationIds
        applyOrgFilter = true
      }
    } else {
      const userOrgIds = currentUserProfile.user_organizations.map((org) => org.organization_id)
      if (userOrgIds.length === 0) {
        return NextResponse.json([])
      }

      if (organizationIds.length > 0) {
        effectiveOrgIds = organizationIds.filter((id) => userOrgIds.includes(id))
      } else {
        effectiveOrgIds = userOrgIds
      }
      applyOrgFilter = true
    }
    
    if (applyOrgFilter && effectiveOrgIds.length === 0) {
      return NextResponse.json([]);
    }

    const joinType = applyOrgFilter ? "inner" : "left"
    let queryBuilder = supabase
      .from("profiles")
      .select(`*, user_organizations!${joinType}(organization_id)`)

    if (query) {
      queryBuilder = queryBuilder.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    }
    if (roles.length > 0) {
      queryBuilder = queryBuilder.in("role", roles)
    }
    if (jobTitles.length > 0) {
      queryBuilder = queryBuilder.in("job_title", jobTitles)
    }
    if (applyOrgFilter) {
      queryBuilder = queryBuilder.in("user_organizations.organization_id", effectiveOrgIds)
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