"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Users, ChevronRight, Sparkles } from "lucide-react";

export default function AspirantsAddaPromo() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent("openAspirantsCircle"));
  };

  if (!mounted) return null;

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-950 to-violet-950 border border-white/10 shadow-2xl p-5 sm:p-8 md:p-10">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left CTA Info */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Live Indicator Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-bold mb-4 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>🟢 1,480+ Aspirants Online Now</span>
            </div>

            {/* Premium Heading */}
            <h2 className="text-2.5xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-3">
              Aspirants Adda <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-200">
                Live Community Group Chat
              </span>
            </h2>

            {/* Subtext with Hindlish Mentor Touch */}
            <p className="text-sm sm:text-base text-indigo-200/80 leading-relaxed mb-6 max-w-xl">
              Sarkari exam ki taiyari akele kyun karna? Join India's most active community! Live updates share karein, notifications discuss karein, aur instant guidance paayein. Sabhi updates sabase pehle, direct seniors ke saath!
            </p>

            {/* Premium Dynamic Action Button */}
            <button
              onClick={handleOpenChat}
              className="group relative flex items-center justify-center gap-2.5 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base px-6 py-4 rounded-2xl shadow-xl shadow-indigo-950/50 hover:shadow-indigo-500/20 active:scale-[0.98] transition-all duration-300 w-full sm:w-auto"
            >
              <MessageSquare className="w-5 h-5 animate-pulse" />
              <span>💬 Enter Aspirants Adda (Live Group Chat)</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>

          {/* Right Live-Chat UI Mockup */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-2xl relative max-w-md w-full mx-auto">
              
              {/* Mockup Chat Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-400/20 shrink-0">
                    <Users className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Aspirants Circle</span>
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Group</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">1,482 members online</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] text-emerald-400 font-black tracking-wider uppercase">Live</span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-4 mb-4">
                {/* Bubble 1: Amit */}
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/10 shadow-sm">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-xs font-extrabold text-amber-300">Amit</span>
                      <span className="text-[9px] text-gray-500 font-medium">2 min ago</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs text-indigo-100 leading-relaxed shadow-sm">
                      Sarkari result CGL ka merit list out ho gaya hai kya? 🤔
                    </div>
                  </div>
                </div>

                {/* Bubble 2: Neha */}
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/10 shadow-sm">
                    N
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-xs font-extrabold text-pink-300">Neha</span>
                      <span className="text-[9px] text-gray-500 font-medium">1 min ago</span>
                    </div>
                    <div className="bg-gradient-to-r from-indigo-600/30 to-violet-600/30 border border-indigo-500/20 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs text-indigo-100 leading-relaxed shadow-sm">
                      Haan bhai! Direct download link <span className="text-emerald-300 font-bold">Rojgar Suvidha</span> ke homepage par active hai.
                    </div>
                  </div>
                </div>

                {/* Bubble 3: Rahul */}
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/10 shadow-sm">
                    R
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-xs font-extrabold text-sky-300">Rahul</span>
                      <span className="text-[9px] text-gray-500 font-medium">Just now</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs text-indigo-100 leading-relaxed shadow-sm">
                      Mera list mein naam aa gaya! Dev team ka form-filling super accurate hai! ❤️
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic typing simulation */}
              <div className="flex items-center gap-2 text-[10px] text-indigo-300/60 pl-11">
                <span className="flex gap-1 shrink-0">
                  <span className="w-1 h-1 rounded-full bg-indigo-300/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-indigo-300/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-indigo-300/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                <span className="font-medium">Karan is typing...</span>
              </div>

              {/* Decorative sparkles */}
              <div className="absolute -top-3 -right-3 text-yellow-400 animate-pulse pointer-events-none">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
