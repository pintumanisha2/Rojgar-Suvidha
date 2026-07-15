"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, MonitorSmartphone, CheckCircle2, Star, FileText, ShieldCheck, Zap, TrendingUp, Flame } from "lucide-react";

export default function ESuvidhaPage() {
  const services = [
    {
      category: "Identity Cards",
      items: [
        { id: "pan-new", slug: "apply-new-pan-card-online", name: "New PAN Card", desc: "Apply online for new PAN Card with Aadhaar card.", price: "150", icon: "💳", time: "3-5 Days", badge: "popular" },
        { id: "pan-correction", slug: "pan-card-correction-online", name: "PAN Card Correction", desc: "Change name, photo, signature or DOB in existing PAN.", price: "150", icon: "✏️", time: "5-7 Days" },
        { id: "voter-new", slug: "apply-new-voter-id-card", name: "New Voter ID", desc: "Voter card registration form submission online.", price: "100", icon: "🗳️", time: "10-15 Days", badge: "trending" },
        { id: "aadhaar-pvc", slug: "order-aadhaar-pvc-card", name: "Order Aadhaar PVC Card", desc: "Order official plastic PVC Aadhaar card online.", price: "100", icon: "🪪", time: "7-10 Days" },
      ]
    },
    {
      category: "Official Certificates",
      items: [
        { id: "income-cert", slug: "apply-income-certificate-online", name: "Income Certificate (Aay)", desc: "Aay Praman Patra online form filling service.", price: "100", icon: "📄", time: "7 Days" },
        { id: "caste-cert", slug: "apply-caste-certificate-online", name: "Caste Certificate (Jati)", desc: "Jati Praman Patra online apply & verification.", price: "150", icon: "📜", time: "10-15 Days" },
        { id: "domicile-cert", slug: "apply-domicile-certificate-online", name: "Domicile (Niwas)", desc: "Niwas Praman Patra / Residence Certificate apply.", price: "100", icon: "🏠", time: "7 Days" },
        { id: "pcc", slug: "apply-police-clearance-certificate-pcc", name: "Police Clearance (Character Cert)", desc: "PCC and character certificate verification form.", price: "200", icon: "👮", time: "10-15 Days" },
      ]
    },
    {
      category: "Government Schemes",
      items: [
        { id: "eshram", slug: "eshram-card-registration-online", name: "E-Shram Card Registration", desc: "Shramik card self registration and download.", price: "80", icon: "👷", time: "24 Hours", badge: "instant" },
        { id: "ayushman", slug: "ayushman-bharat-card-apply", name: "Ayushman Bharat Card", desc: "PMJAY Golden Health Card check & apply online.", price: "100", icon: "🏥", time: "24 Hours" },
        { id: "pf-withdrawal", slug: "pf-withdrawal-claim-online", name: "PF Withdrawal Form", desc: "EPFO PF withdrawal Form 31, 19, 10c online apply.", price: "200", icon: "💰", time: "48 Hours" },
      ]
    },
    {
      category: "Business & Tax",
      items: [
        { id: "udyam", slug: "msme-udyam-registration-online", name: "Udyam Aadhaar (MSME)", desc: "MSME Udyam registration certificate online.", price: "200", icon: "🏢", time: "2-3 Days" },
        { id: "itr-nil", slug: "itr-filing-nil-return", name: "ITR Filing (Nil Return)", desc: "File Income Tax Return (ITR) Nil return online.", price: "300", icon: "📊", time: "3-5 Days" },
      ]
    },
    {
      category: "Student & Career Services",
      items: [
        { id: "admit-card", slug: "download-admit-card-result", name: "Admit Card / Result Download", desc: "Get Sarkari Result and admit card prints online.", price: "30", icon: "📥", time: "1-2 Hours", badge: "trending" },
        { id: "resume-cv", slug: "professional-resume-cv-maker", name: "Professional Resume / CV Maker", desc: "Create modern job CV or resume biodata format.", price: "99", icon: "📄", time: "24 Hours" },
      ]
    },
    {
      category: "Premium Services",
      items: [
        { id: "passport", slug: "apply-passport-appointment-online", name: "Passport Appointment", desc: "Fresh or renewal passport application booking.", price: "300", icon: "✈️", time: "24 Hours" },
        { id: "driving-learner", slug: "learner-driving-license-apply", name: "Learner License Apply", desc: "Apply learning driving license online (Sarathi Parivahan).", price: "250", icon: "🚗", time: "48 Hours" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-violet-900 rounded-3xl p-6 md:p-10 mb-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold text-blue-100 mb-4 backdrop-blur-sm border border-white/20">
                <MonitorSmartphone className="w-4 h-4" />
                India's First Digital Cyber Cafe
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 tracking-tight">
                Digital Cyber Cafe & e-Suvidha Kendra Online
              </h1>
              <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-6 max-w-xl">
                Skip physical cyber cafe lines! Apply online for PAN Card, Voter ID, Income (Aay), Caste (Jati), Domicile (Niwas) Certificates, E-Shram, MSME, and Learner License directly from your mobile. Enjoy India's safest, fastest, and most affordable online form filling service with 100% expert verification.
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <span className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-green-400" /> 100% Secure
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-400" /> No Rejection
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" /> Trusted Experts
                </span>
              </div>
            </div>
            
            <div className="shrink-0 w-32 h-32 md:w-48 md:h-48 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/20 backdrop-blur-md shadow-2xl">
              <span className="text-7xl md:text-8xl">🏠</span>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {/* 🔥 Popular Services Quick-Select */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Most Popular Services</h2>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Quick Apply</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { slug: "apply-new-pan-card-online", icon: "💳", name: "New PAN Card", price: "150", badge: "🔥 #1 Popular" },
              { slug: "apply-new-voter-id-card", icon: "🗳️", name: "New Voter ID", price: "100", badge: "📈 Trending" },
              { slug: "eshram-card-registration-online", icon: "👷", name: "E-Shram Card", price: "80", badge: "⚡ Instant" },
              { slug: "itr-filing-nil-return", icon: "📊", name: "ITR Filing", price: "300", badge: "✅ Expert" },
              { slug: "download-admit-card-result", icon: "📥", name: "Admit Card Download", price: "30", badge: "🆕 Trending" },
              { slug: "order-aadhaar-pvc-card", icon: "🪪", name: "Aadhaar PVC Card", price: "100", badge: "🔒 Secure" },
            ].map(s => (
              <Link
                key={s.slug}
                href={`/e-suvidha/apply/${s.slug}`}
                className="shrink-0 flex flex-col items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:shadow-md rounded-2xl p-4 transition-all group w-36"
              >
                <span className="text-3xl mb-2">{s.icon}</span>
                <span className="text-xs font-bold text-gray-800 dark:text-white text-center leading-tight mb-1">{s.name}</span>
                <span className="text-[10px] text-indigo-500 font-bold mb-2">{s.badge}</span>
                <span className="text-xs font-black text-gray-900 dark:text-white">₹{s.price}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* All Services Grid */}
        <div className="space-y-10">
          {services.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                {section.category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {section.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/e-suvidha/apply/${item.slug}`}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between h-full cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 pointer-events-none" />
                    {/* Badge */}
                    {(item as any).badge && (
                      <div className={`absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-full z-10 ${
                        (item as any).badge === 'popular' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' :
                        (item as any).badge === 'instant' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                      }`}>
                        {(item as any).badge === 'popular' ? '🔥 Most Popular' : (item as any).badge === 'instant' ? '⚡ Instant' : '📈 Trending'}
                      </div>
                    )}

                    <div>
                      <div className="text-4xl mb-4 relative z-10">{item.icon}</div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1 leading-tight relative z-10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed relative z-10">
                        {item.desc}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold mb-4 relative z-10 flex items-center gap-1">
                        ⏱️ Est. Time: {item.time}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 relative z-10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Fees (Starting)</p>
                        <p className="font-extrabold text-lg text-gray-900 dark:text-white">₹{item.price} INR</p>
                      </div>
                      <span className="bg-indigo-50 dark:bg-indigo-900/30 group-hover:bg-indigo-600 group-hover:text-white text-indigo-700 dark:text-indigo-400 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm">
                        Apply Now →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info Banner */}
        <div className="mt-12 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 mb-16">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center shrink-0">
            <FileText className="w-8 h-8 text-amber-600 dark:text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-1">Important Note regarding Government Fees</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              The fees shown above are our <strong className="text-gray-800 dark:text-gray-200">Service Charges</strong> for filling out the forms accurately. Any official government fees (chalan) required for the service will be extra and communicated to you before final submission.
            </p>
          </div>
        </div>

        {/* SEO Content Section */}
        <article className="mt-16 pt-10 border-t border-gray-200 dark:border-gray-800">
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">India's Safest Digital Cyber Cafe & Online e-Suvidha Kendra</h2>
            <p className="mb-4">
              Welcome to the <strong>Rojgar Suvidha e-Suvidha Portal</strong>, your one-stop solution for all government document applications and registrations. Whether you need to <strong>apply for a new PAN card online</strong>, request a <strong>Voter ID correction</strong>, or register for <strong>Udyam Aadhaar (MSME)</strong>, our expert team provides hassle-free online form filling services. We aim to eliminate the need for traditional cyber cafes by offering a 100% secure, mobile-friendly, and cost-effective digital alternative.
            </p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-6 mb-2">Why Choose Our Online Form Filling Service?</h3>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li><strong>Zero Rejection Guarantee:</strong> Forms like <em>Passport Appointments</em> and <em>Police Clearance Certificates (PCC)</em> require strict accuracy. Our experts double-check every detail to ensure zero rejections.</li>
              <li><strong>Lowest Fees:</strong> Get premium services like <em>Resume Making</em>, <em>Income Certificate Apply</em>, and <em>ITR Filing (Nil Return)</em> at pocket-friendly prices tailored for students and youth.</li>
              <li><strong>Absolute Privacy:</strong> Unlike local shops, we utilize bank-level encryption. Your sensitive documents (Aadhaar, PAN, Bank Passbook) are automatically deleted from our servers post-processing.</li>
            </ul>

            <h3 className="text-xl font-black text-gray-900 dark:text-white mt-10 mb-4">Frequently Asked Questions (FAQs)</h3>
            
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Q1. How can I apply for a New PAN Card or Voter ID online?</h4>
                <p className="text-sm">Simply select the service from our identity cards section above, fill in your basic details, and upload a clear photo of your Aadhaar card and signature. Our team will handle the complex official portal process for you.</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Q2. Is my data safe with the Rojgar Suvidha e-Suvidha portal?</h4>
                <p className="text-sm">Absolutely. Your data privacy is our highest priority. All uploaded documents are strictly used for your requested service (e.g., MSME Registration, E-Shram) and are purged from our secure servers within 72 hours of task completion.</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Q3. What is the process for ITR Filing (Nil Return) or Udyam Aadhaar?</h4>
                <p className="text-sm">For business and tax services, select the respective option, upload the required basic documents (PAN, Aadhaar, Bank Details), and pay the nominal service fee. Our tax experts will file your return or register your MSME and upload the official receipt directly to your user dashboard.</p>
              </div>
            </div>

          </div>
        </article>

      </div>
    </div>
  );
}
