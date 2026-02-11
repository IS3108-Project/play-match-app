import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/client-auth";

export function GoogleLogin() {
  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "http://localhost:5173",
    });
  };

  return (
    <Button onClick={handleGoogleLogin} variant="outline" className="w-full">
      Continue with Google
    </Button>
  );
}
