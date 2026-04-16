import { Skeleton } from "@/components/ui/skeleton"

export function ActivityCardSkeleton() {
  return (
    <div className="flex h-full flex-row overflow-hidden rounded-lg border bg-card shadow-sm lg:flex-col">
      {/* Image placeholder */}
      <div className="basis-[45%] shrink-0 grow-0 lg:basis-auto lg:w-full">
        <Skeleton className="h-full w-full rounded-none lg:h-40" />
      </div>

      {/* Content placeholder */}
      <div className="flex basis-[55%] min-w-0 flex-col gap-2 p-4 lg:basis-auto">
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="mt-1 h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-2 h-4 w-1/3" />
      </div>
    </div>
  )
}

export function ActivityGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ActivityCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function BuddyCardSkeleton() {
  return (
    <div className="relative h-full w-full rounded-3xl overflow-hidden border bg-muted">
      <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      <div className="absolute inset-x-0 bottom-0 p-5 space-y-3">
        <Skeleton className="h-7 w-1/2 bg-white/20" />
        <Skeleton className="h-4 w-1/3 bg-white/20" />
        <Skeleton className="h-4 w-full bg-white/20" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
          <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
          <Skeleton className="h-6 w-20 rounded-full bg-white/20" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg bg-white/20" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-60" />
      </div>

      {/* Stats row */}
      <div className="flex justify-center gap-8">
        <Skeleton className="h-16 w-20 rounded-lg" />
        <Skeleton className="h-16 w-20 rounded-lg" />
        <Skeleton className="h-16 w-20 rounded-lg" />
      </div>

      {/* Details sections */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-32 mt-4" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  )
}
