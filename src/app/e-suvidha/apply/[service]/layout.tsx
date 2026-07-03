import { Metadata } from "next";

const SERVICE_META_DB: Record<string, { title: string; description: string; keywords: string }> = {
  "apply-new-pan-card-online": {
    title: "New PAN Card Online Apply - Online Form Filling | Rojgar Suvidha",
    description: "Apply for a new PAN Card online from home. Fast, secure, and expert-verified form filling. Avoid cyber cafe lines and get your PAN card delivered.",
    keywords: "apply new pan card online, pan card form filling, online pan registration, pan card banaye online"
  },
  "pan-card-correction-online": {
    title: "PAN Card Correction Online - Change Name, DOB & Photo | Rojgar Suvidha",
    description: "Easily make corrections in your PAN card details online. Change name, date of birth, photo, signature, or father's name with expert assistance.",
    keywords: "pan card correction online, change name in pan card, pan card dob change online, correction in pan card"
  },
  "apply-new-voter-id-card": {
    title: "New Voter ID Card Online Apply - Registration Form | Rojgar Suvidha",
    description: "Apply online for a new Voter ID Card. Complete your registration process securely from your mobile device with expert form checking.",
    keywords: "apply new voter id online, voter card apply online, new voter card online application, voter id registration"
  },
  "order-aadhaar-pvc-card": {
    title: "Order Aadhaar PVC Card Online - Plastic Aadhaar Card | Rojgar Suvidha",
    description: "Order your official UIDAI Aadhaar PVC card online. Get a high-quality durable plastic Aadhaar card delivered directly to your address.",
    keywords: "order pvc aadhaar card online, uidai pvc card registration, pvc plastic card order online, official pvc card apply"
  },
  "apply-income-certificate-online": {
    title: "Apply Income Certificate Online - Aay Praman Patra | Rojgar Suvidha",
    description: "Online form filling service for State/Central Income Certificate. Apply online for Aay Praman Patra easily with required documents.",
    keywords: "apply income certificate online, aay praman patra apply online, state income certificate form, income certificate status"
  },
  "apply-caste-certificate-online": {
    title: "Apply Caste Certificate Online - Jati Praman Patra | Rojgar Suvidha",
    description: "Get your Caste Certificate (Jati Praman Patra) online. Hassle-free application submission with zero rejection rate guarantee.",
    keywords: "apply caste certificate online, jati praman patra online apply, state caste certificate registration, cast certificate form"
  },
  "apply-domicile-certificate-online": {
    title: "Apply Domicile Certificate Online - Niwas Praman Patra | Rojgar Suvidha",
    description: "Apply for Domicile/Residence Certificate (Niwas Praman Patra) online. Secure registration and swift expert verification.",
    keywords: "apply domicile certificate online, niwas praman patra apply online, residence certificate status, domicile certificate apply"
  },
  "apply-police-clearance-certificate-pcc": {
    title: "Police Clearance Certificate (PCC) Online Apply | Rojgar Suvidha",
    description: "Apply online for Police Clearance Certificate (PCC) and Character Certificate. Avoid mistakes in application with expert verification.",
    keywords: "police clearance certificate online apply, pcc apply online, character certificate online form, police verification apply"
  },
  "eshram-card-registration-online": {
    title: "E-Shram Card Registration Online - Shramik Card | Rojgar Suvidha",
    description: "Register online for E-Shram Card to avail government scheme benefits. Simple mobile registration with immediate assistance.",
    keywords: "eshram card registration online, e shram self registration, eshram card online apply, shramik card banaye"
  },
  "ayushman-bharat-card-apply": {
    title: "Ayushman Bharat Golden Card Online Apply | Rojgar Suvidha",
    description: "Apply for your Ayushman Bharat Health Card online. Check eligibility list and download your Golden Health Card easily.",
    keywords: "ayushman card apply online, pmjay golden card check list, download ayushman card online, health card registration"
  },
  "pf-withdrawal-claim-online": {
    title: "Online PF Withdrawal Form Filling (Form 31, 19, 10C) | Rojgar Suvidha",
    description: "EPFO PF withdrawal online application support. Expert guidance to file Form 31, 19, and 10C for full or partial PF claims with zero rejection.",
    keywords: "pf withdrawal online form 31, epfo pf withdrawal form 19, pf withdraw form 10c, epf online claim"
  },
  "msme-udyam-registration-online": {
    title: "MSME Udyam Registration Online - MSME Certificate | Rojgar Suvidha",
    description: "Register your business online for MSME Udyam Aadhaar and get your registration certificate. Easily avail government loan and subsidy benefits.",
    keywords: "msme udyam registration online, udyam certificate download online, udyam registration process, msme certificate"
  },
  "itr-filing-nil-return": {
    title: "ITR Filing Online (Nil Return) - Income Tax Return | Rojgar Suvidha",
    description: "File your Nil Income Tax Return (ITR) online. Quick tax return submission support for students, freshers, and small business owners.",
    keywords: "online itr filing nil return, income tax return filing, itr-1 form filling online, file nil tax return"
  },
  "download-admit-card-result": {
    title: "Admit Card / Exam Result Download Service | Rojgar Suvidha",
    description: "Struggling to download your exam admit card or check result? Get instant print/PDF download of your admit cards and results directly to your WhatsApp.",
    keywords: "download admit card online, check result online portal, exam admit card downloader, sarkari result download"
  },
  "professional-resume-cv-maker": {
    title: "Professional Resume / CV Maker Online | Rojgar Suvidha",
    description: "Create a job-winning professional resume or CV. Modern templates and layouts tailored for freshers and experienced job seekers.",
    keywords: "online professional resume maker, best cv maker online, biodata format for job, resume builder free alternative"
  },
  "apply-passport-appointment-online": {
    title: "Apply Passport Appointment Online Booking | Rojgar Suvidha",
    description: "Book fresh or renewal Passport appointments online. Proper form filling with documentation checks to prevent delays or rejection.",
    keywords: "passport apply online appointment booking, fresh passport application, renew passport online, passport service"
  },
  "learner-driving-license-apply": {
    title: "Learner Driving License Online Apply | Rojgar Suvidha",
    description: "Apply for a Learner Driving License online. Skip visiting RTO for form submission. Learn how to pass the Parivahan learner test.",
    keywords: "learner license online apply, apply learning driving license, sarathi parivahan learner license test, learning license apply"
  }
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ service: string }>;
}): Promise<Metadata> {
  const { service } = await params;
  const meta = SERVICE_META_DB[service] || {
    title: "Apply Online for Cyber Cafe Services | Rojgar Suvidha",
    description: "Securely apply for government certificates, schemes, identity cards, and business registrations online with 100% expert verification.",
    keywords: "online form filling, digital cyber cafe, e-suvidha, government certificates"
  };

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
    }
  };
}

export default function ServiceApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
