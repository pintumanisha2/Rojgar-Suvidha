import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sarkari Job Eligibility Calculator 2026 | Age & Qualification Matcher – Rojgar Suvidha",
  description:
    "Check your eligibility for thousands of Government Jobs in 2026. Calculate your age, select your qualification & category to instantly find matching Sarkari Naukri vacancies.",
  keywords: [
    "sarkari job eligibility calculator", "government job age calculator",
    "10th pass govt jobs 2026", "12th pass government jobs",
    "graduate govt jobs matcher", "sarkari naukri eligibility check",
    "rojgar suvidha eligibility tool",
  ],
  alternates: { canonical: "https://www.rojgarsuvidha.com/eligibility" },
  openGraph: {
    title: "Sarkari Job Eligibility Calculator 2026 – Rojgar Suvidha",
    description: "Instantly check which Sarkari jobs you qualify for based on age, category, and qualification.",
    url: "https://www.rojgarsuvidha.com/eligibility",
    type: "website",
    siteName: "Rojgar Suvidha",
    images: [{ url: "https://www.rojgarsuvidha.com/og-image.png", width: 1200, height: 630 }],
  },
};

export default function EligibilityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
