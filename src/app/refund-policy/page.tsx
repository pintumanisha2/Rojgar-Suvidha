import type { Metadata } from "next";
import { RefreshCcw, CheckCircle, XCircle, Clock, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy – Rojgar Suvidha",
  description:
    "Read Rojgar Suvidha's complete Refund and Cancellation Policy for our Apply For Me form-filling service. Understand eligibility, timeline, and process for refund requests.",
  alternates: { canonical: "https://www.rojgarsuvidha.com/refund-policy" },
  openGraph: {
    title: "Refund & Cancellation Policy – Rojgar Suvidha",
    description:
      "Refund and cancellation policy for Rojgar Suvidha's government form-filling assistance service.",
    url: "https://www.rojgarsuvidha.com/refund-policy",
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
          <div className="bg-orange-100 dark:bg-orange-900/30 p-3.5 rounded-2xl">
            <RefreshCcw className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Refund &amp; Cancellation Policy
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Last Updated: July 2026 | Effective Date: January 2025
            </p>
          </div>
        </div>

        {/* Legal Business Info Banner */}
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-5 mb-8">
          <h2 className="font-bold text-orange-800 dark:text-orange-300 text-sm uppercase tracking-wider mb-2">
            Merchant Information
          </h2>
          <div className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
            <p><strong>Legal Name:</strong> PINTU KUMAR</p>
            <p><strong>Business Name:</strong> Rojgar Suvidha</p>
            <p><strong>Service:</strong> Online Job Portal &amp; Application Assistance Service</p>
            <p><strong>Email:</strong> support@rojgarsuvidha.com</p>
            <p><strong>Phone:</strong> +91 88774 34088</p>
          </div>
        </div>

        {/* Service Pricing Summary */}
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 mb-8">
          <h2 className="font-bold text-indigo-800 dark:text-indigo-300 mb-3">
            Service Pricing (in INR)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-indigo-900 dark:text-indigo-200">
              <thead>
                <tr className="border-b border-indigo-200 dark:border-indigo-700 text-left">
                  <th className="pb-2 pr-4">Service</th>
                  <th className="pb-2 pr-4">Price (INR)</th>
                  <th className="pb-2">Refundable?</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-indigo-100 dark:border-indigo-800">
                  <td className="py-2 pr-4">Apply For Me — Form Filling Assistance</td>
                  <td className="py-2 pr-4 font-bold">₹50 per application</td>
                  <td className="py-2 text-red-600 dark:text-red-400 font-semibold">Non-refundable*</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Government Exam Fee (paid to portal)</td>
                  <td className="py-2 pr-4">As notified</td>
                  <td className="py-2 text-gray-500">Per govt. policy</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
            * Refundable only if we fail to complete the form due to an error on our part.
          </p>
        </div>

        <div className="space-y-8 text-gray-600 dark:text-gray-300">

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> 1. Overview
            </h2>
            <p>
              Rojgar Suvidha (owned and operated by <strong>PINTU KUMAR</strong>) offers the <strong>
                "Apply For Me"</strong> service — a paid form-filling assistance service where our team
              submits government job applications on behalf of users. The service charge is{" "}
              <strong>₹50 (Fifty Rupees) per application</strong>.
            </p>
            <p className="mt-2">
              This policy outlines the conditions under which refunds will or will not be issued.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" /> 2. Non-Refundable Cases
            </h2>
            <p className="mb-3">The ₹50 service charge is <strong>non-refundable</strong> in the following cases:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>User provided incorrect or incomplete information (name, date of birth, photo, documents).</li>
              <li>User did not pay the official government examination fee within the deadline.</li>
              <li>The application was submitted successfully but the user was later deemed ineligible by the recruiting body.</li>
              <li>The user requests cancellation after the form submission has been initiated.</li>
              <li>The application deadline was missed due to high server load on the government portal.</li>
              <li>User submitted a duplicate or unnecessary application request.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> 3. Cases Eligible for Full Refund
            </h2>
            <p className="mb-3">A <strong>full refund of ₹50 INR</strong> will be issued if:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Our team was unable to submit your form due to a technical error on our end.</li>
              <li>The payment was charged but no form-filling service was initiated within 48 hours.</li>
              <li>Duplicate payment was made for the same application.</li>
              <li>The government notification was withdrawn or postponed before form submission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" /> 4. Refund Process &amp; Timeline
            </h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>Step 1 — Request:</strong> Email us at{" "}
                <a href="mailto:support@rojgarsuvidha.com" className="text-indigo-600 hover:underline">
                  support@rojgarsuvidha.com
                </a>{" "}
                with your order ID, registered mobile number, and reason for refund.
              </li>
              <li>
                <strong>Step 2 — Review:</strong> We will review your request within 2–3 business days.
              </li>
              <li>
                <strong>Step 3 — Approval:</strong> If eligible, refund will be processed within{" "}
                <strong>5–7 business days</strong> back to your original payment method.
              </li>
              <li>
                <strong>Step 4 — Bank Processing:</strong> Depending on your bank, the amount may take an additional
                3–5 business days to reflect in your account.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              5. Cancellation Policy
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Before Form Submission Starts:</strong> You may cancel your request within 1 hour
                of payment and receive a full refund.
              </li>
              <li>
                <strong>After Submission Has Started:</strong> No cancellation is possible once our team
                has started working on your form.
              </li>
              <li>
                <strong>After Successful Submission:</strong> No cancellation or refund will be entertained.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              6. Government Exam Fees
            </h2>
            <p>
              All official government examination fees are paid directly to the respective government portals.
              Rojgar Suvidha has no control over these fees. Refunds for examination fees are governed
              entirely by the respective recruiting body's policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              7. Contact for Refund Requests
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white">PINTU KUMAR</p>
                <p>Sole Proprietor, Rojgar Suvidha</p>
                <p>Sector 62, Noida, Uttar Pradesh – 201309</p>
              </div>
              <div className="flex-1 space-y-2">
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-500" />
                  <a href="tel:+918877434088" className="text-indigo-600 hover:underline">+91 88774 34088</a>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-indigo-500">✉</span>
                  <a href="mailto:support@rojgarsuvidha.com" className="text-indigo-600 hover:underline">
                    support@rojgarsuvidha.com
                  </a>
                </p>
                <p className="text-sm text-gray-500">Mon – Sat: 10:00 AM – 6:00 PM IST</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
