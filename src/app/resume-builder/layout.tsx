import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Resume Builder 2025 — Sarkari Job Resume Banayein | Rojgar Suvidha",
  description: "Free AI-powered resume builder for government job aspirants. Create a professional resume for SSC, Railway, Banking, Police, UPSC in minutes. Download PDF instantly.",
  keywords: [
    "free resume builder", "ai resume maker", "sarkari job resume", "government job resume",
    "SSC resume format", "Railway resume", "resume kaise banaye", "resume builder hindi",
    "resume maker online free", "professional resume India 2025", "rojgar suvidha resume"
  ],
  openGraph: {
    title: "Free AI Resume Builder — Sarkari Job Resume | Rojgar Suvidha",
    description: "AI se seconds mein professional government job resume banayein. Free PDF download.",
    type: "website",
  },
  alternates: { canonical: "https://www.rojgarsuvidha.com/resume-builder" },
};

export default function ResumeBuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
