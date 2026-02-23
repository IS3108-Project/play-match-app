// waitlist-email.tsx
// Sent to a waitlisted user when a confirmed participant drops out and a spot opens up.
// This is a time-sensitive email — the user should act fast before someone else takes the spot.

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

interface WaitlistEmailProps {
  userName: string;
  activityName: string;
  activityDate: string;
  activityLocation: string;
  activityUrl: string; // link to the activity page so user can quickly claim the spot
}

const WaitlistEmail = ({
  userName,
  activityName,
  activityDate,
  activityLocation,
  activityUrl,
}: WaitlistEmailProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />

        <Preview>A spot just opened up for {activityName} — grab it now!</Preview>

        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[580px] mx-auto">

            {/* Blue header — exciting news, not an error */}
            <Section className="bg-blue-600 rounded-t-[8px] px-[32px] py-[24px]">
              <Heading className="text-white text-[24px] font-bold m-0 text-center">
                A Spot Just Opened Up! 🎟️
              </Heading>
            </Section>

            <Section className="px-[32px] py-[32px]">
              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                Hi {userName},
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                Good news! A spot just became available for{" "}
                <strong>{activityName}</strong> that you were waitlisted for.
                Act fast — spots fill up quickly!
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

              {/* CTA button — links to the activity page */}
              <Section className="text-center mb-[32px]">
                <Button
                  href={activityUrl}
                  className="bg-blue-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border inline-block"
                >
                  Claim Your Spot
                </Button>
              </Section>

              <Text className="text-gray-600 text-[14px] leading-[20px] mb-[24px]">
                If you no longer wish to join, you can ignore this email.
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px]">
                See you on the court!
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

export default WaitlistEmail;
