import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms & Conditions – Rojgar Suvidha | Usage Policy",
  description:
    "Read the Terms and Conditions for using Rojgar Suvidha. Understand user responsibilities, service terms, pricing, and usage guidelines for India's #1 government job portal.",
  alternates: { canonical: "https://www.rojgarsuvidha.com/terms" },
  openGraph: {
    title: "Terms & Conditions – Rojgar Suvidha",
    description:
      "Terms and conditions for using Rojgar Suvidha's Sarkari Naukri and government job portal services.",
    url: "https://www.rojgarsuvidha.com/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
          <div className="bg-gray-100 dark:bg-gray-800 p-3.5 rounded-2xl">
            <FileText className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Terms &amp; Conditions
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Last Updated: July 2026 | Effective Date: January 2025
            </p>
          </div>
        </div>

        {/* Legal Business Info Banner */}
        <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 mb-8">
          <h2 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm uppercase tracking-wider mb-2">
            Business Information
          </h2>
          <div className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
            <p><strong>Legal Name of Proprietor:</strong> PINTU KUMAR</p>
            <p><strong>Business Name:</strong> Rojgar Suvidha</p>
            <p><strong>Website:</strong> www.rojgarsuvidha.com</p>
            <p><strong>Line of Business:</strong> Online Job Portal — Government &amp; Private Job Listings, Application Assistance Service</p>
            <p><strong>Registered Address:</strong> Champanagar, Purnia, Bihar, India – 854201</p>
            <p><strong>Contact Email:</strong> support@rojgarsuvidha.com</p>
            <p><strong>Contact Phone:</strong> +91 88774 34088</p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-8">

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the website <strong>www.rojgarsuvidha.com</strong> ("the Website"),
              you agree to be bound by these Terms &amp; Conditions. These Terms constitute a legally
              binding agreement between you ("User") and <strong>PINTU KUMAR</strong>, the sole proprietor
              operating under the business name <strong>Rojgar Suvidha</strong>.
            </p>
            <p className="mt-2">
              If you do not agree with any part of these Terms, please discontinue use of the Website immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">2. Services Offered</h2>
            <p>Rojgar Suvidha provides the following services:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>Free Job Listings Portal:</strong> Access to verified government (Sarkari Naukri) and private
                sector job notifications, exam results, admit cards, and answer keys.
              </li>
              <li>
                <strong>Apply For Me Service (Paid):</strong> A premium form-filling assistance service where our
                team fills government job application forms on behalf of the user.
                <br />
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  Service Charge: ₹50 (Fifty Rupees) per application — non-refundable except in cases
                  where we are unable to complete the form due to our error.
                </span>
              </li>
              <li>
                <strong>e-Suvidha:</strong> Assistance with PAN card, Aadhaar, and other government
                digital services information.
              </li>
              <li>
                <strong>Study Rooms:</strong> Free live study group rooms for aspirants.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">3. Pricing &amp; Payment</h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Apply For Me — Service Pricing</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 font-semibold">Service</th>
                    <th className="pb-2 font-semibold">Price (INR)</th>
                    <th className="pb-2 font-semibold">Includes</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2">Form Filling Assistance</td>
                    <td className="py-2 font-bold text-indigo-600">₹50 per application</td>
                    <td className="py-2">Complete form submission + verification</td>
                  </tr>
                  <tr>
                    <td className="py-2">Exam/Application Fee</td>
                    <td className="py-2">As per official notification</td>
                    <td className="py-2">Paid directly to government portal</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">
              All payments are processed securely through Cashfree Payments. Prices are quoted in Indian
              Rupees (INR) inclusive of applicable taxes. The ₹50 service fee is separate from any
              official government examination fees.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">4. User Obligations</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must be at least 18 years of age to use our paid services.</li>
              <li>You must provide accurate, complete, and truthful information when using the Apply For Me service.</li>
              <li>You are responsible for providing your correct documents, photos, and personal details.</li>
              <li>You must not share your account credentials with others.</li>
              <li>You must not use the Website for any fraudulent, unlawful, or harmful purpose.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">5. Intellectual Property</h2>
            <p>
              All content on this Website — including job listings, articles, graphics, and software — is owned
              by or licensed to <strong>PINTU KUMAR / Rojgar Suvidha</strong>. Unauthorized reproduction,
              distribution, or use of any content is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">6. Limitation of Liability</h2>
            <p>
              Rojgar Suvidha provides job information as a reference service. We do not guarantee employment
              or selection in any examination or job. We are not responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Rejection of applications due to incorrect information provided by the user.</li>
              <li>Changes in government job notifications or examination schedules.</li>
              <li>Technical failures of third-party government portals.</li>
              <li>Any consequential, indirect, or special damages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">7. Privacy</h2>
            <p>
              Your use of this Website is also governed by our{" "}
              <a href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</a>.
              We collect and process your personal data only as described therein.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">8. Refund &amp; Cancellation</h2>
            <p>
              Our refund policy is detailed in the{" "}
              <a href="/refund-policy" className="text-indigo-600 hover:underline">Refund &amp; Cancellation Policy</a> page.
              The ₹50 service charge is generally non-refundable. Refunds are only issued if we fail to
              submit your form due to our error.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">9. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any dispute arising out of or relating to
              These Terms shall be subject to the exclusive jurisdiction of courts in Purnia, Bihar, India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of the Website after
              any changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">11. Contact for Legal Queries</h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <p><strong>PINTU KUMAR</strong></p>
              <p>Sole Proprietor, Rojgar Suvidha</p>
              <p>Champanagar, Purnia, Bihar – 854201</p>
              <p>Email: support@rojgarsuvidha.com</p>
              <p>Phone: +91 88774 34088</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
