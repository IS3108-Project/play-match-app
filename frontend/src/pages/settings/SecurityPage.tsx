export default function SecurityPage() {
  return (
    <div className="rounded-3xl border bg-card px-6 py-4 shadow-sm">
      <div className="rounded-2xl bg-muted/40 px-4 text-sm">
        {/* TODO: add more security settings */}
        <div className="font-medium">Password</div>
        <div className="text-muted-foreground">Last updated: 3 months ago</div>
      </div>
    </div>
  );
}
