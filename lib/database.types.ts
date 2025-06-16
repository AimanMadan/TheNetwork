export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          job_title: string | null
          company: string | null
          linkedin_account: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          job_title?: string | null
          company?: string | null
          linkedin_account?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          job_title?: string | null
          company?: string | null
          linkedin_account?: string | null
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
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
