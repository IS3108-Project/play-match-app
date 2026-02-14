import { authClient } from "@/lib/client-auth";

export function useRole() {
  const { data: session, isPending } = authClient.useSession();

  return {
    role: session?.user?.role,
    isAdmin: session?.user?.role === "ADMIN",
    isUser: session?.user?.role === "USER",
    isPending,
    session,
  };
}
