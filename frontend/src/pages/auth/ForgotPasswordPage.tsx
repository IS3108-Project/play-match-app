import logo from "@/assets/logo.svg";
import { ForgotPasswordForm } from "@/components/auth";

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center">
        <img src={logo} alt="PlayMatch" className="mx-auto h-8" />
        <h1 className="mt-6 text-2xl font-bold">Reset your password</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      {/* Forgot Password Form */}
      <ForgotPasswordForm />
    </div>
  );
}
