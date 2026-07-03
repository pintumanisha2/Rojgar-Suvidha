import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy – Rojgar Suvidha | Data Protection & User Rights",
  description: "Read Rojgar Suvidha's privacy policy. We are committed to protecting your personal data. Learn how we collect, use and safeguard your information on our government job portal.",
  alternates: { canonical: "https://www.rojgarsuvidha.com/privacy" },
  openGraph: {
    title: "Privacy Policy – Rojgar Suvidha",
    description: "Understand how Rojgar Suvidha protects your data and privacy while using our Sarkari Naukri job portal.",
    url: "https://www.rojgarsuvidha.com/privacy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3.5 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Privacy Policy</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Last updated: May 2026</p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
          <p className="mb-6">
            At Rojgar Suvidha, accessible from rojgarsuvidha.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Rojgar Suvidha and how we use it.
          </p>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Information We Collect</h2>
          <p className="mb-4">
            The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>When you register for an account, we may ask for your contact information, including items such as name, email address, and telephone number.</li>
            <li>If you use our "Apply For Me" service, we securely collect necessary academic and personal documents strictly for the purpose of filling out your application form.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">How We Use Your Information</h2>
          <p className="mb-4">We use the information we collect in various ways, including to:</p>
          <ul className="list-disc pl-5 mb-6 space-y-2">
            <li>Provide, operate, and maintain our website</li>
            <li>Improve, personalize, and expand our website</li>
            <li>Process your application forms on your behalf</li>
            <li>Send you emails regarding job updates, alerts, and application statuses</li>
            <li>Find and prevent fraud</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Data Security</h2>
          <p className="mb-6">
            We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. All documents uploaded for the "Apply For Me" feature are encrypted and deleted automatically after the application process is successfully completed.
          </p>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Ownership & Legal Entity</h2>
          <p className="mb-6">
            Rojgar Suvidha is owned and operated by <strong>PINTU KUMAR</strong>. All user data, files, and transaction details are handled under the sole proprietorship of PINTU KUMAR in accordance with the prevailing laws of India.
          </p>

          <p className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-sm">
            If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
          </p>
        </div>
      </div>
    </div>
  );
}
