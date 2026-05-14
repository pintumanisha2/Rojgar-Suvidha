import CategoryPageTemplate from "@/components/jobs/CategoryPageTemplate";
import { Key } from "lucide-react";
import type { Metadata } from "next";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "Answer Key 2025-2026 | SSC, Railway, State PSC OMR & Response Sheets",
  description: "Download official Answer Keys 2025-2026, Response Sheets & OMR PDFs for SSC, Railway RRB, UPSC, Banking IBPS, Police exams. Raise objections & calculate your score on Rojgar Suvidha.",
  keywords: [
    "answer key 2025", "answer key 2026", "official answer key",
    "response sheet download", "omr sheet pdf",
    "ssc cgl answer key", "ssc chsl answer key", "ssc answer key 2025",
    "rrb ntpc answer key", "railway answer key",
    "ibps answer key", "upsc answer key",
    "raise objection answer key", "calculate marks answer key",
    "government exam answer key", "rojgar suvidha answer key"
  ],
  alternates: { canonical: `${BASE_URL}/answer-key` },
  openGraph: {
    title: "Answer Key 2025-2026 | Official OMR & Response Sheets",
    description: "Download official Answer Keys for SSC, Railway, Banking & State exams. Calculate your score & raise objections online.",
    url: `${BASE_URL}/answer-key`,
    type: "website",
    siteName: "Rojgar Suvidha",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Answer Key 2025-2026" }],
  },
};

export default function AnswerKeyPage() {
  const seoContent = (
    <article className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Download Official Answer Key 2025 for Government Exams</h2>
      <p className="text-gray-700 dark:text-gray-300">
        The waiting period between the exam day and the final result declaration is often the most stressful time for any aspirant. However, the release of the <strong className="font-semibold text-gray-900 dark:text-gray-100">Official Answer Key</strong> brings massive relief. An answer key, along with your response sheet, allows you to calculate your raw score accurately before the final cut-offs are announced. Here at <strong className="text-indigo-600 dark:text-indigo-400">Rojgar Suvidha</strong>, we instantly provide direct PDF and login links to download the <strong>Latest Answer Key 2025</strong> for all major Sarkari exams.
      </p>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">What is an Answer Key and Why is it Important?</h3>
      <p className="text-gray-700 dark:text-gray-300">
        An answer key is an official document released by the examination conducting authority (like SSC, RRB, UPSC, or State Boards) that contains the correct answers to all the questions asked in the exam. Here is why downloading it is crucial:
      </p>
      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-4 ml-4">
        <li><strong>Calculate Your Score:</strong> By comparing your marked answers (Response Sheet) with the official key, you can calculate your exact raw score.</li>
        <li><strong>Transparency:</strong> It ensures that the examination process is completely transparent and fair for all candidates.</li>
        <li><strong>Raise Objections:</strong> If you believe an official answer is incorrect, you can challenge it. If your objection is valid, you get bonus marks.</li>
        <li><strong>Predict Final Selection:</strong> Based on your raw score and previous year cut-offs, you can confidently start preparing for the next phase (Mains/Interview/PET) without wasting time.</li>
      </ul>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Tentative vs. Final Answer Key</h3>
      <p className="text-gray-700 dark:text-gray-300">
        It is important to understand the two stages of answer key releases:
      </p>
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Feature</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Tentative Answer Key</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Final Answer Key</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Release Time</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">Usually 3 to 7 days after the exam concludes.</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">Released along with or just before the final result.</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Objections</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">Candidates CAN raise objections/challenges.</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">No further objections are entertained.</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Fees</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">Usually ₹100 per challenged question.</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">Not Applicable.</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Accuracy</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">May contain some errors or disputed questions.</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">100% accurate; finalized by subject experts.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">How to Calculate Your Marks?</h3>
      <p className="text-gray-700 dark:text-gray-300">
        Calculating your marks is a simple mathematical process. First, read the official notification to understand the marking scheme (e.g., +2 for correct, -0.5 for wrong).
        <br /><br />
        <strong>Formula:</strong> <br />
        <em>Total Score = (Number of Correct Answers × Marks per Correct Answer) - (Number of Incorrect Answers × Negative Marking)</em>
        <br /><br />
        Do not count the questions you left unattempted. If your calculated score is safely above the expected cut-off, start your Mains preparation immediately!
      </p>

      <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border-l-4 border-purple-600 mt-8">
        <h4 className="text-lg font-bold text-purple-900 dark:text-purple-300 flex items-center gap-2">
          ✋ How to Raise an Objection?
        </h4>
        <p className="text-purple-800 dark:text-purple-200 mt-2 text-sm">
          If you find an official answer is absolutely wrong, you should challenge it. Log in to the official portal using your Roll Number and Password. Navigate to the "Raise Objection" or "Challenge Answer Key" tab. Select the Question ID, choose your proposed correct option, and most importantly, upload a valid proof (like a screenshot of a standard NCERT textbook). Pay the nominal fee (usually ₹100/question). If your challenge is accepted, the fee is refunded, and everyone gets the bonus marks!
        </p>
      </div>

      <p className="text-gray-700 dark:text-gray-300 mt-8 pb-4 border-b border-gray-200 dark:border-gray-800">
        Finding the direct link to response sheets can be difficult on cluttered government websites. Bookmark Rojgar Suvidha for 1-click access to all <strong>Answer Keys 2025</strong>. We constantly monitor official websites so you can evaluate your performance without any delay.
      </p>
    </article>
  );

  return (
    <CategoryPageTemplate
      category="answer-key"
      title="Answer Keys"
      description="Download official answer keys and raise objections for recent examinations."
      icon={Key}
      colorCls="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
      seoContent={seoContent}
    />
  );
}
