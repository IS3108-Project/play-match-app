import { Navigate, Outlet } from "react-router";
import { authClient } from "@/lib/client-auth";
import { Spinner } from "@/components/ui/spinner";
import Navbar from "@/components/navbar/Navbar";

export default function AdminLayout() {
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

  if (session.user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}
