import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
          <div className="bg-gray-100 dark:bg-gray-800 p-3.5 rounded-2xl">
            <FileText className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Terms & Conditions</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Please read these terms carefully before using our platform.</p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
          <p className="mb-6">
            Welcome to Rojgar Suvidha. By accessing this website, we assume you accept these terms and conditions. Do not continue to use Rojgar Suvidha if you do not agree to take all of the terms and conditions stated on this page.
          </p>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. License and Use</h2>
          <p className="mb-4">
            Unless otherwise stated, Rojgar Suvidha and/or its licensors own the intellectual property rights for all material on Rojgar Suvidha. All intellectual property rights are reserved. You may access this from Rojgar Suvidha for your own personal use subjected to restrictions set in these terms and conditions.
          </p>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. Apply For Me Service</h2>
          <p className="mb-4">
            Our "Apply For Me" service is a premium assistance service. By using this service:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>You agree to provide true, accurate, and complete information and documents.</li>
            <li>We act solely as an assistant to fill the forms on your behalf. The final decision of application acceptance lies strictly with the respective examination/recruitment authority.</li>
            <li>We are not responsible for rejection due to incorrect details provided by the user.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Information Accuracy</h2>
          <p className="mb-6">
            While we strive to provide the most accurate and up-to-date information regarding jobs, results, and admit cards, we do not warrant its completeness or accuracy. Users are highly advised to verify information from the official websites of the respective departments before making any decisions.
          </p>

          <p className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-sm">
            These terms and conditions are governed by and construed in accordance with the laws of India.
          </p>
        </div>
      </div>
    </div>
  );
}
