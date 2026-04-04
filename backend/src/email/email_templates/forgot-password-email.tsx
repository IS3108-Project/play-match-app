import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface ForgotPasswordEmailProps {
  username: string;
  email: string;
  resetUrl: string;
}

const ForgotPasswordEmail = (props: ForgotPasswordEmailProps) => {
  const { username, email, resetUrl } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Reset your PlayMatch password</Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[580px] mx-auto">
            {/* Header with Logo */}
            <Section className="rounded-t-[8px] px-[32px] py-[24px]" style={{ backgroundColor: "#3E25F8" }}>
              <Heading className="text-white text-[24px] font-bold m-0 text-center">
                🔐 Password Reset Request
              </Heading>
            </Section>

            {/* Main Content */}
            <Section className="px-[32px] py-[32px]">
              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                Hi {username || "there"},
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                We received a request to reset the password for your PlayMatch account
                associated with <strong>{email}</strong>.
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[32px]">
                Click the button below to reset your password. This link will
                expire in 24 hours for security reasons.
              </Text>

              {/* Reset Button */}
              <Section className="text-center mb-[32px]">
                <Button
                  href={resetUrl}
                  className="text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border inline-block"
                  style={{ backgroundColor: "#3E25F8" }}
                >
                  Reset Password
                </Button>
              </Section>

              <Text className="text-gray-600 text-[14px] leading-[20px] mb-[24px]">
                If the button above doesn&apos;t work, copy and paste this link
                into your browser:
              </Text>

              <Text className="text-[14px] leading-[20px] mb-[32px] break-all" style={{ color: "#3E25F8" }}>
                <Link href={resetUrl} style={{ color: "#3E25F8" }} className="underline">
                  {resetUrl}
                </Link>
              </Text>

              <Section className="bg-gray-50 rounded-[8px] px-[24px] py-[20px] mb-[24px]">
                <Text className="text-gray-800 text-[14px] font-semibold m-0 mb-[8px]">
                  ⚠️ Security Notice
                </Text>
                <Text className="text-gray-600 text-[14px] leading-[20px] m-0 mb-[4px]">
                  • If you didn&apos;t request this reset, you can safely ignore this email
                </Text>
                <Text className="text-gray-600 text-[14px] leading-[20px] m-0 mb-[4px]">
                  • This link expires in 24 hours
                </Text>
                <Text className="text-gray-600 text-[14px] leading-[20px] m-0">
                  • Never share this link with anyone
                </Text>
              </Section>

              <Text className="text-gray-800 text-[16px] leading-[24px]">
                Happy playing! 🏸
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

export default ForgotPasswordEmail;
