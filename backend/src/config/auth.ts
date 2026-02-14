import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  onboarding,
  createOnboardingStep,
} from "@better-auth-extended/onboarding";
import { z } from "zod";
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
      shouldOnboard: {
        type: "boolean",
        input: false,
      },
    },
  },
  plugins: [
    // @ts-expect-error
    onboarding({
      steps: {
        sportInterests: createOnboardingStep({
          input: z.object({
            sportInterests: z
              .array(z.string())
              .min(1, "Select at least one sport"),
          }),
          async handler(ctx) {
            await prisma.user.update({
              where: { id: ctx.context.session!.user.id },
              data: { sportInterests: ctx.body.sportInterests },
            });
          },
          required: true,
          once: true,
        }),
        skillLevel: createOnboardingStep({
          input: z.object({
            skillLevel: z.enum(["beginner", "intermediate", "advanced"]),
          }),
          async handler(ctx) {
            await prisma.user.update({
              where: { id: ctx.context.session!.user.id },
              data: { skillLevel: ctx.body.skillLevel },
            });
          },
          required: true,
          once: true,
        }),
        preferredTimes: createOnboardingStep({
          input: z.object({
            preferredTimes: z.array(z.string()).optional(),
          }),
          async handler(ctx) {
            await prisma.user.update({
              where: { id: ctx.context.session!.user.id },
              data: { preferredTimes: ctx.body.preferredTimes ?? [] },
            });
          },
          required: false,
          once: false,
        }),
        preferredAreas: createOnboardingStep({
          input: z.object({
            preferredAreas: z
              .array(z.enum(["North", "South", "East", "West", "Central"]))
              .optional(),
          }),
          async handler(ctx) {
            await prisma.user.update({
              where: { id: ctx.context.session!.user.id },
              data: { preferredAreas: ctx.body.preferredAreas ?? [] },
            });
          },
          required: false,
          once: false,
        }),
      },
      completionStep: "preferredAreas",
    }),
  ],
  trustedOrigins: ["http://localhost:5173"],
});
