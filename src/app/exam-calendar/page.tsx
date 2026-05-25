import type { Metadata } from "next";
import ExamCalendarClient from "./ExamCalendarClient";

const BASE_URL = "https://www.rojgarsuvidha.com";

// ── AEO + SEO Optimized Metadata ──────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Exam Calendar 2025-2026 | Govt Exam Schedule, Last Dates & Notifications",
  description:
    "Complete Government Exam Calendar 2025-2026. Track upcoming SSC, UPSC, Railway, Banking, Police & Defence exam dates, last dates to apply, admit card dates & result dates. Never miss a sarkari exam deadline again.",
  keywords: [
    "exam calendar 2025", "exam calendar 2026", "govt exam schedule 2025",
    "upcoming government exams 2025", "sarkari exam dates 2025",
    "SSC CGL 2025 exam date", "RRB NTPC exam date 2025",
    "IBPS PO 2025 exam schedule", "UPSC CSE 2025 schedule",
    "government exam last date 2025", "sarkari naukri exam timetable",
    "bank exam calendar 2025", "railway exam dates 2025",
    "upcoming sarkari exam 2025 2026", "exam notification calendar",
    "rojgar suvidha exam calendar",
  ],
  alternates: { canonical: `${BASE_URL}/exam-calendar` },
  openGraph: {
    title: "Govt Exam Calendar 2025-2026 | Upcoming Exam Dates | Rojgar Suvidha",
    description:
      "All government exam dates, last dates & admit card schedules in one place. SSC, UPSC, Railway, Banking, Police & Defence exam calendar.",
    url: `${BASE_URL}/exam-calendar`,
    type: "website",
    siteName: "Rojgar Suvidha",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Government Exam Calendar 2025-2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Govt Exam Calendar 2025-2026 | Rojgar Suvidha",
    description: "Never miss a sarkari exam! Track all exam dates, last dates & results in one place.",
    images: ["/og-image.png"],
  },
};

// ── JSON-LD Structured Data (AEO: AI engines read this) ───────────────────────

