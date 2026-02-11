// layouts/AuthLayout.tsx
import { Navigate, Outlet } from "react-router";
import { authClient } from "@/lib/client-auth";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { Monitor, Moon, Sun } from "lucide-react";

export default function AuthLayout() {
  const { data: session, isPending } = authClient.useSession();
  const { theme, setTheme } = useTheme();

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
      <div className="absolute top-4 right-4 flex gap-1">
        <Button
          variant={theme === "light" ? "default" : "ghost"}
          size="icon"
          onClick={() => setTheme("light")}
        >
          <Sun className="size-4" />
        </Button>
        <Button
          variant={theme === "dark" ? "default" : "ghost"}
          size="icon"
          onClick={() => setTheme("dark")}
        >
          <Moon className="size-4" />
        </Button>
        <Button
          variant={theme === "system" ? "default" : "ghost"}
          size="icon"
          onClick={() => setTheme("system")}
        >
          <Monitor className="size-4" />
        </Button>
      </div>

      <Outlet />
    </div>
  );
}
