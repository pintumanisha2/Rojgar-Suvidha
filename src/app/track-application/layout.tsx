import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Application – Rojgar Suvidha | Check Your Form Status",
  description: "Track your government job application status on Rojgar Suvidha. Enter your reference number to check SSC, Railway, Banking, and other Sarkari Naukri form submission status.",
  alternates: { canonical: "https://www.rojgarsuvidha.com/track-application" },
  openGraph: {
    title: "Track Application Status – Rojgar Suvidha",
    description: "Check the status of your government job application on Rojgar Suvidha.",
    url: "https://www.rojgarsuvidha.com/track-application",
  },
  keywords: ["track application", "sarkari form status", "government job application tracker", "form status check"],
};

export default function TrackApplicationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
