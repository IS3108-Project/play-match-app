// change-alert-email.tsx
// Sent to all confirmed participants when an activity is updated or cancelled.
// Covers 3 scenarios, controlled by the `changeType` prop:
//   "time"      — the organiser changed the date/time
//   "location"  — the organiser changed the venue
//   "cancelled" — the organiser cancelled the activity entirely

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface ChangeAlertEmailProps {
  userName: string;
  activityName: string;
  changeType: "time" | "location" | "cancelled";
  oldValue?: string | undefined; // explicitly allow undefined (required by exactOptionalPropertyTypes)
  newValue?: string | undefined;
}

const ChangeAlertEmail = ({
  userName,
  activityName,
  changeType,
  oldValue,
  newValue,
}: ChangeAlertEmailProps) => {

  // Build different text content depending on what changed.
  // This keeps one template flexible instead of 3 separate files.
  const isCancelled = changeType === "cancelled";

  const headingText = isCancelled
    ? "Activity Cancelled"
    : `Activity Update: ${changeType === "time" ? "New Time" : "New Location"}`;

  const previewText = isCancelled
    ? `${activityName} has been cancelled`
    : `${activityName} has a new ${changeType}`;

  const bodyText = isCancelled
    ? `Unfortunately, <strong>${activityName}</strong> has been cancelled by the organiser. We're sorry for the inconvenience.`
    : `The <strong>${changeType}</strong> for <strong>${activityName}</strong> has been updated.`;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>{previewText}</Preview>

        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[580px] mx-auto">

            {/* Red header for alerts — signals something important has changed */}
            <Section className="bg-red-500 rounded-t-[8px] px-[32px] py-[24px]">
              <Heading className="text-white text-[24px] font-bold m-0 text-center">
                {headingText}
              </Heading>
            </Section>

            <Section className="px-[32px] py-[32px]">
              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                Hi {userName},
              </Text>

              {/* dangerouslySetInnerHTML is not how React Email works — use Text with content */}
              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                {isCancelled
                  ? `Unfortunately, ${activityName} has been cancelled by the organiser. We're sorry for the inconvenience.`
                  : `The ${changeType} for ${activityName} has been updated. Please take note of the changes below.`}
              </Text>

              {/* Only show the before/after box if it's NOT a cancellation */}
              {!isCancelled && oldValue && newValue && (
                <Section className="bg-gray-50 rounded-[8px] px-[24px] py-[20px] mb-[32px]">
                  <Text className="text-gray-800 text-[14px] font-semibold m-0 mb-[12px]">
                    What Changed
                  </Text>
                  <Text className="text-gray-500 text-[14px] leading-[20px] m-0 mb-[4px]">
                    ❌ Before: <span className="line-through">{oldValue}</span>
                  </Text>
                  <Text className="text-green-600 text-[14px] leading-[20px] m-0">
                    ✅ Now: {newValue}
                  </Text>
                </Section>
              )}

              <Text className="text-gray-800 text-[16px] leading-[24px]">
                {isCancelled
                  ? "We hope to see you at another activity soon."
                  : "Please make sure you're updated on these changes."}
                <br />
                <br />
                The PlayMatch Team
              </Text>
            </Section>

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

export default ChangeAlertEmail;
