import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { BetterAuthClientPlugin } from "better-auth/client";
import { onboardingClient } from "@better-auth-extended/onboarding/client";

const onboarding = onboardingClient({
  onOnboardingRedirect: () => {
    if (window.location.pathname !== "/onboarding") {
      window.location.href = "/onboarding";
    }
  },
}) as unknown as BetterAuthClientPlugin;

export const authClient = createAuthClient({
  baseURL: "http://localhost:3000",
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          input: false,
        },
        shouldOnboard: {
          type: "boolean",
          input: false,
        },
      },
    }),
    onboarding,
  ],
});
