import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query") || ""
  const role = searchParams.get("role") || "all"

  try {
    let queryBuilder = supabase.from("profiles").select("*")

    if (query) {
      queryBuilder = queryBuilder.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    }

    if (role !== "all") {
      queryBuilder = queryBuilder.eq("role", role)
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