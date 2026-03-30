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

interface AttendanceReminderEmailProps {
  userName: string;
  activityName: string;
  activityDate: string;
  activityLocation: string;
  urgency: "first" | "final";
}

export default function AttendanceReminderEmail({
  userName,
  activityName,
  activityDate,
  activityLocation,
  urgency,
}: AttendanceReminderEmailProps) {
  const isFinal = urgency === "final";

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>
          {isFinal
            ? `Last chance to mark attendance for ${activityName}`
            : `Don't forget to mark attendance for ${activityName}`}
        </Preview>
        <Body className="bg-gray-100 py-[40px] font-sans">
          <Container className="mx-auto max-w-[580px] rounded-[8px] bg-white shadow-sm">
            <Section className="rounded-t-[8px] bg-orange-500 px-[32px] py-[24px]">
              <Heading className="m-0 text-center text-[24px] font-bold text-white">
                {isFinal ? "Final Attendance Reminder" : "Mark Attendance"}
              </Heading>
            </Section>
            <Section className="px-[32px] py-[32px]">
              <Text className="mb-[24px] text-[16px] leading-[24px] text-gray-800">
                Hi {userName},
              </Text>
              <Text className="mb-[24px] text-[16px] leading-[24px] text-gray-800">
                Please update attendance for <strong>{activityName}</strong>.
                {isFinal
                  ? " The attendance window will close soon."
                  : " Your participants are waiting on you."}
              </Text>
              <Section className="mb-[32px] rounded-[8px] bg-gray-50 px-[24px] py-[20px]">
                <Text className="m-0 mb-[8px] text-[14px] font-semibold text-gray-800">
                  Activity Details
                </Text>
                <Text className="m-0 mb-[4px] text-[14px] leading-[20px] text-gray-600">
                  📅 {activityDate}
                </Text>
                <Text className="m-0 text-[14px] leading-[20px] text-gray-600">
                  📍 {activityLocation}
                </Text>
              </Section>
              <Text className="text-[16px] leading-[24px] text-gray-800">
                Thanks for keeping PlayMatch reliable.
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
