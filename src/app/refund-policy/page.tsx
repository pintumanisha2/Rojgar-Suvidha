import { RefreshCcw } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
          <div className="bg-orange-100 dark:bg-orange-900/30 p-3.5 rounded-2xl">
            <RefreshCcw className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Refund Policy</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Our policy regarding payments and refunds for premium services.</p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
          <p className="mb-6">
            At Rojgar Suvidha, we are committed to providing you with the best possible service. This Refund Policy outlines the conditions under which refunds are provided for our paid services, specifically the "Apply For Me" service.
          </p>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Eligibility for Refund</h2>
          <p className="mb-4">Refunds will only be considered under the following circumstances:</p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li><strong>Double Payment:</strong> If you accidentally made duplicate payments for the same service.</li>
            <li><strong>Service Not Initiated:</strong> If you cancel your "Apply For Me" request before our team has started processing your application.</li>
            <li><strong>Technical Failure:</strong> If we are unable to submit your application due to a technical error on our end before the official deadline.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. Non-Refundable Cases</h2>
          <p className="mb-4">We do NOT issue refunds under the following conditions:</p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>Once the application form has been successfully submitted to the official portal and a confirmation receipt has been generated.</li>
            <li>If the application gets rejected by the authority due to incorrect documents or details provided by you.</li>
            <li>If you request a cancellation after the application process has already been initiated by our team.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Refund Processing Time</h2>
          <p className="mb-6">
            Approved refunds will be processed and credited to the original method of payment within 5-7 business days. If you haven't received a refund yet, first check your bank account again, then contact your credit card company or bank, as it may take some time before your refund is officially posted.
          </p>

          <p className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-sm">
            To request a refund, please contact our support team at <strong>support@rojgarsuvidha.com</strong> with your transaction ID.
          </p>
        </div>
      </div>
    </div>
  );
}
