import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Track Order ${id} — Rojgar Suvidha`,
    description: `Check the real-time status of your Apply For Me order. Tracking ID: ${id}`,
  };
}

async function getApplication(trackingId: string) {
  // Try user_applications first
  const { data: userApp } = await supabaseAdmin
    .from("user_applications")
    .select("tracking_id, full_name, selected_post_name, payment_status, application_status, total_paid, created_at, form_id")
    .eq("tracking_id", trackingId)
    .maybeSingle();

  if (userApp) {
    let jobTitle = userApp.selected_post_name || "Government Job Application";
    try {
      const { data: form } = await supabaseAdmin
        .from("custom_forms")
        .select("title")
        .eq("id", userApp.form_id)
        .single();
      if (form?.title) jobTitle = form.title;
    } catch {}
    return {
      trackingId: userApp.tracking_id,
      name: userApp.full_name,
      jobTitle,
      paymentStatus: userApp.payment_status,
      status: userApp.application_status || "Received",
      totalPaid: userApp.total_paid || 0,
      createdAt: userApp.created_at,
      source: "user_applications",
    };
  }

  // Try apply_for_me_requests
  const { data: afmReq } = await supabaseAdmin
    .from("apply_for_me_requests")
    .select("tracking_id, full_name, service_name, status, amount, created_at")
    .eq("tracking_id", trackingId)
    .maybeSingle();

  if (afmReq) {
    return {
      trackingId: afmReq.tracking_id,
      name: afmReq.full_name,
      jobTitle: afmReq.service_name || "e-Suvidha Service",
      paymentStatus: afmReq.status === "paid" ? "paid" : "pending",
      status: afmReq.status === "paid" ? "Received" : "Payment Pending",
      totalPaid: afmReq.amount || 0,
      createdAt: afmReq.created_at,
      source: "apply_for_me_requests",
    };
  }

  return null;
}

const STATUS_STEPS = ["Received", "Processing", "Submitted", "Completed"] as const;
type StatusStep = (typeof STATUS_STEPS)[number];

function getStepIndex(status: string): number {
  const normalized = status?.toLowerCase() || "";
  if (normalized.includes("complet")) return 3;
  if (normalized.includes("submit")) return 2;
  if (normalized.includes("process")) return 1;
  return 0; // Received
}

export default async function PublicTrackingPage({ params }: Props) {
  const { id } = await params;
  const app = await getApplication(id.toUpperCase());

  if (!app) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">❌</div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Tracking ID Not Found</h1>
          <p className="text-sm text-gray-500 mb-6">
            Tracking ID <strong className="font-mono text-indigo-600">{id}</strong> se koi order nahi mila. Please check karo — ID case-sensitive hai.
          </p>
          <Link href="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-2xl transition-colors">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const stepIndex = getStepIndex(app.status);
  const isPaid = app.paymentStatus === "paid" || app.paymentStatus === "free";
  const dateStr = app.createdAt
    ? new Date(app.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 py-12 px-4">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Branding Header */}
        <div className="text-center mb-2">
          <Link href="/" className="inline-block">
            <p className="text-xs font-black text-indigo-600 uppercase tracking-[4px]">Rojgar Suvidha</p>
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-1">Order Tracking</h1>
        </div>

        {/* Tracking ID Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-center shadow-2xl shadow-indigo-500/20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <p className="text-indigo-200 text-xs font-black uppercase tracking-widest mb-2">Tracking ID</p>
          <p className="text-4xl font-black font-mono tracking-[6px] mb-1">{app.trackingId}</p>
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black mt-2 ${isPaid ? "bg-green-500/20 text-green-300 border border-green-400/30" : "bg-amber-500/20 text-amber-200 border border-amber-400/30"}`}>
            <span className={`w-2 h-2 rounded-full ${isPaid ? "bg-green-400 animate-pulse" : "bg-amber-400 animate-pulse"}`} />
            {isPaid ? "Payment Confirmed ✓" : "Payment Pending"}
          </div>
        </div>

        {/* Application Details */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-extrabold text-gray-900 text-base flex items-center gap-2">📋 Order Details</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Applicant", value: app.name },
              { label: "Service", value: "Apply For Me" },
              { label: "Applied For", value: app.jobTitle },
              { label: "Amount Paid", value: app.totalPaid > 0 ? `₹${app.totalPaid}` : "Free" },
              { label: "Order Date", value: dateStr },
              { label: "Current Status", value: app.status },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-2xl p-3 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                <p className="text-sm font-bold text-gray-800 leading-tight">{item.value || "—"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-extrabold text-gray-900 text-base mb-5 flex items-center gap-2">⚡ Progress</h2>
          <div className="flex items-center">
            {STATUS_STEPS.map((step, i) => {
              const isDone = i <= stepIndex;
              const isActive = i === stepIndex;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all ${
                        isDone
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                          : "bg-gray-100 border-gray-200 text-gray-400"
                      } ${isActive ? "ring-4 ring-indigo-100 scale-110" : ""}`}
                    >
                      {isDone ? "✓" : i + 1}
                    </div>
                    <p className={`text-[9px] font-bold mt-1.5 text-center leading-tight ${isDone ? "text-indigo-600" : "text-gray-400"}`}>
                      {step}
                    </p>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-1 rounded-full ${i < stepIndex ? "bg-indigo-600" : "bg-gray-100"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
          <span className="text-xl shrink-0">⏰</span>
          <div>
            <p className="text-sm font-bold text-amber-800">Expected Completion: 24–48 Hours</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">Hamare experts weekdays 9am–7pm kaam karte hain. Aapko WhatsApp + Email pe confirm kar diya jayega jab form submit ho jaye.</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard?tab=applications"
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-center text-sm transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            📋 Full Dashboard →
          </Link>
          <a
            href={`https://wa.me/918877434088?text=Hi%2C%20mera%20tracking%20ID%20hai%3A%20${app.trackingId}%20%E2%80%94%20please%20status%20batao`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold rounded-2xl text-center text-sm transition-all active:scale-95"
          >
            💬 WhatsApp Support
          </a>
          <Link
            href="/latest-jobs"
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-center text-sm transition-all"
          >
            🔍 Browse More Jobs
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          &copy; {new Date().getFullYear()} Rojgar Suvidha · Noida, UP · India
        </p>
      </div>
    </div>
  );
}
