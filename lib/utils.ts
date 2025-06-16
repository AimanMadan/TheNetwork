import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Profile } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false
  
  // Check if all required fields are filled
  return !!(
    profile.first_name &&
    profile.first_name.trim() !== "" &&
    profile.last_name &&
    profile.last_name.trim() !== "" &&
    profile.job_title &&
    profile.job_title.trim() !== "" &&
    profile.linkedin_account &&
    profile.linkedin_account.trim() !== ""
  )
}
