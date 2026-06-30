import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Dashboard – Rojgar Suvidha | Manage Your Profile & Applications",
  description: "Manage your Rojgar Suvidha profile, track applications, view saved jobs, and access Apply For Me orders from your personal dashboard.",
  alternates: { canonical: "https://www.rojgarsuvidha.com/dashboard" },
  robots: { index: false, follow: false }, // User-specific page, don't index
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
