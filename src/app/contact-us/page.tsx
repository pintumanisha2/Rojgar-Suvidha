import { PhoneCall, Mail, MapPin } from "lucide-react";
import type { Metadata } from "next";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "Contact Us | Rojgar Suvidha — Get Help & Support",
  description: "Contact Rojgar Suvidha for job-related queries, Apply For Me service support, technical assistance, and feedback. Reach us via email, phone, or our contact form.",
  keywords: [
    "contact rojgar suvidha", "rojgar suvidha support", "apply for me help",
    "sarkari naukri portal contact", "government job help", "rojgar suvidha email"
  ],
  openGraph: {
    title: "Contact Rojgar Suvidha | Help & Support",
    description: "Reach out to Rojgar Suvidha for job portal support, Apply For Me service queries, and more.",
    url: `${BASE_URL}/contact-us`,
    siteName: "Rojgar Suvidha",
    type: "website",
  },
  alternates: { canonical: `${BASE_URL}/contact-us` },
};

export default function ContactUsPage() {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3.5 rounded-2xl">
            <PhoneCall className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Contact Us</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">We are here to help and answer any questions you might have.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Get in Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-full">
                  <Mail className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Email Address</h3>
                  <p className="text-gray-500 dark:text-gray-400">support@rojgarsuvidha.com</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-full">
                  <PhoneCall className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Phone Number</h3>
                  <p className="text-gray-500 dark:text-gray-400">+91 98765 43210</p>
                  <p className="text-xs text-gray-400 mt-1">Mon - Sat (10:00 AM - 6:00 PM)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-full">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Office Address</h3>
                  <p className="text-gray-500 dark:text-gray-400">Sector 62, Noida,<br/>Uttar Pradesh, India - 201309</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <form className="bg-gray-50 dark:bg-gray-950 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Send us a Message</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
                  <input type="text" className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input type="email" className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                  <textarea rows={4} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="How can we help you?"></textarea>
                </div>
                <button type="button" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
