import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply For Me – Rojgar Suvidha | Expert Govt Job Form Filling Service",
  description: "Tired of form filling errors? Rojgar Suvidha's 'Apply For Me' service lets our experts fill your government job application with 100% accuracy. Upload documents & relax. SSC, Railway, Bank, Police forms filled perfectly.",
  alternates: { canonical: "https://www.rojgarsuvidha.com/apply-for-me" },
  openGraph: {
    title: "Apply For Me – Expert Government Job Form Filling | Rojgar Suvidha",
    description: "Let Rojgar Suvidha experts fill your Sarkari Naukri application forms with 100% accuracy. SSC, Railway, Bank, Police jobs covered.",
    url: "https://www.rojgarsuvidha.com/apply-for-me",
  },
  keywords: ["apply for me", "form filling service", "sarkari form filling", "government job application help", "online form fill"],
};

export default function ApplyForMeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
