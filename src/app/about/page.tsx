"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Target, ShieldCheck, Zap, Heart, CheckCircle2, Award, Users, Smartphone } from "lucide-react";

export default function AboutFounderPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">

      {/* ── HERO SECTION ── */}
      <div className="relative pt-20 pb-24 md:pt-32 md:pb-32 overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute top-40 -left-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-xs font-bold uppercase tracking-widest mb-6">
            <Heart className="w-4 h-4 text-pink-400" /> Humari Kahani, Aapka Bharosa
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
            Bharat Ke Har Yuva Ka <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">Apna Digital Cyber Cafe</span>
          </h1>
          <p className="text-lg md:text-xl text-indigo-100/90 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
            Mera lakshya hai cyber cafe ki lambi line, mehengi fees aur form reject hone ke darr ko hamesha ke liye khatam karna. Ghar baithe, phone se, puri accuracy ke sath.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/" className="px-8 py-3.5 bg-white text-indigo-900 font-extrabold rounded-xl shadow-xl hover:scale-105 transition-transform">
              Explore Services
            </Link>
          </div>
        </div>
      </div>

      {/* ── MEET THE FOUNDER SECTION ── */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-20">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 md:p-12 overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            {/* Image Side */}
            <div className="w-full lg:w-2/5 shrink-0 relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl transform rotate-3 scale-[1.02] opacity-20 group-hover:rotate-6 transition-transform duration-500" />
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl bg-gray-100 dark:bg-gray-800">
                {/* 
                  NOTE: Put the photo uploaded in chat into the public/images folder and name it 'akshat-ansh.jpg'. 
                  For now it uses an absolute path to that image. 
                */}
                <img
                  src="/akshat-ansh.jpg"
                  alt="Akshat Ansh - Founder of Rojgar Suvidha"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    // Fallback avatar if image isn't placed yet
                    e.currentTarget.src = "https://ui-avatars.com/api/?name=Akshat+Ansh&background=4f46e5&color=fff&size=512";
                  }}
                />

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12">
                  <h3 className="text-2xl font-black text-white">Akshat Ansh</h3>
                  <p className="text-indigo-200 font-bold text-sm">Founder & CEO, Rojgar Suvidha</p>
                </div>
              </div>
            </div>

            {/* Content Side */}
            <div className="w-full lg:w-3/5 space-y-6">
              <div className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-widest text-sm">
                <Target className="w-5 h-5" /> The Vision
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">
                "Cyber Cafe ki Pareshaniyo se <br /> Student ko azaad karna."
              </h2>

              <div className="space-y-4 text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                <p>
                  Maine aksar gaon aur chhote shehron ke bachho ko apne sarkari form bharwane ke liye ghanto Cyber Cafe ki line mein khade dekha hai. 100 rupaye ke form ke liye 200 rupaye fees li jati hai, aur chhoti si typing mistake ke karan bachho ka sapna (form rejection) toot jata hai.
                </p>
                <p>
                  Bas yahi dekh kar maine <strong>Rojgar Suvidha</strong> ki shuruat ki. Mera maksad ek aisa platform banana tha jahan India ka har student, bina kisi darr aur extra fees ke, seedha apne mobile se apna form bharwa sake.
                </p>
                <p>
                  Hamari expert team har ek application ko 3 baar verify karti hai, taaki aapke form mein 100% accuracy ho aur aapka pura dhyan sirf apni padhai aur exam par rahe.
                </p>
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">100%</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Accuracy</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">24/7</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Online Support</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">0</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rejection Rate</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">₹</div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lowest Fees</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── WHY CHOOSE US ── */}
      <div className="max-w-6xl mx-auto px-4 mt-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
            Rojgar Suvidha Hi Kyu?
          </h2>
          <p className="text-gray-500 font-medium max-w-2xl mx-auto">
            Traditional Cyber Cafe vs Rojgar Suvidha - Faisla aapke samne hai.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 z-0" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">No More Waiting</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                No more waiting in long lines. Submit your forms from the comfort of your home in a few clicks. Save time and focus on your exam preparation.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 z-0" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Military Grade Security</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Your documents are stored on our servers with 256-bit encryption, and are automatically deleted after your e-Suvidha application is processed. 100% privacy guaranteed.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 z-0" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Expert Verification</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Even a minor spelling mistake can get your application rejected. Our expert team cross-verifies every detail twice before final submission.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── LEGAL OWNERSHIP SECTION ── */}
      <div className="max-w-4xl mx-auto px-4 mt-16 text-center">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm text-gray-500 dark:text-gray-400 text-xs">
          <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">Legal Ownership Information</p>
          <p>
            Rojgar Suvidha (including all premium services and the e-Suvidha Portal) is legally owned, operated, and billed under the sole proprietorship entity name <strong>PINTU KUMAR</strong>.
          </p>
        </div>
      </div>

      {/* ── CTA SECTION ── */}
      <div className="max-w-4xl mx-auto px-4 mt-24">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay"></div>
          <div className="relative z-10">
            <Smartphone className="w-16 h-16 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-white mb-4">Ready to Start Your Digital Journey?</h2>
            <p className="text-indigo-100 mb-8 max-w-xl mx-auto font-medium">
              Create your profile today and use our Digital Locker. Click 'Apply For Me' on any job posting, and let us handle the rest!
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 hover:bg-gray-50 rounded-xl font-black text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
              Join Rojgar Suvidha <ArrowLeft className="w-5 h-5 rotate-180" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
