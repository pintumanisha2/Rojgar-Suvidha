import { Info } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "About Us | Rojgar Suvidha — India's Trusted Sarkari Naukri Portal",
  description: "Learn about Rojgar Suvidha — India's trusted government job portal. We provide 100% verified sarkari naukri updates, results, admit cards, and our exclusive 'Apply For Me' service.",
  keywords: [
    "about rojgar suvidha", "sarkari naukri portal", "government job website india",
    "rojgar suvidha mission", "apply for me service", "trusted job portal india",
    "government job updates india"
  ],
  openGraph: {
    title: "About Rojgar Suvidha | India's Trusted Sarkari Naukri Portal",
    description: "Learn about Rojgar Suvidha — providing 100% verified government job updates, results, and admit cards for India.",
    url: `${BASE_URL}/about-us`,
    siteName: "Rojgar Suvidha",
    type: "website",
  },
  alternates: { canonical: `${BASE_URL}/about-us` },
};

export default function AboutUsPage() {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3.5 rounded-2xl">
            <Info className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">About Us</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Know more about Rojgar Suvidha.</p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
          <p className="text-lg leading-relaxed mb-6">
            Welcome to <strong>Rojgar Suvidha</strong>, your number one source for all government and private job updates. We're dedicated to providing you the very best of employment news, with an emphasis on accuracy, speed, and real-time alerts.
          </p>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Our Mission</h2>
          <p className="mb-6">
            Our mission is to bridge the gap between job seekers and employers by providing a highly accessible, error-free platform. We understand how crucial career opportunities are, which is why we offer our unique "Apply For Me" feature to help candidates submit their forms without any technical hurdles or mistakes.
          </p>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Why Choose Us?</h2>
          <ul className="list-disc pl-5 mb-8 space-y-2">
            <li>Lightning-fast updates on Results, Admit Cards, and Latest Jobs.</li>
            <li>100% accurate and verified information from official sources.</li>
            <li>Exclusive Direct Apply Feature to save your time.</li>
            <li>User-friendly interface with state-wise filtering.</li>
          </ul>

          <p className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            If you have any questions or comments, please don't hesitate to <Link href="/contact-us" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">contact us</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
