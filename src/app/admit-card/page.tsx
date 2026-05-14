import CategoryPageTemplate from "@/components/jobs/CategoryPageTemplate";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "Admit Card Download 2025-2026 | SSC, Railway, Bank Hall Tickets",
  description: "Download latest Admit Card 2025-2026, Hall Tickets & Call Letters for SSC, Railway RRB, Banking IBPS/SBI, UPSC, Police & State Services. Direct download links on Rojgar Suvidha.",
  keywords: [
    "admit card 2025", "admit card 2026", "admit card download",
    "hall ticket download", "call letter 2025",
    "ssc admit card 2025", "ssc cgl admit card",
    "railway admit card", "rrb ntpc admit card",
    "bank exam call letter", "ibps admit card", "sbi admit card",
    "upsc admit card", "up police admit card",
    "government exam hall ticket", "rojgar suvidha admit card"
  ],
  alternates: { canonical: `${BASE_URL}/admit-card` },
  openGraph: {
    title: "Admit Card Download 2025-2026 | Hall Tickets & Call Letters",
    description: "Fastest direct download links for Admit Cards 2025-2026. SSC, Railway, Banking, UPSC, Police & State Exams.",
    url: `${BASE_URL}/admit-card`,
    type: "website",
    siteName: "Rojgar Suvidha",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Admit Card Download 2025-2026" }],
  },
};

export default function AdmitCardPage() {
  const seoContent = (
    <article className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Download Latest Admit Card 2025 for Government Exams</h2>
      <p className="text-gray-700 dark:text-gray-300">
        Your preparation is complete, and the exam date is approaching. The final and most critical step before entering the examination hall is downloading your <strong className="font-semibold text-gray-900 dark:text-gray-100">Admit Card</strong> (also known as a Hall Ticket or Call Letter). An admit card is an official document that serves as your entry pass for any government recruitment exam. At <strong className="text-indigo-600 dark:text-indigo-400">Rojgar Suvidha</strong>, we understand how important this document is, which is why we provide fast, direct, and reliable download links for all the <strong>Latest Admit Cards 2025</strong> across all sectors.
      </p>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Why is the Admit Card Mandatory?</h3>
      <p className="text-gray-700 dark:text-gray-300">
        No candidate is allowed inside the examination center without a valid printed admit card. It contains crucial details that authenticate your identity and candidature:
      </p>
      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-4 ml-4">
        <li><strong>Personal Verification:</strong> It displays your name, photograph, signature, and date of birth, matching your official ID proof.</li>
        <li><strong>Exam Center Details:</strong> It provides the exact address, venue code, and geographical location of your test center.</li>
        <li><strong>Date and Shift Timings:</strong> It clearly states your reporting time, gate closing time, and the exact exam shift.</li>
        <li><strong>Important Instructions:</strong> It outlines the rules and regulations, dress code, and permitted items (like pens, sanitizers, or water bottles) for the exam day.</li>
      </ul>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Major Admit Cards Available on Rojgar Suvidha</h3>
      <p className="text-gray-700 dark:text-gray-300">
        We track and update admit card download links for thousands of competitive exams. Here is a breakdown of the major categories we cover:
      </p>
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Category</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Top Exams</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Release Timeline (Approx.)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">SSC Exams</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">SSC CGL, CHSL, MTS, CPO, GD Constable</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">4-7 Days before the exam date</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Railway (RRB)</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">RRB NTPC, Group D, ALP, RPF Constable</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">City Intimation: 10 Days | E-Call Letter: 4 Days prior</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Banking & Insurance</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">IBPS PO/Clerk, SBI PO, RBI Assistant, LIC</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">10-15 Days before the exam date</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Defence & Police</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">NDA, CDS, UP Police, Bihar Police</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">2-3 Weeks before the exam/physical test</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">UPSC / State PSC</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">Civil Services (IAS), UPPSC, BPSC</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">3 Weeks before the exam date</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">How to Download Your Admit Card Online?</h3>
      <p className="text-gray-700 dark:text-gray-300">
        Downloading an admit card can sometimes be tricky due to heavy server loads. Follow these steps to smoothly download your hall ticket via Rojgar Suvidha:
      </p>
      <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-4 ml-4">
        <li><strong>Find Your Exam:</strong> Scroll through this page or use the search bar to find the relevant exam link.</li>
        <li><strong>Click the Download Link:</strong> Scroll to the bottom of the specific exam page to the "Important Links" section and click "Download Admit Card".</li>
        <li><strong>Enter Login Credentials:</strong> You will be redirected to the official login portal. You typically need your <em>Registration Number, Application Number, Roll Number, or Date of Birth (DOB)</em>.</li>
        <li><strong>Solve Captcha:</strong> Enter the security captcha code carefully as shown on the screen.</li>
        <li><strong>Download & Print:</strong> Once the admit card appears on the screen, verify all your details. Download it as a PDF and take at least 2 clear printouts (preferably in color).</li>
      </ol>

      <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl border-l-4 border-orange-600 mt-8">
        <h4 className="text-lg font-bold text-orange-900 dark:text-orange-300 flex items-center gap-2">
          ⚠️ Important Exam Day Checklist
        </h4>
        <p className="text-orange-800 dark:text-orange-200 mt-2 text-sm">
          Before leaving for your exam center, ensure you have the following items packed in a clear, transparent folder:
          <br /><br />
          1. <strong>Printed Admit Card</strong> (Clear copy without smudges).<br />
          2. <strong>Original Photo ID Proof</strong> (Aadhar Card, PAN Card, Voter ID, or Passport). The name and DOB MUST match your admit card exactly.<br />
          3. <strong>2-3 Recent Passport Size Photographs</strong> (Same as uploaded during the application).<br />
          4. <strong>Blue/Black Ballpoint Pen</strong> (If the exam is offline/OMR based).
        </p>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">What if There is an Error in Your Admit Card?</h3>
      <p className="text-gray-700 dark:text-gray-300">
        Sometimes, typographical errors occur regarding your name, category, or photograph on the admit card. If you spot an error, <strong>do not panic</strong>. Immediately contact the respective recruitment board (like SSC regional office or IBPS helpdesk) via email or helpline numbers provided on their official website. Carry supporting original documents to the exam center to prove your identity.
      </p>

      <p className="text-gray-700 dark:text-gray-300 mt-8 pb-4 border-b border-gray-200 dark:border-gray-800">
        Keep visiting Rojgar Suvidha for the most direct and fastest updates on <strong>Admit Card 2025</strong> releases. Check our <Link href="/results" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Results</Link> page after your exam to track your performance. Best of luck with your examinations!
      </p>
    </article>
  );

  return (
    <CategoryPageTemplate
      category="admit-card"
      title="Admit Cards"
      description="Download admit cards and hall tickets for upcoming government examinations."
      icon={BookOpen}
      colorCls="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
      seoContent={seoContent}
    />
  );
}
