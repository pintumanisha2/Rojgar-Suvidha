import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "File a Complaint – Rojgar Suvidha | Report Issues",
  description: "File a complaint or report an issue with Rojgar Suvidha. We take all complaints seriously and strive to resolve them promptly. Your feedback helps us serve you better.",
  alternates: { canonical: "https://www.rojgarsuvidha.com/complaint" },
  openGraph: {
    title: "File a Complaint – Rojgar Suvidha",
    description: "Report issues or complaints about government job information on Rojgar Suvidha. We resolve all issues promptly.",
    url: "https://www.rojgarsuvidha.com/complaint",
  },
};

export default function ComplaintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
