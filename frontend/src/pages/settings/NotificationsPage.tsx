import * as React from "react"
import { Switch } from "@/components/ui/switch"
import { useRole } from "@/hooks/useRole"
import { userApi } from "@/lib/api"
import { toast } from "sonner"

export default function NotificationsPage() {
  const { session } = useRole()
  const userId = session?.user?.id

  const [emailEnabled, setEmailEnabled] = React.useState(true)
  const [remindersEnabled, setRemindersEnabled] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!userId) return
    userApi.getProfile(userId).then((profile) => {
      setEmailEnabled(profile.emailNotificationsEnabled)
      setRemindersEnabled(profile.activityRemindersEnabled)
    }).catch(() => {})
  }, [userId])

  const handleToggle = async (field: "emailNotificationsEnabled" | "activityRemindersEnabled", value: boolean) => {
    if (field === "emailNotificationsEnabled") setEmailEnabled(value)
    else setRemindersEnabled(value)
    setSaving(true)
    try {
      await userApi.updateProfile({ [field]: value })
    } catch {
      toast.error("Failed to save preference")
      if (field === "emailNotificationsEnabled") setEmailEnabled(!value)
      else setRemindersEnabled(!value)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl border bg-card px-6 py-4 shadow-sm">
      <div className="grid gap-2">
        <div className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm">
          <div>
            <span className="font-medium">Email updates</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              If toggled off, you will not receive any email notifications.
            </p>
          </div>
          <Switch
            checked={emailEnabled}
            onCheckedChange={(v) => handleToggle("emailNotificationsEnabled", v)}
            disabled={saving}
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm">
          <div>
            <span className="font-medium">Activity reminders</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              If toggled off, you won't receive 24-hour reminder emails before activities.
            </p>
          </div>
          <Switch
            checked={remindersEnabled}
            onCheckedChange={(v) => handleToggle("activityRemindersEnabled", v)}
            disabled={saving}
          />
        </div>
      </div>
    </div>
  )
}
