export default function UsersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="mt-2 text-muted-foreground">
          Manage users, view reports, and ban accounts
        </p>
      </div>

      {/* Users Table Placeholder */}
      <div className="rounded-lg border">
        <div className="p-4 border-b bg-muted/50">
          <h2 className="font-semibold">All Users</h2>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          {/* TODO: Implement users table */}
          <p>Users table coming soon...</p>
        </div>
      </div>
    </div>
  );
}
