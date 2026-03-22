// cancelled-activity-email.tsx
// Sent to all participants (CONFIRMED, PENDING, WAITLISTED) when a host cancels an activity.

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

interface CancelledActivityEmailProps {
  userName: string;
  activityName: string;
  activityDate: string;
  activityLocation: string;
}

const CancelledActivityEmail = ({
  userName,
  activityName,
  activityDate,
  activityLocation,
}: CancelledActivityEmailProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>{activityName} has been cancelled</Preview>

        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[580px] mx-auto">

            {/* Red header — signals cancellation */}
            <Section className="bg-red-500 rounded-t-[8px] px-[32px] py-[24px]">
              <Heading className="text-white text-[24px] font-bold m-0 text-center">
                Activity Cancelled
              </Heading>
            </Section>

            <Section className="px-[32px] py-[32px]">
              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                Hi {userName},
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                Unfortunately, <strong>{activityName}</strong> has been cancelled by the organiser.
                We&apos;re sorry for the inconvenience.
              </Text>

              {/* Activity details so the user knows which event this refers to */}
              <Section className="bg-gray-50 rounded-[8px] px-[24px] py-[20px] mb-[32px]">
                <Text className="text-gray-800 text-[14px] font-semibold m-0 mb-[8px]">
                  Cancelled Activity
                </Text>
                <Text className="text-gray-600 text-[14px] leading-[20px] m-0 mb-[4px]">
                  📅 {activityDate}
                </Text>
                <Text className="text-gray-600 text-[14px] leading-[20px] m-0">
                  📍 {activityLocation}
                </Text>
              </Section>

              <Text className="text-gray-800 text-[16px] leading-[24px]">
                We hope to see you at another activity soon.
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

export default CancelledActivityEmail;
