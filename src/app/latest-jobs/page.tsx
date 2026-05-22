import CategoryPageTemplate from "@/components/jobs/CategoryPageTemplate";
import { Briefcase } from "lucide-react";
import type { Metadata } from "next";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "Latest Government Jobs 2025-2026 | Sarkari Naukri Today's Updates",
  description: "Get the latest Government Jobs 2025-2026, Sarkari Naukri updates, today's new job notifications from SSC, Railway, Bank, UPSC, Police, Defence & State Govt. Apply online via Rojgar Suvidha.",
  keywords: [
    "latest government jobs", "latest sarkari naukri", "sarkari naukri today",
    "new govt jobs 2025", "new govt jobs 2026", "latest govt jobs today",
    "ssc jobs 2025", "ssc jobs 2026", "railway jobs 2026", "railway jobs 2026",
    "bank jobs 2025", "bank jobs 2026", "upsc jobs 2025",
    "police jobs 2025", "defence jobs 2025",
    "10th pass sarkari naukri", "12th pass govt jobs",
    "rojgar suvidha latest jobs", "government job notification"
  ],
  alternates: { canonical: `${BASE_URL}/latest-jobs` },
  openGraph: {
    title: "Latest Government Jobs 2025-2026 | Sarkari Naukri Today",
    description: "Daily updated latest Sarkari Naukri, Government Jobs from SSC, Railway, Banking, UPSC, Police & Defence. Apply online now.",
    url: `${BASE_URL}/latest-jobs`,
    type: "website",
    siteName: "Rojgar Suvidha",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Latest Government Jobs 2025-2026" }],
  },
};

export const revalidate = 60;

