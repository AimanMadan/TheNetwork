import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Profile } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false
  
  return !!(
    profile.id &&
    profile.email &&
    profile.full_name &&
    profile.avatar_url &&
    profile.company
  )
}
