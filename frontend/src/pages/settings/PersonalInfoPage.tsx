import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRole } from "@/hooks/useRole"
import { userApi } from "@/lib/api"
import { authClient } from "@/lib/client-auth"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

export default function PersonalInfoPage() {
  const { session } = useRole()
  const userId = session?.user?.id
  const userEmail = session?.user?.email

  const [name, setName] = React.useState("")
  const [bio, setBio] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!userId) return
    setLoading(true)
    userApi.getProfile(userId).then((profile) => {
      setName(profile.name ?? "")
      setBio(profile.bio ?? "")
    }).catch(() => {
      toast.error("Failed to load profile")
    }).finally(() => {
      setLoading(false)
    })
  }, [userId])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Use authClient.updateUser for name - this syncs the session automatically
      await authClient.updateUser({ name })
      // Use our API for bio (custom field not in better-auth)
      await userApi.updateProfile({ bio })
      toast.success("Profile updated!")
    } catch {
      toast.error("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border bg-card px-6 py-8 shadow-sm flex justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    )
  }

  return (
    <div className="rounded-3xl border bg-card px-6 py-4 shadow-sm">
      <div className="grid gap-6">
        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            value={userEmail ?? ""}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed here. Contact support if needed.
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others a bit about yourself..."
            rows={4}
            maxLength={180}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            {bio.length}/180 characters
          </p>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? <Spinner className="size-4 mr-2" /> : null}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