// Events schema — Google can show exam events in search
const upcomingExams = [
  {
    name: "SSC CGL 2025 Tier 1 Exam",
    description: "Staff Selection Commission Combined Graduate Level Tier 1 Examination 2025. Vacancies for Group B & C posts across various ministries.",
    startDate: "2025-09-01",
    endDate: "2025-09-25",
    lastDateApply: "2025-07-24",
    registrationDate: "2025-06-22",
    category: "SSC",
    vacancies: "17,727",
    eligibility: "Graduation in any stream",
    ageLimit: "18-32 years",
    officialUrl: "https://ssc.gov.in",
    emoji: "🏛️",
    color: "blue",
  },
  {
    name: "RRB NTPC 2025 Exam",
    description: "Railway Recruitment Board Non-Technical Popular Category (NTPC) Graduate Level Posts 2025.",
    startDate: "2025-10-01",
    endDate: "2025-11-30",
    lastDateApply: "2025-08-15",
    registrationDate: "2025-07-16",
    category: "Railway",
    vacancies: "11,558",
    eligibility: "Graduation",
    ageLimit: "18-36 years",
    officialUrl: "https://indianrailways.gov.in",
    emoji: "🚂",
    color: "red",
  },
  {
    name: "IBPS PO 2025 Exam",
    description: "Institute of Banking Personnel Selection Probationary Officer CRP PO/MT XV 2025 Exam.",
    startDate: "2025-10-11",
    endDate: "2025-10-12",
    lastDateApply: "2025-09-05",
    registrationDate: "2025-08-01",
    category: "Banking",
    vacancies: "5,000+",
    eligibility: "Graduation (Any Stream)",
    ageLimit: "20-30 years",
    officialUrl: "https://ibps.in",
    emoji: "🏦",
    color: "green",
  },
  {
    name: "UPSC Civil Services Prelims 2026",
    description: "Union Public Service Commission Civil Services (IAS/IPS/IFS) Preliminary Examination 2026.",
    startDate: "2026-05-24",
    endDate: "2026-05-24",
    lastDateApply: "2026-02-18",
    registrationDate: "2026-01-22",
    category: "UPSC",
    vacancies: "979",
    eligibility: "Any Degree from recognized university",
    ageLimit: "21-32 years",
    officialUrl: "https://upsc.gov.in",
    emoji: "🎖️",
    color: "purple",
  },
  {
    name: "SSC CHSL 2025 Exam",
    description: "Staff Selection Commission Combined Higher Secondary Level (10+2) Examination 2025 for LDC, JSA, PA, DEO posts.",
    startDate: "2025-07-01",
    endDate: "2025-07-10",
    lastDateApply: "2025-05-18",
    registrationDate: "2025-04-22",
    category: "SSC",
    vacancies: "3,712",
    eligibility: "12th Pass (Any Stream)",
    ageLimit: "18-27 years",
    officialUrl: "https://ssc.gov.in",
    emoji: "🏛️",
    color: "blue",
  },
  {
    name: "UP Police Constable 2025",
    description: "Uttar Pradesh Police Recruitment & Promotion Board (UPPRPB) Constable Civil Police Recruitment 2025.",
    startDate: "2025-08-23",
    endDate: "2025-08-31",
    lastDateApply: "2025-07-15",
    registrationDate: "2025-06-16",
    category: "Police",
    vacancies: "60,244",
    eligibility: "12th Pass",
    ageLimit: "18-22 years",
    officialUrl: "https://uppbpb.gov.in",
    emoji: "👮",
    color: "indigo",
  },
  {
    name: "Indian Army Agniveer 2025",
    description: "Indian Army Agniveer Recruitment 2025 — Agnipath Scheme for Short Service Commission in Indian Army.",
    startDate: "2025-07-20",
    endDate: "2025-09-15",
    lastDateApply: "2025-06-30",
    registrationDate: "2025-06-01",
    category: "Defence",
    vacancies: "25,000+",
    eligibility: "10th/12th Pass with Physical Fitness",
    ageLimit: "17.5-21 years",
    officialUrl: "https://joinindianarmy.nic.in",
    emoji: "🛡️",
    color: "orange",
  },
  {
    name: "SBI PO 2025 Exam",
    description: "State Bank of India Probationary Officer Recruitment 2025 Phase I Online Exam.",
    startDate: "2025-11-22",
    endDate: "2025-11-30",
    lastDateApply: "2025-10-20",
    registrationDate: "2025-09-22",
    category: "Banking",
    vacancies: "2,000+",
    eligibility: "Graduation in any discipline",
    ageLimit: "21-30 years",
    officialUrl: "https://sbi.co.in/careers",
    emoji: "🏦",
    color: "green",
  },
  {
    name: "CTET December 2025",
    description: "Central Teacher Eligibility Test (CTET) December 2025 for Paper I (Class 1-5) & Paper II (Class 6-8).",
    startDate: "2025-12-14",
    endDate: "2025-12-14",
    lastDateApply: "2025-10-31",
    registrationDate: "2025-10-01",
    category: "Teaching",
    vacancies: "Qualifying Exam",
    eligibility: "D.El.Ed / B.Ed / Graduation",
    ageLimit: "No upper age limit",
    officialUrl: "https://ctet.nic.in",
    emoji: "📚",
    color: "yellow",
  },
  {
    name: "NDA & NA II 2025 Exam",
    description: "UPSC National Defence Academy and Naval Academy Examination (II) 2025 for Army, Navy & Air Force wings.",
    startDate: "2025-09-14",
    endDate: "2025-09-14",
    lastDateApply: "2025-07-01",
    registrationDate: "2025-06-04",
    category: "Defence",
    vacancies: "404",
    eligibility: "12th Pass (PCM for Air Force/Navy)",
    ageLimit: "16.5-19.5 years",
    officialUrl: "https://upsc.gov.in",
    emoji: "🛡️",
    color: "orange",
  },
  {
    name: "IBPS Clerk 2025 Mains",
    description: "IBPS Common Recruitment Process for Clerks (CRP Clerks XV) 2025 Mains Examination.",
    startDate: "2026-01-04",
    endDate: "2026-01-04",
    lastDateApply: "2025-10-15",
    registrationDate: "2025-09-16",
    category: "Banking",
    vacancies: "6,128",
    eligibility: "Graduation",
    ageLimit: "20-28 years",
    officialUrl: "https://ibps.in",
    emoji: "🏦",
    color: "green",
  },
  {
    name: "UPPSC PCS 2025 Prelims",
    description: "Uttar Pradesh Public Service Commission Combined State / Upper Subordinate Services Prelims 2025.",
    startDate: "2025-12-07",
    endDate: "2025-12-07",
    lastDateApply: "2025-09-30",
    registrationDate: "2025-09-01",
    category: "State PSC",
    vacancies: "400+",
    eligibility: "Graduation",
    ageLimit: "21-40 years (with relaxation)",
    officialUrl: "https://uppsc.up.nic.in",
    emoji: "🏢",
    color: "teal",
  },
];

const eventsJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Upcoming Government Exam Schedule 2025-2026",
  description: "Complete list of upcoming government exams in India for 2025-2026 with dates, eligibility and vacancies",
  numberOfItems: upcomingExams.length,
  itemListElement: upcomingExams.map((exam, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@context": "https://schema.org",
      "@type": "Event",
      name: exam.name,
      description: exam.description,
      startDate: exam.startDate,
      endDate: exam.endDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      location: {
        "@type": "VirtualLocation",
        url: exam.officialUrl,
      },
      organizer: {
        "@type": "Organization",
        name: "Government of India",
        url: exam.officialUrl,
      },
      url: `${BASE_URL}/exam-calendar`,
      offers: {
        "@type": "Offer",
        description: `Last date to apply: ${exam.lastDateApply}`,
        url: exam.officialUrl,
      },
    },
  })),
};

