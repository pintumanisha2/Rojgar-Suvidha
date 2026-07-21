"use client";

import { Users, FileText, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const stats = [
  {
    id: 1,
    name: "Active Students",
    value: "1.5 Lakh+",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: 2,
    name: "Forms Filled (Apply For Me)",
    value: "15,000+",
    icon: FileText,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    id: 3,
    name: "Verified Job Updates",
    value: "5,000+",
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
];

const whatsappChats = [
  {
    id: 1,
    studentName: "Ritesh Ojha (Gorakhpur)",
    role: "UP Police Aspirant",
    avatar: "R",
    messages: [
      { type: "in", text: "Bhaiya UP Police ka form apply ho jayega yahan se?" },
      { type: "out", text: "Haan bilkul, details verify karke direct portal pe apply ho jayega." },
      { type: "in", text: "Bhaiya secure hai na? Payment ka receipt milega?" },
      { type: "out", text: "15,000+ form fill ho chuke hain, fully secure. Submit hote hi official PDF receipt denge. Done!" },
      { type: "in", text: "Received PDF! Bhaiya best service hai, cyber cafe me line lagne ki tension khatam. Dhanyawad! 🙏" }
    ]
  },
  {
    id: 2,
    studentName: "Vikram Sen (Patna)",
    role: "SSC CGL Aspirant",
    avatar: "V",
    messages: [
      { type: "in", text: "SSC CGL me photo background aur size error to nahi aayega na? Form reject nahi hona chahiye." },
      { type: "out", text: "Hum proper guidelines se background size crop and check karte hain. Submit karne se pehle screenshot share karke confirm karwate hain." },
      { type: "in", text: "Bhaiya ye feature mast hai. Mera CGL form submit ho gaya successfully! Verification verification ke liye double thanks!" }
    ]
  },
  {
    id: 3,
    studentName: "Anjali Kumari (Ranchi)",
    role: "Railway NTPC Aspirant",
    avatar: "A",
    messages: [
      { type: "in", text: "Bhaiya, payment verification pending dikha raha tha official website par." },
      { type: "out", text: "Humare system se direct payment confirm ho gayi hai. Payment receipt updates WhatsApp par check karein." },
      { type: "in", text: "Wah, form update ho gaya! Cyber cafe jaane ki jarurat hi nahi padti ab." }
    ]
  }
];

export default function TrustSignals() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const scrollAmount = 350;

      if (direction === 'right') {
        // If reached end, scroll back to start
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      } else {
        // If at start, scroll to end
        if (scrollLeft <= 10) {
          scrollRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
      }
    }
  };

  // Auto-scroll logic
  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      scroll('right');
    }, 4500); // Scrolls every 4.5 seconds
    
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section className="py-12 bg-white dark:bg-gray-950 border-y border-gray-200 dark:border-gray-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* --- STATS COUNTER --- */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase mb-2">
              Why Students Trust Us
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              India's Fastest Growing Job Portal
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <div key={stat.id} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-5 transform hover:-translate-y-1 transition-transform">
                <div className={`p-4 rounded-2xl ${stat.bg}`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">{stat.value}</p>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{stat.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- TESTIMONIALS CAROUSEL --- */}
        <div className="relative">
          <div className="flex items-end justify-between mb-8">
            <div className="text-left">
              <h2 className="text-sm font-extrabold text-orange-600 dark:text-orange-400 tracking-wider uppercase mb-2">
                Student Chat Reviews
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                Success proofs from WhatsApp
              </p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => scroll('left')}
                className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scroll('right')}
                className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Container */}
          <div 
            ref={scrollRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {whatsappChats.map((chat) => (
              <div 
                key={chat.id} 
                className="min-w-[310px] max-w-[340px] shrink-0 snap-center bg-gray-150 dark:bg-zinc-900 rounded-3xl border border-gray-250/70 dark:border-zinc-800 relative flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* WhatsApp Chat Box Header */}
                <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 border border-white/20 flex items-center justify-center font-extrabold text-xs">
                      {chat.avatar}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs leading-tight">{chat.studentName}</h4>
                      <p className="text-[10px] text-emerald-100/80 leading-none">{chat.role}</p>
                    </div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-450 animate-pulse" />
                </div>

                {/* WhatsApp Chat Body */}
                <div className="p-4 flex-1 space-y-2.5 bg-[#efeae2] dark:bg-zinc-950/70 min-h-[220px] flex flex-col justify-end">
                  {chat.messages.map((msg, mIdx) => (
                    <div 
                      key={mIdx} 
                      className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-xs shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] leading-relaxed ${
                        msg.type === "out" 
                          ? "bg-[#d9fdd3] dark:bg-emerald-900/40 text-gray-800 dark:text-emerald-100 self-end rounded-tr-none" 
                          : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 self-start rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
