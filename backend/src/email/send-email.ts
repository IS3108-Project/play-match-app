// send-email.ts
// This is a shared utility (helper) that wraps the Resend library.
// Instead of setting up Resend in every file that needs to send an email,
// we set it up ONCE here and export a single `sendEmail()` function.
// Any service file that needs to send an email just imports this function.

import { Resend } from "resend";
import { ReactElement } from "react";
import { env } from "../config/env";

// Create ONE Resend instance for the whole app.
// `env.RESEND_API_KEY` comes from your .env file — it authenticates
// your app with Resend's servers so they know who is sending the email.
const resend = new Resend(env.RESEND_API_KEY);

// This interface defines the "shape" of the argument you pass to sendEmail().
interface SendEmailOptions {
  to: string | string[]; // one email address, or an array of addresses
  subject: string;       // the email subject line
  react: ReactElement;   // the email template (a React component like rsvp-confirmation-email.tsx)
}

// The main function other files will import and call.
// `async` because sending an email involves a network request — it takes time.
// It returns the result from Resend (contains an id if successful, or an error).
export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const { data, error } = await resend.emails.send({
    from: "PlayMatch <onboarding@resend.dev>", // sender address shown in the inbox
    to,                                          // recipient(s)
    subject,                                     // email subject
    react,                                       // Resend renders this React component into HTML
  });

  // If Resend returned an error, throw it so the calling service knows something went wrong.
  // This is standard Node.js error handling — throw here, catch in the service.
  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
