import CategoryPageTemplate from "@/components/jobs/CategoryPageTemplate";
import { GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "Latest Admissions 2026 | University Entrance Exams & Counseling",
  description: "Get the latest updates on University Admissions 2026, Entrance Exams like CUET, NEET, JEE, and State Counseling processes on Rojgar Suvidha.",
  keywords: ["university admissions 2026", "entrance exams", "cuet ug", "neet 2026", "jee main", "state counseling", "college admission", "rojgar suvidha admission"],
  alternates: { canonical: `${BASE_URL}/admission` },
  openGraph: {
    title: "Latest Admissions 2026 | University Entrance Exams & Counseling",
    description: "Latest updates on University Admissions 2026, Entrance Exams, CUET, NEET, JEE, and State Counseling.",
    url: `${BASE_URL}/admission`,
    type: "website",
    siteName: "Rojgar Suvidha",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "University Admissions 2026" }],
  },
};

export default function AdmissionPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Admissions", item: `${BASE_URL}/admission` },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "University Admissions 2026",
    description: "Latest university admissions, entrance exams, and counseling notifications on Rojgar Suvidha",
    url: `${BASE_URL}/admission`,
  };

  const seoContent = (
    <article className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest University Admissions & Entrance Exams 2026</h2>
      <p className="text-gray-700 dark:text-gray-300">
        Transitioning from school to college or pursuing higher education is a significant milestone in any student's life. The path to top-tier universities, prestigious engineering colleges, and renowned medical institutions runs through highly competitive entrance exams. At <strong className="text-indigo-600 dark:text-indigo-400">Rojgar Suvidha</strong>, we simplify your academic journey by providing the most accurate, timely, and organized updates for all major <strong className="font-semibold text-gray-900 dark:text-gray-100">Admissions 2026</strong>, counseling processes, and entrance examinations across India.
      </p>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Major Entrance Examinations in India</h3>
      <p className="text-gray-700 dark:text-gray-300">
        Navigating the maze of entrance exams can be overwhelming. We track all major national and state-level exams, categorized below for your convenience:
      </p>
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Field of Study</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Top National Entrance Exams</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Eligibility</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Undergraduate (General)</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">CUET UG, DUET, BHU UET</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">12th Pass (Any Stream)</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Engineering & Technology</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">JEE Main, JEE Advanced, BITSAT, VITEEE</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">12th Pass (PCM)</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Medical & Dental</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">NEET UG, AIIMS, JIPMER (merged with NEET)</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">12th Pass (PCB)</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Management (MBA)</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">CAT, MAT, XAT, CMAT, SNAP</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">Graduation (Any Stream)</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Law</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">CLAT, AILET, LSAT India</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">12th Pass / Graduation</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Education (Teaching)</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">UP B.Ed JEE, Bihar B.Ed, PTET</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">Graduation (Min. 50%)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Crucial Steps for College Admission</h3>
      <p className="text-gray-700 dark:text-gray-300">
        Admission isn't just about filling out a form; it's a multi-stage process. Missing a single deadline can cost you an academic year. Here is the standard timeline:
      </p>
      <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-4 ml-4">
        <li><strong>Application Phase:</strong> Read the official brochure. Register on the official portal, upload documents (photo/signature/marksheets), and pay the examination fee.</li>
        <li><strong>Admit Card Release:</strong> Usually released 1-2 weeks before the exam. Download and print it.</li>
        <li><strong>Examination Day:</strong> Appear for the CBT (Computer Based Test) or OMR-based test at your designated center.</li>
        <li><strong>Answer Key & Results:</strong> Check your raw score via the official answer key, followed by the declaration of the final merit list or percentile score.</li>
        <li><strong>Counseling Process:</strong> This is the most crucial phase. Register for counseling, fill in your choice of colleges/courses (Choice Filling), and wait for seat allotment.</li>
        <li><strong>Document Verification & Reporting:</strong> Once a seat is allotted, pay the seat acceptance fee and report to the allotted college with original documents.</li>
      </ol>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border-l-4 border-blue-600 mt-8">
        <h4 className="text-lg font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
          🎓 Expert "Apply For Me" Service for Students
        </h4>
        <p className="text-blue-800 dark:text-blue-200 mt-2 text-sm">
          A single mistake in your entrance exam form or choice filling during counseling can disqualify you from getting your dream college. Don't take a risk! Use Rojgar Suvidha's <strong>Apply For Me</strong> service. Upload your documents, and our experts will fill out your complex university admission forms flawlessly. We also offer expert guidance during the intricate choice-filling and counseling phases.
        </p>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Important Documents Required for Counseling</h3>
      <p className="text-gray-700 dark:text-gray-300">
        Whether it is JoSAA (for IITs/NITs), MCC (for Medical), or State Counseling, you must keep a file ready with these original documents (and 2 sets of photocopies):
      </p>
      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-4 ml-4">
        <li>10th and 12th Marksheets & Passing Certificates.</li>
        <li>Entrance Exam Scorecard / Rank Letter.</li>
        <li>Caste / Category Certificate (OBC-NCL, EWS, SC, ST) in the officially prescribed format.</li>
        <li>Domicile Certificate (for state quota seats).</li>
        <li>Transfer Certificate (TC) and Migration Certificate.</li>
        <li>Passport Size Photographs (at least 6-8 copies).</li>
      </ul>

      <p className="text-gray-700 dark:text-gray-300 mt-8 pb-4 border-b border-gray-200 dark:border-gray-800">
        Bookmark this Admissions page and stay connected with Rojgar Suvidha. From the release of the CUET notification to the final round of JEE counseling, we cover every update precisely. Check our <Link href="/latest-jobs" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Latest Jobs</Link> if you are looking for immediate employment after graduation.
      </p>
    </article>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <CategoryPageTemplate
        category="admission"
        title="Admissions"
        description="Get updates on university admissions, entrance exams, and counseling processes."
        icon={GraduationCap}
        colorCls="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        seoContent={seoContent}
      />
    </>
  );
}
