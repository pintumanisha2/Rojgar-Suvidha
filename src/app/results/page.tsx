import CategoryPageTemplate from "@/components/jobs/CategoryPageTemplate";
import { FileText } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "Sarkari Result 2025-2026 | Check Government Exam Results Online",
  description: "Check latest Sarkari Results 2025-2026 online. SSC Result, Railway Result, Bank Exam Result, UPSC Result, Police Result & State Level Exam Merit Lists on Rojgar Suvidha. Fastest result updates.",
  keywords: [
    "sarkari result", "sarkari result 2025", "sarkari result 2026",
    "government exam results", "govt exam result online",
    "ssc result 2025", "ssc cgl result", "ssc chsl result",
    "railway result 2025", "rrb ntpc result", "rrb group d result",
    "bank exam result", "ibps result", "sbi result",
    "upsc result", "up police result", "bihar police result",
    "merit list 2025", "cut off marks 2025",
    "rojgar suvidha result"
  ],
  alternates: { canonical: `${BASE_URL}/results` },
  openGraph: {
    title: "Sarkari Result 2025-2026 | Government Exam Results",
    description: "Fastest Sarkari Results from SSC, Railway, Banking, UPSC, Police & State Exams. Direct result PDF & scorecard links.",
    url: `${BASE_URL}/results`,
    type: "website",
    siteName: "Rojgar Suvidha",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Sarkari Result 2025-2026" }],
  },
};

export default function ResultsPage() {
  const seoContent = (
    <article className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Check Latest Sarkari Results 2025: Your Success Starts Here</h2>
      <p className="text-gray-700 dark:text-gray-300">
        After months of rigorous preparation and successfully attempting a government exam, the most highly anticipated moment is the declaration of the <strong className="font-semibold text-gray-900 dark:text-gray-100">Sarkari Result</strong>. Checking your government exam result on time is crucial, as it dictates your next steps—whether it's preparing for the next phase, a physical test, or document verification. Welcome to the <strong className="text-indigo-600 dark:text-indigo-400">Rojgar Suvidha Results Page</strong>, your one-stop destination for tracking the <strong>Latest Government Exam Results 2025</strong> instantly and accurately.
      </p>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Why Timely Access to Exam Results is Crucial</h3>
      <p className="text-gray-700 dark:text-gray-300">
        Many candidates face anxiety waiting for their results, and official websites often crash due to heavy traffic. Here is why staying updated with Rojgar Suvidha is beneficial:
      </p>
      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-4 ml-4">
        <li><strong>Instant Notifications:</strong> Get immediate updates as soon as an official result is declared. No need to refresh official portals constantly.</li>
        <li><strong>Direct Download Links:</strong> We provide direct links to the result PDFs or login portals, bypassing server overload issues on government sites.</li>
        <li><strong>Cut-off Marks & Merit Lists:</strong> Access detailed category-wise cut-off marks and official merit lists in one place.</li>
        <li><strong>Next Phase Preparation:</strong> Knowing your result early gives you a head start to prepare for Tier-II, interviews, or physical efficiency tests (PET).</li>
      </ul>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Types of Results Covered on Rojgar Suvidha</h3>
      <p className="text-gray-700 dark:text-gray-300">
        We comprehensively cover results from all major central and state government recruitment bodies. Here are the categories you can find:
      </p>
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Category</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Major Exams</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Result Format</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">SSC Results</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">CGL, CHSL, MTS, GD Constable, CPO</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">PDF Merit List / Scorecard</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Railway Results</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">RRB NTPC, Group D, ALP, RPF</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">Zone-wise PDF / Login</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Banking Results</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">IBPS PO/Clerk, SBI PO/Clerk, RBI</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">Scorecard via Login ID</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Defence & Police</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">Army Agniveer, UP Police, Delhi Police</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">PDF Merit List</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">State Level Exams</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">UPSSSC, BPSC, UKPSC, HSSC</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">PDF / Roll Number Search</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">How to Check Your Government Exam Result?</h3>
      <p className="text-gray-700 dark:text-gray-300">
        Checking your result is simple if you follow these steps:
      </p>
      <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-4 ml-4">
        <li><strong>Keep Your Admit Card Ready:</strong> You will need your Roll Number, Registration Number, and Date of Birth (DOB) as printed on your admit card.</li>
        <li><strong>Visit Rojgar Suvidha:</strong> Navigate to this "Results" section and click on the specific exam link.</li>
        <li><strong>Click the Direct Link:</strong> Scroll down to the "Important Links" section and click on "Download Result" or "Check Scorecard".</li>
        <li><strong>Search Your Roll Number:</strong> If it's a PDF file, open it and use the search function (Ctrl+F on PC, or the magnifying glass icon on mobile) to find your Roll Number or Name.</li>
        <li><strong>Login for Scorecards:</strong> If a login is required, enter your credentials accurately. Enter the captcha code carefully.</li>
        <li><strong>Save and Print:</strong> Always download the PDF or take a screenshot/printout of your scorecard for future reference during document verification.</li>
      </ol>

      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border-l-4 border-green-600 mt-8">
        <h4 className="text-lg font-bold text-green-900 dark:text-green-300 flex items-center gap-2">
          🎉 What to do after passing the exam?
        </h4>
        <p className="text-green-800 dark:text-green-200 mt-2 text-sm">
          Congratulations on clearing the written exam! Your next immediate step should be preparing for the subsequent stages. If your exam has a Tier-II, start studying the specific syllabus. If there is a Physical Efficiency Test (PET), start physical training immediately. Most importantly, begin gathering all your original documents—educational certificates, caste certificates (in the correct format), and ID proofs—for the Document Verification (DV) process.
        </p>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">What if You Didn't Clear the Exam?</h3>
      <p className="text-gray-700 dark:text-gray-300">
        Failure is just a stepping stone to success. If you did not find your roll number in the merit list, do not lose hope. Analyze your scorecard to identify your weak subjects. Did you lack speed in Mathematics? Was your General Knowledge weak? Identify the gaps, revise your strategy, and check our <Link href="/latest-jobs" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Latest Jobs</Link> section to apply for upcoming opportunities. Your hard work will eventually pay off!
      </p>

      <p className="text-gray-700 dark:text-gray-300 mt-8 pb-4 border-b border-gray-200 dark:border-gray-800">
        Bookmark this page to stay ahead of the curve. Rojgar Suvidha is committed to providing the fastest updates for <strong>Sarkari Results 2025</strong>. We wish you the very best of luck in your career journey!
      </p>
    </article>
  );

  return (
    <CategoryPageTemplate
      category="results"
      title="Exam Results"
      description="Check the latest government exam results, cut-offs, and merit lists."
      icon={FileText}
      colorCls="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
      seoContent={seoContent}
    />
  );
}
