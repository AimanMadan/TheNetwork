import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Profile } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false
  
  // A profile is complete if the main fields from the form are present.
  return !!(
    profile.first_name &&
    profile.last_name &&
    profile.job_title
  )
}