export default function LatestJobsPage() {
  const seoContent = (
    <article className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest Government Jobs 2025: Your Gateway to a Secure Career</h2>
      <p className="text-gray-700 dark:text-gray-300">
        In today's highly competitive era, securing a <strong className="font-semibold text-gray-900 dark:text-gray-100">government job (Sarkari Naukri)</strong> remains one of the most sought-after career goals for millions of youth in India. A government job not only offers financial stability and attractive perks but also provides unmatched job security, social status, and a perfect work-life balance. Welcome to <strong className="text-indigo-600 dark:text-indigo-400">Rojgar Suvidha</strong>, your ultimate and most reliable destination for discovering the <strong>Latest Government Jobs 2025</strong>. We continuously monitor and update this section to ensure you never miss a golden opportunity.
      </p>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Why Choose a Career in the Government Sector?</h3>
      <p className="text-gray-700 dark:text-gray-300">
        The demand for Sarkari Naukri has always been phenomenally high. Let’s explore why pursuing a career in the public sector is highly recommended:
      </p>
      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-4 ml-4">
        <li><strong>Job Security:</strong> Unlike the private sector, government jobs offer unparalleled job stability. You are protected from economic downturns and sudden layoffs.</li>
        <li><strong>Financial Stability & Allowances:</strong> Government employees enjoy regular salary increments (Pay Commissions), Dearness Allowance (DA), House Rent Allowance (HRA), Travel Allowance (TA), and medical facilities.</li>
        <li><strong>Retirement Benefits:</strong> Pension schemes, provident funds (PF), and gratuity ensure a financially secure life even after retirement.</li>
        <li><strong>Fixed Working Hours & Holidays:</strong> A major perk is the well-defined working hours and numerous public, national, and restricted holidays, promoting a healthy work-life balance.</li>
        <li><strong>Respect and Prestige:</strong> Positions in civil services, police, defence, and administration command immense respect in society.</li>
      </ul>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Top Sectors for Latest Government Jobs in 2025</h3>
      <p className="text-gray-700 dark:text-gray-300">
        The Indian government releases millions of vacancies every year across various departments. At Rojgar Suvidha, we categorize the latest jobs to make your search effortless:
      </p>
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse border border-gray-200 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Sector</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Popular Recruiting Bodies</th>
              <th className="p-3 border border-gray-200 dark:border-gray-700 font-bold">Minimum Qualification</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Banking & Finance</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">IBPS, SBI, RBI, NABARD</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">Graduation (Any Stream)</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Railways (Indian Railways)</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">RRB NTPC, RRB Group D, RRC, ALP</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">10th, 12th, ITI, Graduation</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Staff Selection Commission</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">SSC CGL, CHSL, MTS, GD Constable</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">10th, 12th, Graduation</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Defence & Police</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">Indian Army, Navy, Airforce, State Police (UP Police, Delhi Police)</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">10th, 12th, Graduation, Physical Fitness</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">UPSC / Civil Services</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">UPSC IAS, IPS, CDS, NDA</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">12th (for NDA), Graduation (for IAS/IPS)</td>
            </tr>
            <tr>
              <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium">Teaching & Academics</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">CTET, UPTET, KVS, NVS, State Board Teachers</td>
              <td className="p-3 border border-gray-200 dark:border-gray-700">B.Ed, D.El.Ed, Post Graduation</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">How to Apply for Latest Government Jobs?</h3>
      <p className="text-gray-700 dark:text-gray-300">
        The application process for most government exams is now completely online. However, many candidates struggle with form rejection due to incorrect details, wrong image dimensions, or payment failures. Here is a general step-by-step process:
      </p>
      <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-4 ml-4">
        <li><strong>Read the Official Notification:</strong> Always download and read the official PDF notification provided on our job pages to understand eligibility, age limit, and syllabus.</li>
        <li><strong>Gather Necessary Documents:</strong> Keep your Aadhar Card, 10th/12th Marksheets, Category Certificate (if applicable), signature, and a recent passport-size photograph ready.</li>
        <li><strong>Register on the Official Portal:</strong> Visit the official website linked on Rojgar Suvidha and complete the One-Time Registration (OTR).</li>
        <li><strong>Fill the Application Form:</strong> Enter your personal, educational, and communication details accurately. Avoid spelling mistakes.</li>
        <li><strong>Upload Documents:</strong> Ensure your photo and signature meet the exact width, height, and KB size specifications required by the department.</li>
        <li><strong>Pay Application Fee:</strong> Complete the fee payment via UPI, Debit/Credit Card, or Net Banking and print the final receipt.</li>
      </ol>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl border-l-4 border-indigo-600 mt-8">
        <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
          Save Time & Avoid Mistakes with "Apply For Me"
        </h4>
        <p className="text-indigo-800 dark:text-indigo-200 mt-2 text-sm">
          Are you worried about making a mistake in your application form? Or perhaps you don't have time to visit a cyber cafe? <strong>Rojgar Suvidha</strong> introduces the exclusive <strong>Apply For Me</strong> service. Simply upload your documents securely to our portal, and our expert team will carefully fill out your government job application form with 100% accuracy. We handle the image resizing, data entry, and form submission, providing you with the final printout. Focus on your exam preparation; leave the form-filling hassle to us!
        </p>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">Preparation Strategy for Sarkari Naukri</h3>
      <p className="text-gray-700 dark:text-gray-300">
        Applying for the job is just the first step; cracking the competitive exam is the real challenge. Follow these quick tips to boost your preparation:
      </p>
      <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-4 ml-4">
        <li><strong>Understand the Syllabus:</strong> Download the latest exam pattern and syllabus. Stick strictly to the topics mentioned.</li>
        <li><strong>Previous Year Papers:</strong> Solve at least 5-10 years of previous question papers to understand the difficulty level and repeating patterns.</li>
        <li><strong>Mock Tests:</strong> Give weekly mock tests to improve your speed and accuracy. Analyze your weak areas post-test.</li>
        <li><strong>Current Affairs:</strong> Read a daily newspaper and follow monthly current affairs magazines. Stay updated on national and international events.</li>
        <li><strong>Consistency:</strong> Set a daily study schedule. Consistent self-study of 6-8 hours is far more effective than last-minute cramming.</li>
      </ul>

      <p className="text-gray-700 dark:text-gray-300 mt-8 pb-4 border-b border-gray-200 dark:border-gray-800">
        Bookmark this page (<strong>Ctrl+D</strong> or <strong>Cmd+D</strong>) and visit Rojgar Suvidha daily. We guarantee to provide the fastest, most accurate, and reliable updates on the <strong>Latest Government Jobs 2025</strong> across India. Whether you are a 10th pass looking for an MTS job, or a graduate aiming for SSC CGL or Banking, your dream job is just a click away!
      </p>
    </article>
  );

  return (
    <CategoryPageTemplate
      category="latest-jobs"
      title="Latest Jobs"
      description="Browse all the latest government job opportunities and recruitments."
      icon={Briefcase}
      colorCls="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
      seoContent={seoContent}
    />
  );
}
