import type { Metadata } from "next";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "Free AI Resume Builder 2026 | Create ATS-Friendly CV in Minutes",
  description: "Create a professional, ATS-friendly resume for private jobs and MNCs using our free AI Resume Builder. Download PDF instantly without any login.",
  keywords: [
    "ai resume builder", "free resume maker", "ats friendly resume", 
    "cv maker online", "resume for freshers", "resume for private jobs", 
    "professional cv", "rojgar suvidha resume"
  ],
  alternates: { canonical: `${BASE_URL}/private-jobs/resume-builder` },
  openGraph: {
    title: "Free AI Resume Builder 2026 | Create ATS-Friendly CV",
    description: "Build a high-impact, professional resume instantly. Optimized for HR systems and Applicant Tracking Systems (ATS).",
    url: `${BASE_URL}/private-jobs/resume-builder`,
    type: "website",
    siteName: "Rojgar Suvidha",
  },
};

export default function ResumeBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
