import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aspirants Adda – Community for Govt Job Seekers | Rojgar Suvidha",
  description: "Join Aspirants Adda – Rojgar Suvidha's live community for government job aspirants. Ask questions, share tips, discuss SSC, UPSC, Railway exam strategies with thousands of fellow students.",
  alternates: { canonical: "https://www.rojgarsuvidha.com/community" },
  openGraph: {
    title: "Aspirants Adda Community – Rojgar Suvidha",
    description: "Connect with thousands of Sarkari Naukri aspirants. Ask questions, share tips and discuss government job exams on Rojgar Suvidha community.",
    url: "https://www.rojgarsuvidha.com/community",
  },
  keywords: ["sarkari naukri community", "government job aspirants", "exam discussion", "aspirants adda"],
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
