import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface NoShowWarningEmailProps {
  userName: string;
  totalNoShows: number;
}

export default function NoShowWarningEmail({
  userName,
  totalNoShows,
}: NoShowWarningEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Warning: you've missed 5 activities</Preview>
        <Body className="bg-gray-100 py-[40px] font-sans">
          <Container className="mx-auto max-w-[580px] rounded-[8px] bg-white shadow-sm">
            <Section className="rounded-t-[8px] bg-red-500 px-[32px] py-[24px]">
              <Heading className="m-0 text-center text-[24px] font-bold text-white">
                Reliability Warning
              </Heading>
            </Section>
            <Section className="px-[32px] py-[32px]">
              <Text className="mb-[24px] text-[16px] leading-[24px] text-gray-800">
                Hi {userName},
              </Text>
              <Text className="mb-[24px] text-[16px] leading-[24px] text-gray-800">
                Our records show that you now have <strong>{totalNoShows}</strong>{" "}
                no-shows on PlayMatch.
              </Text>
              <Text className="text-[16px] leading-[24px] text-gray-800">
                Continued no-shows may affect your ability to join activities.
                Please only RSVP if you can attend.
                <br />
                <br />
                The PlayMatch Team
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
