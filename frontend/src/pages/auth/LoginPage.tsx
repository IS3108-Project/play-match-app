import logo from "@/assets/logo.svg";
import { LoginForm } from "@/components/auth";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center">
        <img src={logo} alt="PlayMatch" className="mx-auto h-8" />
        <h1 className="mt-6 text-4xl font-bold">
          <span className="text-foreground">Don't train</span>{" "}
          <span className="text-primary">alone.</span>
        </h1>
        <p className="mt-6 text-muted-foreground">
          The social marketplace for fitness. Find reliable partners for any
          sports in Singapore.
        </p>
      </div>

      {/* Login Form */}
      <LoginForm />
    </div>
  );
}
