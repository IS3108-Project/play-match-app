import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { authClient } from "@/lib/client-auth"
import { useRole } from "@/hooks/useRole"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { Eye, EyeOff, KeyRound, Mail } from "lucide-react"

export default function SecurityPage() {
  const { session } = useRole()
  const userEmail = session?.user?.email

  const [hasCredentialAccount, setHasCredentialAccount] = React.useState<boolean | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Password change form
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [revokeOtherSessions, setRevokeOtherSessions] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [sendingReset, setSendingReset] = React.useState(false)

  // Check if user has a credential (email/password) account
  React.useEffect(() => {
    setLoading(true)
    authClient.listAccounts().then((result) => {
      const accounts = result.data ?? []
      const hasCredential = accounts.some((acc: { providerId: string }) => acc.providerId === "credential")
      setHasCredentialAccount(hasCredential)
    }).catch(() => {
      setHasCredentialAccount(false)
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match")
      return
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setSaving(true)
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      })

      if (result.error) {
        toast.error(result.error.message || "Failed to change password")
      } else {
        toast.success("Password changed successfully!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch {
      toast.error("Failed to change password")
    } finally {
      setSaving(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!userEmail) {
      toast.error("No email found")
      return
    }

    setSendingReset(true)
    try {
      const result = await authClient.requestPasswordReset({
        email: userEmail,
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (result.error) {
        toast.error(result.error.message || "Failed to send reset email")
      } else {
        toast.success("Password reset email sent! Check your inbox.")
      }
    } catch {
      toast.error("Failed to send reset email")
    } finally {
      setSendingReset(false)
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
        {/* Password Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Password</h3>
          </div>

          {hasCredentialAccount ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <label htmlFor="current-password" className="text-sm font-medium">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirm New Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>

              {/* Revoke other sessions */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Sign out other devices</p>
                  <p className="text-xs text-muted-foreground">
                    Log out from all other devices after changing password
                  </p>
                </div>
                <Switch
                  checked={revokeOtherSessions}
                  onCheckedChange={setRevokeOtherSessions}
                />
              </div>

              {/* Submit Button */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" disabled={saving}>
                  {saving && <Spinner className="size-4 mr-2" />}
                  Change Password
                </Button>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={sendingReset}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {sendingReset ? "Sending..." : "Forgot your password?"}
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <p className="text-sm">You signed in with Google</p>
              </div>
              <p className="text-sm text-muted-foreground">
                You don't have a password set. Click below to receive an email and set up password login.
              </p>
              <Button
                variant="outline"
                onClick={handleForgotPassword}
                disabled={sendingReset}
              >
                {sendingReset && <Spinner className="size-4 mr-2" />}
                Set up password
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
