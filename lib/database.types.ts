export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          job_title: string | null
          linkedin_account: string | null
          email: string | null
          role: string
          avatar_url: string | null
          needs_linkedin: boolean
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          job_title?: string | null
          linkedin_account?: string | null
          email?: string | null
          role?: string
          avatar_url?: string | null
          needs_linkedin?: boolean
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          job_title?: string | null
          linkedin_account?: string | null
          email?: string | null
          role?: string
          avatar_url?: string | null
          needs_linkedin?: boolean
        }
      }
      organizations: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
      }
      user_organizations: {
        Row: {
          user_id: string
          organization_id: number
        }
        Insert: {
          user_id: string
          organization_id: number
        }
        Update: {
          user_id?: string
          organization_id?: number
        }
      }
    }
  }
}
