import { Metadata } from "next";

export const metadata: Metadata = {
  title: "e-Suvidha Portal - Apply Online PAN, Voter ID, Passport & More | Rojgar Suvidha",
  description: "Apply online for PAN Card, Voter ID, E-Shram, Passport, MSME, PCC, and ITR. India's safest digital cyber cafe alternative with expert form filling at lowest fees.",
  keywords: "online sarkari praman patra, apply online for PAN card, digital cyber cafe, online form filling service, e-suvidha, rojgar suvidha, online admission form, online MSME registration, online PCC apply",
  openGraph: {
    title: "e-Suvidha Portal - India's First Digital Cyber Cafe",
    description: "Skip the cyber cafe line. Apply for any government certificate online directly from your phone with 100% accuracy.",
    url: "https://rojgarsuvidha.com/e-suvidha",
    siteName: "Rojgar Suvidha",
    locale: "en_IN",
    type: "website",
  }
};

export default function ESuvidhaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
