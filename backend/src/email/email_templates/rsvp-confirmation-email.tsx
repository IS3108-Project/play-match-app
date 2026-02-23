// rsvp-confirmation-email.tsx
// Sent to a user immediately after they successfully RSVP to an activity.
// Example: "You're confirmed for Morning Jog on 25 Feb 2026 at MacRitchie Reservoir!"
//
// HOW REACT EMAIL WORKS:
// Instead of writing raw HTML (which is notoriously difficult for emails),
// we write JSX (React components) and Resend converts it to email-safe HTML.
// The components like <Body>, <Section>, <Text> come from @react-email/components
// and map to HTML elements that render correctly across all email clients (Gmail, Outlook, etc.)

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

// The props this template expects — whoever calls this must pass all these fields.
// This is the "contract" between your service and the template.
interface RsvpConfirmationEmailProps {
  userName: string;      // e.g. "Jordan"
  activityName: string;  // e.g. "Morning Jog at MacRitchie"
  activityDate: string;  // e.g. "Saturday, 25 Feb 2026, 7:00 AM" (pre-formatted string)
  activityLocation: string; // e.g. "MacRitchie Reservoir Park"
}

// The component itself — a function that takes the props and returns JSX (the email layout)
const RsvpConfirmationEmail = ({
  userName,
  activityName,
  activityDate,
  activityLocation,
}: RsvpConfirmationEmailProps) => {
  return (
    // <Html> is the root element of every email
    <Html lang="en" dir="ltr">
      {/* <Tailwind> lets us use Tailwind CSS class names inside the email */}
      <Tailwind>
        <Head />

        {/* <Preview> is the short text shown in the inbox BEFORE opening the email */}
        <Preview>You&apos;re confirmed for {activityName}!</Preview>

        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[580px] mx-auto">

            {/* Green header bar — green signals success/confirmation */}
            <Section className="bg-green-600 rounded-t-[8px] px-[32px] py-[24px]">
              <Heading className="text-white text-[24px] font-bold m-0 text-center">
                You&apos;re Confirmed! 🎉
              </Heading>
            </Section>

            {/* Main content */}
            <Section className="px-[32px] py-[32px]">
              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                Hi {userName},
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                You&apos;re all set! Your spot for <strong>{activityName}</strong> has been confirmed.
              </Text>

              {/* Activity details box */}
              <Section className="bg-gray-50 rounded-[8px] px-[24px] py-[20px] mb-[32px]">
                <Text className="text-gray-800 text-[14px] font-semibold m-0 mb-[8px]">
                  Activity Details
                </Text>
                <Text className="text-gray-600 text-[14px] leading-[20px] m-0 mb-[4px]">
                  📅 {activityDate}
                </Text>
                <Text className="text-gray-600 text-[14px] leading-[20px] m-0">
                  📍 {activityLocation}
                </Text>
              </Section>

              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[8px]">
                Best regards,
                <br />
                The PlayMatch Team
              </Text>
            </Section>

            {/* Footer */}
            <Section className="bg-gray-50 px-[32px] py-[20px] rounded-b-[8px] border-t border-gray-200">
              <Text className="text-gray-500 text-[12px] text-center m-0">
                © 2026 PlayMatch. Find your perfect sports partner in Singapore.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default RsvpConfirmationEmail;
