export default function PersonalInfoPage() {
  return (
    <div className="rounded-3xl border bg-card px-6 py-4 shadow-sm">
      <div className="rounded-2xl bg-muted/40 p-4 text-sm">
        {/* TODO: Add more settings */}
        <div className="font-medium">Name</div>
        <div className="font-medium">Email</div>
        <div className="font-medium">Phone Number</div>
        <div className="text-muted-foreground">John Doe</div>
      </div>
    </div>
  );
}