// FAQ Schema — AEO ke liye most important
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "2025 mein kaun se bade government exams hain?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "2025 mein bade government exams hain: SSC CGL 2025 (17,727 vacancies, exam Sept 2025), RRB NTPC 2025 (11,558 vacancies, exam Oct-Nov 2025), IBPS PO 2025 (5000+ vacancies, exam Oct 2025), UP Police Constable 2025 (60,244 vacancies, exam Aug 2025), Indian Army Agniveer 2025 (25,000+ vacancies, exam July-Sept 2025), aur SBI PO 2025 (2000+ vacancies, exam Nov 2025).",
      },
    },
    {
      "@type": "Question",
      name: "SSC CGL 2025 ki last date kya hai?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SSC CGL 2025 ke liye online application ki last date 24 July 2025 hai. Notification 22 June 2025 ko aai thi. SSC CGL 2025 Tier 1 Exam September 2025 mein hoga jisme 17,727 vacancies hain Group B & C posts ke liye. Eligibility: Graduation in any stream, Age: 18-32 years.",
      },
    },
    {
      "@type": "Question",
      name: "UPSC Civil Services 2026 ka exam kab hai?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "UPSC Civil Services (IAS/IPS) 2026 Preliminary Exam 24 May 2026 ko hoga. Apply online registration 22 January 2026 se shuru hogi aur last date 18 February 2026 hai. Total 979 vacancies hain. Eligibility: Any Degree, Age: 21-32 years (General category).",
      },
    },
    {
      "@type": "Question",
      name: "Upcoming government exam dates kahan check karein?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Rojgar Suvidha ka Exam Calendar page (rojgarsuvidha.com/exam-calendar) pe aap sabhi upcoming SSC, UPSC, Railway, Banking, Police aur State PSC exams ke dates dekh sakte hain. Yahan countdown timer, eligibility, vacancies aur official website links sab ek jagah milte hain.",
      },
    },
    {
      "@type": "Question",
      name: "RRB NTPC 2025 ke liye eligibility kya hai?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "RRB NTPC 2025 ke liye eligibility hai: Graduation in any recognized university. Age limit 18-36 years hai (General category; SC/ST ko 5 years aur OBC ko 3 years ki relaxation milti hai). 11,558 vacancies hain Graduate level posts ke liye. Last date to apply August 2025 hai.",
      },
    },
    {
      "@type": "Question",
      name: "10th pass ke liye 2025 mein government jobs kaunsi hain?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "10th pass candidates ke liye 2025 mein bade government jobs hain: Indian Army Agniveer (25,000+ vacancies, 17.5-21 years age), SSC MTS (Multi-Tasking Staff), Railway Group D (RRB Group D), UP Police (kuch posts), RPF Constable. Rojgar Suvidha pe '10th pass sarkari naukri' filter use karein.",
      },
    },
    {
      "@type": "Question",
      name: "IBPS PO 2025 exam ki date kab hai?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "IBPS PO 2025 (CRP PO/MT XV) Prelims Exam 11-12 October 2025 ko hoga. Apply online August 2025 se shuru hogi aur last date September 5, 2025 hai. 5,000+ vacancies hain public sector banks mein. Eligibility: Graduation in any stream, Age: 20-30 years.",
      },
    },
    {
      "@type": "Question",
      name: "Exam notification miss na ho iske liye kya karein?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Exam notification miss na ho iske liye: 1) Rojgar Suvidha ka Telegram channel join karein — instant alerts milenge. 2) Website pe Browser notifications enable karein. 3) Exam Calendar bookmark karein (Ctrl+D). 4) WhatsApp group join karein. Rojgar Suvidha daily updates deta hai sabhi sarkari exams ke liye.",
      },
    },
  ],
};

// HowTo Schema — "How to track exam dates" ke liye
const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Government Exam Calendar kaise use karein",
  description: "Rojgar Suvidha ke Exam Calendar ka use karke upcoming sarkari exams track karne ka tarika",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Category Filter Select Karein",
      text: "Page ke top mein category filter se apna preferred sector chunein: SSC, Railway, Banking, UPSC, Police, Defence, Teaching, ya State PSC.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Exam Card Dekho",
      text: "Har exam card mein milega: Last Date to Apply, Exam Date, Vacancies count, Eligibility, aur Countdown Timer.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Official Link Pe Click Karein",
      text: "'Apply Now' button se seedha official website par jayein aur application fill karein.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Notification Set Karein",
      text: "Telegram ya WhatsApp join karein taaki last date se pehle reminder mile.",
    },
  ],
};

export const revalidate = 3600; // 1 hour revalidate

export default function ExamCalendarPage() {
  return (
    <>
      {/* AEO Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

      {/* Client Component with interactive features */}
      <ExamCalendarClient exams={upcomingExams} />
    </>
  );
}
