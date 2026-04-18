import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DEFAULT_PROFILE_IMAGE =
  "https://pub-34f3a2d97cda434eb3fb17be1fae8b2f.r2.dev/profiles/play-match-default-profile-pic.png"

/** Resolve a user profile image — replaces Google URLs and empty strings with the R2 default */
export function resolveProfileImage(image: string | null | undefined): string {
  if (!image?.trim()) return DEFAULT_PROFILE_IMAGE
  if (image.includes("googleusercontent.com")) return DEFAULT_PROFILE_IMAGE
  return image
}
