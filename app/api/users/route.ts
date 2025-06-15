import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query") || ""
  const role = searchParams.get("role") || "all"

  try {
    let queryBuilder = supabase.from("users").select("*")

    if (query) {
      queryBuilder = queryBuilder.ilike("name", `%${query}%`)
    }

    if (role !== "all") {
      queryBuilder = queryBuilder.eq("role", role)
    }

    const { data, error } = await queryBuilder

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
  }
} 