import type { Metadata } from "next";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "Contact Us | Rojgar Suvidha — Get Help & Support",
  description:
    "Contact Rojgar Suvidha for job-related queries, Apply For Me service support, technical assistance, and feedback. Reach us via email, phone, or our contact form.",
  keywords: [
    "contact rojgar suvidha", "rojgar suvidha support", "apply for me help",
    "sarkari naukri portal contact", "government job help", "rojgar suvidha email",
  ],
  openGraph: {
    title: "Contact Rojgar Suvidha | Help & Support",
    description:
      "Reach out to Rojgar Suvidha for job portal support, Apply For Me service queries, and more.",
    url: `${BASE_URL}/contact-us`,
    siteName: "Rojgar Suvidha",
    type: "website",
  },
  alternates: { canonical: `${BASE_URL}/contact-us` },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
