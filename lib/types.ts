export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  job_title: string | null
  linkedin_account: string | null
  email: string | null
  role: "user" | "admin"
}

export interface Organization {
  id: number
  name: string
}

export interface UserOrganization {
  user_id: string
  organization_id: number
}
