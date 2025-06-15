import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
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
      if (organizationIds.length > 0) {
        effectiveOrgIds = organizationIds.filter((id) => userOrgIds.includes(id))
      } else {
        effectiveOrgIds = userOrgIds
      }
      applyOrgFilter = true
    }
    
    if (applyOrgFilter && effectiveOrgIds.length === 0) {
      return NextResponse.json({ jobTitles: [], roles: [] });
    }

    const joinType = applyOrgFilter ? "inner" : "left"
    let queryBuilder = supabase
      .from("profiles")
      .select(`job_title, role, user_organizations!${joinType}(organization_id)`)

    if (applyOrgFilter) {
      queryBuilder = queryBuilder.in("user_organizations.organization_id", effectiveOrgIds)
    }

    const { data: profiles, error } = await queryBuilder

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const jobTitles = [...new Set(profiles.map((p) => p.job_title).filter(Boolean))]
    const roles = [...new Set(profiles.map((p) => p.role).filter(Boolean))]

    return NextResponse.json({ jobTitles, roles })
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
} 