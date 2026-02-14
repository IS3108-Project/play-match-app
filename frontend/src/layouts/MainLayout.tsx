// layouts/MainLayout.tsx
import { Navigate, Outlet } from "react-router";
import { authClient } from "@/lib/client-auth";
import Navbar from "@/components/navbar/Navbar";
import { Spinner } from "@/components/ui/spinner";

export default function MainLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="grid h-screen place-items-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if user hasn't completed it
  if (session.user?.shouldOnboard) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}
