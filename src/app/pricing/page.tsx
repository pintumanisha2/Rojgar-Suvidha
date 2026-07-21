import Link from "next/link";
import { CheckCircle2, ArrowLeft, Zap, ShieldCheck, Clock, Star } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Rojgar Suvidha | Apply For Me & e-Suvidha Services",
  description: "Transparent pricing for Apply For Me form-filling service and e-Suvidha digital services. Starting from ₹49. No hidden fees.",
};

const applyForMePlans = [
  {
    name: "Normal Govt Forms",
    price: "₹49",
    desc: "SSC, Railway, Police, Defence, State Govt jobs",
    features: ["Photo & Signature resize karna", "Data entry aur form fill", "Final submission", "Tracking ID milega"],
    badge: "⭐ Most Popular",
    color: "from-indigo-600 to-violet-700",
    highlight: true,
  },
  {
    name: "Complex / PSC Forms",
    price: "₹99",
    desc: "UPSC, Bank PO, State PSC, Multi-step forms",
    features: ["Sab Normal features", "Multi-step form handling", "Document verification", "Priority processing"],
    badge: null,
    color: "from-slate-700 to-slate-800",
    highlight: false,
  },
];

const eSuvidhaServices = [
  { name: "New PAN Card", price: "₹150", time: "3–5 Days", icon: "💳" },
  { name: "PAN Card Correction", price: "₹150", time: "5–7 Days", icon: "✏️" },
  { name: "New Voter ID", price: "₹100", time: "10–15 Days", icon: "🗳️" },
  { name: "Aadhaar PVC Card", price: "₹100", time: "7–10 Days", icon: "🪪" },
  { name: "Income Certificate (Aay)", price: "₹100", time: "7 Days", icon: "📄" },
  { name: "Caste Certificate (Jati)", price: "₹150", time: "10–15 Days", icon: "📜" },
  { name: "Domicile (Niwas Praman)", price: "₹100", time: "7 Days", icon: "🏠" },
  { name: "Police Clearance (PCC)", price: "₹200", time: "10–15 Days", icon: "👮" },
  { name: "E-Shram Card", price: "₹80", time: "24 Hours", icon: "👷" },
  { name: "Ayushman Bharat Card", price: "₹100", time: "24 Hours", icon: "🏥" },
  { name: "PF Withdrawal Form", price: "₹200", time: "48 Hours", icon: "💰" },
  { name: "Udyam Aadhaar (MSME)", price: "₹200", time: "2–3 Days", icon: "🏢" },
  { name: "ITR Filing (Nil Return)", price: "₹300", time: "3–5 Days", icon: "📊" },
  { name: "Passport Appointment", price: "₹300", time: "24 Hours", icon: "✈️" },
  { name: "Learner License Apply", price: "₹250", time: "48 Hours", icon: "🚗" },
  { name: "Professional Resume/CV", price: "₹99", time: "24 Hours", icon: "📄" },
];

const faqs = [
  {
    q: "Kya ye price government exam fee bhi include karti hai?",
    a: "Nahi. Ye sirf hamare service charge hain — form fill karne ki fees. Official government exam fee (SSC, Railway, UPSC etc.) alag se official website par pay hogi. Hum aapki taraf se iske baad govt portal pe submit karte hain.",
  },
  {
    q: "Payment kab karni hoti hai?",
    a: "Payment pehle karni hoti hai. Form submit hone ke baad tracking ID milti hai jisse aap status check kar sakte ho.",
  },
  {
    q: "Refund policy kya hai?",
    a: "Agar hamare error ki wajah se form reject hua toh full refund ya free re-submission. Agar official govt server issue ya user ki galat details ki wajah se reject hua toh refund nahi milega.",
  },
  {
    q: "Kitne time mein form submit hoga?",
    a: "Normal forms 24 ghante ke andar submit ho jaate hain. Complex forms mein 48 ghante tak lag sakte hain. Deadline wale urgent cases mein WhatsApp pe contact karein.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-10">

        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>

        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-black px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            💰 Transparent Pricing
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
            Form Hamara, Naukri Aapki
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto">
            No hidden charges. Govt exam fee alag hoti hai — hum sirf form fill karne ka charge lete hain.
          </p>
        </div>

        <div className="mb-14">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1">🏛️ Apply For Me — Govt Job Form Filling</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Documents upload karo, hum submit karte hain. Zero mistake guarantee.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {applyForMePlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl overflow-hidden border ${plan.highlight ? "border-indigo-400 shadow-lg shadow-indigo-500/10" : "border-gray-200 dark:border-gray-800"} bg-white dark:bg-gray-900`}
              >
                {plan.badge && (
                  <div className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow">
                    {plan.badge}
                  </div>
                )}
                <div className={`bg-gradient-to-br ${plan.color} p-6 text-white`}>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">{plan.name}</p>
                  <p className="text-4xl font-black">{plan.price}</p>
                  <p className="text-sm opacity-80 mt-1">per application</p>
                </div>
                <div className="p-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium">{plan.desc}</p>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/apply-for-me"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl transition-all shadow active:scale-95"
                  >
                    Mera Form Bharo →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure Payment</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500" /> 24hr Processing</span>
            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-500" /> 4.9★ Rating</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-orange-500" /> Zero Error Guarantee</span>
          </div>
        </div>

        <div className="mb-14">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1">🖥️ e-Suvidha — Digital Cyber Cafe Services</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Ghar baithe govt documents banwao. Cyber cafe jaane ki zaroorat nahi.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {eSuvidhaServices.map((s) => (
              <div key={s.name} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-3 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                <span className="text-2xl shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.time}</p>
                </div>
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">{s.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 text-center">
            <Link href="/e-suvidha" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition-all shadow active:scale-95">
              Sabhi e-Suvidha Services Dekhein →
            </Link>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-6">❓ Pricing FAQs</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">{faq.q}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-center text-white">
          <h3 className="text-2xl font-extrabold mb-2">Ab Intezaar Kyun?</h3>
          <p className="text-indigo-200 text-sm mb-6">Documents upload karo — form submit ho jaayega.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply-for-me" className="px-8 py-3 bg-white text-indigo-700 font-black text-sm rounded-xl hover:bg-indigo-50 transition-all shadow active:scale-95">
              Apply For Me →
            </Link>
            <Link href="/e-suvidha" className="px-8 py-3 bg-white/10 border border-white/20 text-white font-black text-sm rounded-xl hover:bg-white/20 transition-all active:scale-95">
              e-Suvidha Services →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
