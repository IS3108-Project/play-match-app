import { betterAuth } from "better-auth";
import { customSession, genericOAuth } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "./env";
import { prisma } from "./prisma";
import { Resend } from "resend";
import ForgotPasswordEmail from "../email/forgot-password-email";

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      resend.emails.send({
        from: "onboarding@resend.dev",
        to: user.email,
        subject: "Reset your password",
        react: ForgotPasswordEmail({
          username: user.name,
          resetUrl: url,
          email: user.email,
        }),
      });
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ["USER", "ADMIN"],
        input: false,
      },
    },
  },
  trustedOrigins: ["http://localhost:5173"],
});
