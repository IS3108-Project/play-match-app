import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a UTC-stored calendar date to local midnight.
 * DB stores dates as UTC (e.g. "2026-04-19T00:00:00.000Z"), but the user
 * intended "April 19" in their local timezone, not UTC.
 */
export function toLocalDate(utcDate: Date | string): Date {
  const d = new Date(utcDate)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/** Combines a UTC-stored calendar date with a local time string (HH:mm). */
export function toLocalDateTime(utcDate: Date | string, time: string): Date {
  const d = new Date(utcDate)
  const [hours, minutes] = time.split(":").map(Number)
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hours ?? 0, minutes ?? 0, 0, 0)
}

const DEFAULT_PROFILE_IMAGE =
  "https://pub-34f3a2d97cda434eb3fb17be1fae8b2f.r2.dev/profiles/play-match-default-profile-pic.jpg"

/** Resolve a user profile image — replaces Google URLs and empty strings with the R2 default */
export function resolveProfileImage(image: string | null | undefined): string {
  if (!image?.trim()) return DEFAULT_PROFILE_IMAGE
  if (image.includes("googleusercontent.com")) return DEFAULT_PROFILE_IMAGE
  return image
}
