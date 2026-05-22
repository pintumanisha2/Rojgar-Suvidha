import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Candidate Dashboard | Rojgar Suvidha",
  description: "Manage your private job applications, ATS score, and mock interviews.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
