// invitation-outcome-email.tsx
// Sent to the host when an invitee accepts or declines their activity invitation.

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

interface InvitationOutcomeEmailProps {
  hostName: string;
  inviteeName: string;
  activityName: string;
  activityDate: string;
  outcome: "accepted" | "declined";
}

const InvitationOutcomeEmail = ({
  hostName,
  inviteeName,
  activityName,
  activityDate,
  outcome,
}: InvitationOutcomeEmailProps) => {
  const isAccepted = outcome === "accepted";

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>
          {isAccepted
            ? `${inviteeName} accepted your invitation to ${activityName}`
            : `${inviteeName} declined your invitation to ${activityName}`}
        </Preview>

        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[580px] mx-auto">

            {/* Green for accepted, red for declined */}
            <Section
              className={`${isAccepted ? "bg-green-600" : "bg-red-500"} rounded-t-[8px] px-[32px] py-[24px]`}
            >
              <Heading className="text-white text-[24px] font-bold m-0 text-center">
                {isAccepted ? "Invitation Accepted! 🎉" : "Invitation Declined"}
              </Heading>
            </Section>

            <Section className="px-[32px] py-[32px]">
              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                Hi {hostName},
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                {isAccepted
                  ? `Great news! ${inviteeName} has accepted your invitation to join ${activityName}.`
                  : `${inviteeName} has declined your invitation to join ${activityName}.`}
              </Text>

              <Section className="bg-gray-50 rounded-[8px] px-[24px] py-[20px] mb-[32px]">
                <Text className="text-gray-800 text-[14px] font-semibold m-0 mb-[8px]">
                  Activity Details
                </Text>
                <Text className="text-gray-600 text-[14px] leading-[20px] m-0 mb-[4px]">
                  🏃 {activityName}
                </Text>
                <Text className="text-gray-600 text-[14px] leading-[20px] m-0">
                  📅 {activityDate}
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

export default InvitationOutcomeEmail;
