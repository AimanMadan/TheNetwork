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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Failed to fetch user profile." }, { status: 500 })
    }

    let effectiveOrgIds: number[] = []
    let applyOrgFilter = false

    if (profile.role !== "admin") {
      const { data: userOrgs, error: orgsError } = await supabase
        .from("user_organizations")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("status", "approved")

      if (orgsError) {
        return NextResponse.json({ error: "Failed to fetch user organizations." }, { status: 500 })
      }
      
      const approvedUserOrgIds = userOrgs.map(org => org.organization_id)
      
      if (organizationIds.length > 0) {
        effectiveOrgIds = organizationIds.filter(id => approvedUserOrgIds.includes(id))
      } else {
        effectiveOrgIds = approvedUserOrgIds
      }
      
      if (effectiveOrgIds.length === 0) {
        return NextResponse.json([])
      }
      applyOrgFilter = true
    } else {
      // Admin can filter by any org
      if (organizationIds.length > 0) {
        effectiveOrgIds = organizationIds
        applyOrgFilter = true
      }
    }

    let queryBuilder = supabase
      .from("profiles")
      .select(
        applyOrgFilter
          ? "*, user_organizations!inner(organization_id, status)"
          : "*, user_organizations!left(organization_id)"
      )

    if (applyOrgFilter) {
      queryBuilder = queryBuilder
        .eq("user_organizations.status", "approved")
        .in("user_organizations.organization_id", effectiveOrgIds)
    }
    
    if (query) {
      queryBuilder = queryBuilder.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    }
    if (roles.length > 0) {
      queryBuilder = queryBuilder.in("role", roles)
    }
    if (jobTitles.length > 0) {
      queryBuilder = queryBuilder.in("job_title", jobTitles)
    }

    const { data, error } = await queryBuilder

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const users = data.map((profile: any) => ({
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