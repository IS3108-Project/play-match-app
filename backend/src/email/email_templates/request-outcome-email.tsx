// request-outcome-email.tsx
// Sent to a user when the host approves or rejects their join request.

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

interface RequestOutcomeEmailProps {
  userName: string;
  activityName: string;
  activityDate: string;
  activityLocation: string;
  outcome: "approved" | "rejected";
  rejectionNote?: string | undefined;
}

const RequestOutcomeEmail = ({
  userName,
  activityName,
  activityDate,
  activityLocation,
  outcome,
  rejectionNote,
}: RequestOutcomeEmailProps) => {
  const isApproved = outcome === "approved";

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>
          {isApproved
            ? `Your request to join ${activityName} was approved!`
            : `Your request to join ${activityName} was not accepted`}
        </Preview>

        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[580px] mx-auto">

            {/* Green for approved, red for rejected */}
            <Section
              className={`${isApproved ? "bg-green-600" : "bg-red-500"} rounded-t-[8px] px-[32px] py-[24px]`}
            >
              <Heading className="text-white text-[24px] font-bold m-0 text-center">
                {isApproved ? "You're In! 🎉" : "Request Declined"}
              </Heading>
            </Section>

            <Section className="px-[32px] py-[32px]">
              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                Hi {userName},
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                {isApproved
                  ? `Great news! Your request to join <strong>${activityName}</strong> has been approved. We'll see you there!`
                  : `Unfortunately, your request to join <strong>${activityName}</strong> was not accepted by the host.`}
              </Text>

              {/* Activity details */}
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

              {/* Show rejection note if the host provided one */}
              {!isApproved && rejectionNote && (
                <Section className="bg-gray-50 rounded-[8px] px-[24px] py-[20px] mb-[32px]">
                  <Text className="text-gray-800 text-[14px] font-semibold m-0 mb-[8px]">
                    Note from host
                  </Text>
                  <Text className="text-gray-600 text-[14px] leading-[20px] m-0">
                    {rejectionNote}
                  </Text>
                </Section>
              )}

              <Text className="text-gray-800 text-[16px] leading-[24px]">
                {isApproved
                  ? "See you on the court!"
                  : "We hope to see you at another activity soon."}
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

export default RequestOutcomeEmail;
