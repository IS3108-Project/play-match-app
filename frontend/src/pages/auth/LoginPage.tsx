import logo from "@/assets/logo.svg";
import { LoginForm } from "@/components/auth";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import * as React from "react";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const shownRef = React.useRef(false);

  React.useEffect(() => {
    if (searchParams.get("error") === "banned" && !shownRef.current) {
      shownRef.current = true;
      toast.error("Your account has been banned. Please contact support.");
      window.history.replaceState({}, "", "/login");
    }
  }, []);

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
