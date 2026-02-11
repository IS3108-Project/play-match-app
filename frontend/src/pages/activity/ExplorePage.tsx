export default function ExplorePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Find Your Activity</h1>
        <p className="mt-2 text-muted-foreground">
          Join local activities organized by the community
        </p>
      </div>

      {/* Search Bar Placeholder */}
      <div className="mb-8 flex gap-4 rounded-lg border p-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">What do you wanna do?</p>
          <p>e.g. Badminton, Yoga, Running</p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Location</p>
          <p>e.g. Yishun, Woodlands</p>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">When</p>
          <p>Select Date & Time</p>
        </div>
      </div>

      {/* Activities Grid Placeholder */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border p-4">
            <span className="inline-block rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
              RUNNING
            </span>
            <h3 className="mt-2 font-semibold">Morning Jog at MacRitchie!</h3>
            <p className="text-sm text-muted-foreground">MacRitchie Reservoir</p>
            <p className="text-sm text-muted-foreground">Saturday, Feb 8, 2026</p>
            <p className="mt-2 text-sm">
              12 / 20 joined · <span className="text-primary">8 spots left</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}