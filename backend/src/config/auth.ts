import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "./env";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "strava",
          clientId: env.STRAVA_CLIENT_ID,
          clientSecret: env.STRAVA_CLIENT_SECRET,
          authorizationUrl: "https://www.strava.com/oauth/authorize",
          tokenUrl: "https://www.strava.com/oauth/token",
          userInfoUrl: "https://www.strava.com/api/v3/athlete",
          scopes: ["activity:read_all, activity:write"],
          getUserInfo: async (tokens) => {
            const response = await fetch(
              "https://www.strava.com/api/v3/athlete",
              {
                headers: {
                  Authorization: `Bearer ${tokens.accessToken}`,
                },
              },
            );
            const profile = await response.json();

            const now = new Date();

            return {
              id: profile.id.toString(),
              image: profile.profile,
              name: `${profile.firstName} ${profile.lastName}`,
              emailVerified: false,
              createdAt: now,
              updatedAt: now,
            };
          },
        },
      ],
    }),
  ],
  trustedOrigins: ["http://localhost:5173"],
});
