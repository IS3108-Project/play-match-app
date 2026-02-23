// reminder-email.tsx
// Sent to all confirmed participants as a reminder before the activity starts.
// This same template is reused for BOTH the 24-hour and 1-hour reminders —
// we just pass a different `timeUntil` value (e.g. "24 hours" or "1 hour").

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

interface ReminderEmailProps {
  userName: string;
  activityName: string;
  activityDate: string;       // pre-formatted date string
  activityLocation: string;
  timeUntil: "24 hours" | "1 hour"; // controls the heading and preview text
}

const ReminderEmail = ({
  userName,
  activityName,
  activityDate,
  activityLocation,
  timeUntil,
}: ReminderEmailProps) => {
  // We build the heading text dynamically based on the timeUntil prop.
  // This is just a regular JavaScript ternary inside the component.
  const headingText =
    timeUntil === "1 hour"
      ? "Your activity starts in 1 hour! ⏰"
      : "Reminder: Activity tomorrow! 📅";

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />

        <Preview>
          Reminder: {activityName} is in {timeUntil}!
        </Preview>

        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[580px] mx-auto">

            {/* Orange header — matches PlayMatch's primary brand colour */}
            <Section className="bg-orange-500 rounded-t-[8px] px-[32px] py-[24px]">
              <Heading className="text-white text-[24px] font-bold m-0 text-center">
                {headingText}
              </Heading>
            </Section>

            <Section className="px-[32px] py-[32px]">
              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                Hi {userName},
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                Just a reminder that <strong>{activityName}</strong> is coming up
                in <strong>{timeUntil}</strong>. Get ready!
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

              <Text className="text-gray-800 text-[16px] leading-[24px]">
                See you there!
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

export default ReminderEmail;
