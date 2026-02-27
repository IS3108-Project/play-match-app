export default function NotificationsPage() {
  return (
    <div className="rounded-3xl border bg-card px-6 py-4 shadow-sm">
      <div className="grid gap-2">
        {/* TODO: add more notification settings */}
        {["Push notifications", "Email updates", "Activity reminders"].map(
          (label) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-2xl px-4 py-2 text-sm"
            >
              {/* TODO: Add toggle switch (FE) */}
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground">Off</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
