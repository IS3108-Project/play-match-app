// layouts/AuthLayout.tsx
import { Navigate, Outlet } from "react-router";
import { authClient } from "@/lib/client-auth";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/navbar/ThemeToggle";

export default function AuthLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="grid h-screen place-items-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative grid text-center h-screen place-items-center p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Outlet />
    </div>
  );
}
