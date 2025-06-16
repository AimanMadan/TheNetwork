export type Profile = {
  id: string;
  updated_at?: string | null;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  job_title?: string | null;
  linkedin_account?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  // Deprecated columns, no longer in use
  // company?: string | null;
  // full_name?: string | null;
};

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
