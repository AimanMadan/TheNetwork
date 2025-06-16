export interface Profile {
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
  full_name: string | null
}

export interface Organization {
  id: number
  name: string
}

export interface UserOrganization {
  user_id: string
  organization_id: number
}

export type Membership = {
  user_id: string
  organization_id: number
  status: 'pending' | 'approved'
}
