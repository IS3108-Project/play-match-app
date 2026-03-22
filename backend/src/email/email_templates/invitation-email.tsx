// invitation-email.tsx
// Sent to a user when a host invites them to join an activity via buddy matching.

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

interface InvitationEmailProps {
  inviteeName: string;
  hostName: string;
  activityName: string;
  activityDate: string;
  activityLocation: string;
}

const InvitationEmail = ({
  inviteeName,
  hostName,
  activityName,
  activityDate,
  activityLocation,
}: InvitationEmailProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>{hostName} invited you to join {activityName}</Preview>

        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[580px] mx-auto">

            {/* Blue header — exciting invite */}
            <Section className="bg-blue-600 rounded-t-[8px] px-[32px] py-[24px]">
              <Heading className="text-white text-[24px] font-bold m-0 text-center">
                You've Been Invited! 🎉
              </Heading>
            </Section>

            <Section className="px-[32px] py-[32px]">
              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                Hi {inviteeName},
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                <strong>{hostName}</strong> has invited you to join their activity{" "}
                <strong>{activityName}</strong>. Head to <strong>My Activities</strong> in the app to accept or decline the invitation.
              </Text>

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

export default InvitationEmail;
