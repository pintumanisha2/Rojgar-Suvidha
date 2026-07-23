import { Metadata } from "next";

export const metadata: Metadata = {
  title: "e-Suvidha Portal - Apply Online PAN, Voter ID, Certificates & Schemes | Rojgar Suvidha",
  description: "Apply online for PAN Card, Voter ID, Income, Caste & Domicile Certificates, E-Shram, Ayushman Card, MSME, PCC, and ITR. India's safest digital cyber cafe alternative with expert form filling at lowest fees.",
  keywords: "online pan card apply, voter id apply online, income certificate online apply, caste certificate online apply, domicile certificate online, character certificate apply online, eshram card registration, msme udyam registration online, driving learner license online, online form filling service, digital cyber cafe, e-suvidha kendra, passport online apply, pf withdrawal online, itr filing online, aay praman patra apply, jati praman patra online, niwas praman patra form",
  alternates: { canonical: "https://www.rojgarsuvidha.com/e-suvidha" },
  openGraph: {
    title: "e-Suvidha Portal - India's First Digital Cyber Cafe | Rojgar Suvidha",
    description: "Skip the cyber cafe line. Apply for PAN, Voter ID, caste, income, and domicile certificates online directly from your phone with 100% accuracy.",
    url: "https://www.rojgarsuvidha.com/e-suvidha",
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
