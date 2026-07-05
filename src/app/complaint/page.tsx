"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  ArrowLeft, MessageSquareWarning, CheckCircle2,
  Loader2, User, Mail, Phone, Tag, FileText, AlertCircle
} from "lucide-react";

const CATEGORIES = [
  { value: "apply_for_me", label: "🗂️ Apply For Me - Form Related" },
  { value: "payment",      label: "💳 Payment / Refund" },
  { value: "documents",    label: "📁 Documents / Upload Issue" },
  { value: "account",      label: "👤 Account / Login Problem" },
  { value: "job_info",     label: "📋 Job Information Wrong" },
  { value: "other",        label: "💬 Other" },
];

export default function ComplaintPage() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", category: "", subject: "", message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.category || !form.subject || !form.message) {
      setError("Saare required fields bharo.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.from("complaints").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      category: form.category,
      subject: form.subject.trim(),
      message: form.message.trim(),
      status: "open",
    });

    if (err) {
      setError("Failed to submit. Please try again.");
    } else {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
            Complaint Submitted Successfully! ✅
          </h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
            We have received your complaint. We will respond to your email address within 24-48 hours.
          </p>
          <div className="space-y-3">
            <Link href="/"
              className="block w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-center transition-all shadow-lg shadow-indigo-500/30">
              Back to Home
            </Link>
            <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", category: "", subject: "", message: "" }); }}
              className="block w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-center hover:bg-gray-50 transition-all">
              Submit Another Complaint
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Wapas Jaao
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
            <MessageSquareWarning className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Complaint / Feedback</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Facing any issues? Let us know, we are here to help!</p>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Your complaint will be resolved within 24-48 hours. For emergency assistance, please contact us on WhatsApp.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  <User className="w-4 h-4" /> Aapka Naam <span className="text-red-500">*</span>
                </label>
                <input type="text" name="name" required value={form.name} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                  placeholder="Rahul Sharma" />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  <Mail className="w-4 h-4" /> Email <span className="text-red-500">*</span>
                </label>
                <input type="email" name="email" required value={form.email} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                  placeholder="rahul@gmail.com" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                <Phone className="w-4 h-4" /> Mobile Number (Optional)
              </label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} maxLength={10}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                placeholder="9876543210" />
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                <Tag className="w-4 h-4" /> Complaint Category <span className="text-red-500">*</span>
              </label>
              <select name="category" required value={form.category} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm">
                <option value="">-- Category Chunein --</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                <FileText className="w-4 h-4" /> Subject (Short) <span className="text-red-500">*</span>
              </label>
              <input type="text" name="subject" required value={form.subject} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                placeholder="e.g. Mera form submit nahi hua" />
            </div>

            {/* Message */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                <MessageSquareWarning className="w-4 h-4" /> Apni Problem Detail mein Likho <span className="text-red-500">*</span>
              </label>
              <textarea name="message" required value={form.message} onChange={handleChange} rows={5}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-sm"
                placeholder="Puri baat detail mein likho taaki hum jaldi help kar sakein..." />
            </div>

            {error && (
              <div className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-center">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-extrabold text-base shadow-lg shadow-red-500/30 transition-all disabled:opacity-60">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquareWarning className="w-5 h-5" />}
              {submitting ? "Submit Ho Raha Hai..." : "Complaint Submit Karo"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
