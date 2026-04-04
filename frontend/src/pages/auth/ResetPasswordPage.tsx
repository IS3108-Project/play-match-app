import logo from "@/assets/logo.svg";
import { ResetPasswordForm } from "@/components/auth";
import { ThemeToggle } from "@/components/navbar/ThemeToggle";

export default function ResetPasswordPage() {
  return (
    <div className="relative grid text-center h-screen place-items-center p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <img src={logo} alt="PlayMatch" className="mx-auto h-8" />
          <h1 className="mt-6 text-2xl font-bold">Set a new password</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        {/* Reset Password Form */}
        <ResetPasswordForm />
      </div>
    </div>
  );
}
