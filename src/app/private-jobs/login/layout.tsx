import type { Metadata } from "next";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "Candidate Login | Rojgar Suvidha Private Jobs Portal",
  description: "Login to your Rojgar Suvidha Private Jobs dashboard. Manage your job applications, track ATS scores, and prepare for interviews.",
  robots: { index: true, follow: true },
  alternates: { canonical: `${BASE_URL}/private-jobs/login` },
  openGraph: {
    title: "Candidate Login | Rojgar Suvidha Private Jobs",
    description: "Sign in to apply for the latest private sector jobs, MNCs, and WFH opportunities.",
    url: `${BASE_URL}/private-jobs/login`,
    type: "website",
    siteName: "Rojgar Suvidha",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
