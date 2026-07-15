"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneCall, Mail, MapPin, ShieldCheck, Send, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const SUBJECTS = [
  "Apply For Me Service Query",
  "e-Suvidha Service Query",
  "Job Listing Issue",
  "Refund Request",
  "Technical Support",
  "Payment Issue",
  "Other",
];

export default function ContactUsPage() {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: SUBJECTS[0], message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error("Name Required", "Please enter your full name.");
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      toast.error("Message Too Short", "Please write a message of at least 10 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Send Failed", data.error || "Something went wrong. Please try again.");
      } else {
        setSent(true);
        toast.success("Message Sent!", "We have received your message and will respond within 24 hours.");
      }
    } catch {
      toast.error("Network Error", "Could not send your message. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-10 mb-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3.5 rounded-2xl">
              <PhoneCall className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Contact Us</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">We are here to help. We typically respond within 24 hours.</p>
            </div>
          </div>

          {/* Legal Business Info */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-0">
            <h2 className="font-bold text-blue-800 dark:text-blue-300 text-sm uppercase tracking-wider mb-3">
              Merchant / Business Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-blue-900 dark:text-blue-200">
              <div>
                <p><strong>Legal Name of Proprietor:</strong> PINTU KUMAR</p>
                <p><strong>Business Name:</strong> Rojgar Suvidha</p>
                <p><strong>Business Type:</strong> Sole Proprietorship</p>
              </div>
              <div>
                <p><strong>Line of Business:</strong> Online Job Portal + Application Assistance</p>
                <p><strong>GST Status:</strong> Not registered (below threshold)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Left — Contact Info */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-7">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Get in Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-full shrink-0">
                  <Mail className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Email Address</h3>
                  <a href="mailto:support@rojgarsuvidha.com" className="text-indigo-600 hover:underline text-sm">
                    support@rojgarsuvidha.com
                  </a>
                  <p className="text-xs text-gray-400 mt-0.5">Response within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-full shrink-0">
                  <PhoneCall className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Phone Number</h3>
                  <a href="tel:+918877434088" className="text-indigo-600 hover:underline text-sm">
                    +91 88774 34088
                  </a>
                  <p className="text-xs text-gray-400 mt-1">Mon–Sat, 10:00 AM – 6:00 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-full shrink-0">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Registered Address</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    PINTU KUMAR<br />
                    Sector 62, Noida,<br />
                    Uttar Pradesh, India – 201309
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-full shrink-0">
                  <ShieldCheck className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Legal / Merchant Name</h3>
                  <p className="text-gray-700 dark:text-gray-300 font-bold">PINTU KUMAR</p>
                  <p className="text-xs text-gray-400 mt-0.5">Sole Proprietor of Rojgar Suvidha</p>
                </div>
              </div>

              {/* Policy Links */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">Important Policy Links</h3>
                <div className="space-y-1">
                  <Link href="/terms" className="block text-sm text-indigo-600 hover:underline">→ Terms &amp; Conditions</Link>
                  <Link href="/refund-policy" className="block text-sm text-indigo-600 hover:underline">→ Refund &amp; Cancellation Policy</Link>
                  <Link href="/privacy" className="block text-sm text-indigo-600 hover:underline">→ Privacy Policy</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Contact Form */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-7">
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Message Sent!</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                  We have received your message and will get back to you at <strong>{form.email}</strong> within 24 hours.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" }); }}
                  className="mt-6 text-sm text-indigo-600 hover:underline font-semibold"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Send us a Message</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Rahul Kumar"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Subject</label>
                    <select
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                    >
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="How can we help you?"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {loading ? "Sending..." : "Send Message"}
                  </button>
                  <p className="text-xs text-gray-400 text-center">
                    Or email directly:{" "}
                    <a href="mailto:support@rojgarsuvidha.com" className="text-indigo-500 hover:underline">
                      support@rojgarsuvidha.com
                    </a>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
