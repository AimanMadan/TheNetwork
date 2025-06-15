import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const { data: profiles, error } = await supabase.from("profiles").select("job_title, role")

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