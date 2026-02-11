import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
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
        <Preview>Reset your password - Action required</Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] shadow-sm max-w-[580px] mx-auto">
            {/* Header */}
            <Section className="bg-blue-600 rounded-t-[8px] px-[32px] py-[24px]">
              <Heading className="text-white text-[24px] font-bold m-0 text-center">
                Password Reset Request
              </Heading>
            </Section>

            {/* Main Content */}
            <Section className="px-[32px] py-[32px]">
              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                Hello {email},
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[24px]">
                We received a request to reset the password for your account
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
                  className="bg-blue-600 text-white px-[32px] py-[16px] rounded-[8px] text-[16px] font-semibold no-underline box-border inline-block"
                >
                  Reset Password
                </Button>
              </Section>

              <Text className="text-gray-600 text-[14px] leading-[20px] mb-[24px]">
                If the button above doesn&apos;t work, copy and paste this link
                into your browser:
              </Text>

              <Text className="text-blue-600 text-[14px] leading-[20px] mb-[32px] break-all">
                <Link href={resetUrl} className="text-blue-600 underline">
                  {resetUrl}
                </Link>
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[16px]">
                <strong>Important security information:</strong>
              </Text>

              <Text className="text-gray-600 text-[14px] leading-[20px] mb-[8px]">
                • If you didn&apos;t request this password reset, please ignore
                this email
              </Text>
              <Text className="text-gray-600 text-[14px] leading-[20px] mb-[8px]">
                • This link will expire in 24 hours
              </Text>
              <Text className="text-gray-600 text-[14px] leading-[20px] mb-[24px]">
                • For security, this request was made from IP address and
                timestamp are logged
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px] mb-[8px]">
                Need help? Contact our support team.
              </Text>

              <Text className="text-gray-800 text-[16px] leading-[24px]">
                Best regards,
                <br />
                The Security Team
              </Text>
            </Section>

            {/* Footer */}
            <Section className="bg-gray-50 px-[32px] py-[24px] rounded-b-[8px] border-t border-gray-200">
              <Text className="text-gray-500 text-[12px] leading-[16px] text-center m-0">
                © 2026 Your Company Name. All rights reserved.
              </Text>
              <Text className="text-gray-500 text-[12px] leading-[16px] text-center m-0 mt-[8px]">
                123 Business Street, Singapore 123456
              </Text>
              <Text className="text-gray-500 text-[12px] leading-[16px] text-center m-0 mt-[8px]">
                <Link href="#" className="text-gray-500 underline">
                  Unsubscribe
                </Link>{" "}
                |
                <Link href="#" className="text-gray-500 underline ml-[8px]">
                  Privacy Policy
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ForgotPasswordEmail;
