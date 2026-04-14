import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, APIError } from "better-auth/api";
import {
  onboarding,
  createOnboardingStep,
} from "@better-auth-extended/onboarding";
import { z } from "zod";
import { env } from "./env";
import { prisma } from "./prisma";
import { Resend } from "resend";
import ForgotPasswordEmail from "../email/email_templates/forgot-password-email";

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
      sportInterests: {
        type: "string[]",
        input: false,
      },
      skillLevel: {
        type: "string",
        input: false,
      },
      preferredTimes: {
        type: "string[]",
        input: false,
      },
      preferredAreas: {
        type: "string[]",
        input: false,
      },
      locationSharingEnabled: {
        type: "boolean",
        input: false,
      },
      bio: {
        type: "string",
        input: false,
      },
      matchRadius: {
        type: "number",
        input: false,
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const isSignIn =
        ctx.path.startsWith("/callback") ||
        ctx.path === "/sign-in/email" ||
        ctx.path === "/sign-in/social";

      if (!isSignIn) return;

      const newSession = ctx.context.newSession;
      if (!newSession) return;

      const user = await prisma.user.findUnique({
        where: { id: newSession.user.id },
        select: { banned: true },
      });

      if (!user?.banned) return;

      // Delete the session so the banned user can't use it
      await prisma.session.delete({
        where: { id: newSession.session.id },
      }).catch(() => {});

      // OAuth callbacks need a redirect; API calls need a JSON error
      if (ctx.path.startsWith("/callback")) {
        throw ctx.redirect("http://localhost:5173/login?error=banned");
      }

      throw new APIError("FORBIDDEN", {
        message: "Your account has been banned. Please contact support.",
      });
    }),
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
        locationSharing: createOnboardingStep({
          input: z.object({
            locationSharingEnabled: z.boolean(),
          }),
          async handler(ctx) {
            await prisma.user.update({
              where: { id: ctx.context.session!.user.id },
              data: { locationSharingEnabled: ctx.body.locationSharingEnabled },
            });
          },
          required: false,
          once: false,
        }),
      },
      completionStep: "locationSharing",
    }),
  ],
  trustedOrigins: ["http://localhost:5173"],
});
