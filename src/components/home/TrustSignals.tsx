"use client";

import { Users, FileText, CheckCircle, ChevronLeft, ChevronRight, Phone, Video, MoreVertical, CheckCheck } from "lucide-react";
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
    role: "online",
    avatarImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
    messages: [
      { type: "in", text: "Bhaiya UP Police ka form apply ho jayega yahan se?", time: "10:14 AM" },
      { type: "out", text: "Haan bilkul, details verify karke direct portal pe apply ho jayega.", time: "10:15 AM" },
      { type: "in", text: "Bhaiya secure hai na? Payment ka receipt milega?", time: "10:16 AM" },
      { type: "out", text: "15,000+ form fill ho chuke hain, fully secure. Official PDF receipt ready!", time: "10:18 AM" },
      { type: "in", text: "Received PDF! Cyber cafe ki line se bachat. Thanks bhaiya! 🙏", time: "10:19 AM" }
    ]
  },
  {
    id: 2,
    studentName: "Vikram Sen (Patna)",
    role: "last seen today at 11:42 AM",
    avatarImg: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
    messages: [
      { type: "in", text: "SSC CGL me photo background aur size error to nahi aayega na?", time: "11:30 AM" },
      { type: "out", text: "Proper guidelines se background check and crop karte hain. Form rejection zero chance.", time: "11:32 AM" },
      { type: "in", text: "Mera CGL form submit ho gaya successfully! Double thanks!", time: "11:40 AM" }
    ]
  },
  {
    id: 3,
    studentName: "Anjali Kumari (Ranchi)",
    role: "online",
    avatarImg: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
    messages: [
      { type: "in", text: "Bhaiya, payment verification pending dikha raha tha official site par.", time: "01:05 PM" },
      { type: "out", text: "Hamare system se payment confirm ho gayi hai. Receipt PDF check karein.", time: "01:08 PM" },
      { type: "in", text: "Wah, form update ho gaya! Superfast service.", time: "01:10 PM" }
    ]
  },
  {
    id: 4,
    studentName: "Sandeep Kumar (Muzaffarpur)",
    role: "online",
    avatarImg: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80",
    messages: [
      { type: "in", text: "Bihar SI ka challan receipt mil gaya, thank you sir!", time: "02:15 PM" },
      { type: "out", text: "Welcome Sandeep! Best of luck for exam.", time: "02:16 PM" },
      { type: "in", text: "Aapka 'Apply For Me' feature bahot mast hai 👍", time: "02:18 PM" }
    ]
  },
  {
    id: 5,
    studentName: "Pooja Verma (Lucknow)",
    role: "last seen today at 03:20 PM",
    avatarImg: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80",
    messages: [
      { type: "in", text: "Sir UPPSC OTR registration complete ho gaya?", time: "03:10 PM" },
      { type: "out", text: "Yes Pooja, OTR number aur final PDF share kar di hai.", time: "03:12 PM" },
      { type: "in", text: "Got it! Ghante bhar ka kaam 5 mins me ho gaya. Thank you so much!", time: "03:15 PM" }
    ]
  },
  {
    id: 6,
    studentName: "Amit Roy (Dhanbad)",
    role: "online",
    avatarImg: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80",
    messages: [
      { type: "in", text: "IBPS PO ka declaration handwriting correct fill hua?", time: "04:02 PM" },
      { type: "out", text: "Haan, aapka uploaded declaration verified and attached hai.", time: "04:05 PM" },
      { type: "in", text: "Perfect! Trusted service, 5 stars ⭐⭐⭐⭐⭐", time: "04:07 PM" }
    ]
  },
  {
    id: 7,
    studentName: "Kavita Devi (Gaya)",
    role: "online",
    avatarImg: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80",
    messages: [
      { type: "in", text: "CTET 2026 application PDF receiving check ho gaya.", time: "05:20 PM" },
      { type: "out", text: "Great! WhatsApp alert bookmark kar lein.", time: "05:22 PM" },
      { type: "in", text: "Ab har bar yahan se hi form fill karwaungi.", time: "05:25 PM" }
    ]
  },
  {
    id: 8,
    studentName: "Rahul Sharma (Jaipur)",
    role: "last seen today at 06:10 PM",
    avatarImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
    messages: [
      { type: "in", text: "SSC GD Constable post preference sahi se daala?", time: "06:00 PM" },
      { type: "out", text: "CISF/SSF top preferences set kar diye hain as discussed.", time: "06:02 PM" },
      { type: "in", text: "A1 service bhaiya, sab friends ko recommend karunga!", time: "06:05 PM" }
    ]
  }
];

export default function TrustSignals() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const scrollAmount = 340;

      if (direction === 'right') {
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      } else {
        if (scrollLeft <= 15) {
          scrollRef.current.scrollTo({ left: scrollWidth, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
      }
    }
  };

  // Auto-scroll loop every 3.5s
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      scroll('right');
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section className="py-10 sm:py-14 bg-white dark:bg-gray-950 border-y border-gray-200 dark:border-gray-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-gradient-to-b from-emerald-50/40 to-transparent dark:from-emerald-950/10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* --- STATS COUNTER --- */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h2 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase mb-1">
              Why Students Trust Us
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              India's #1 Trusted Job Portal & Form Service
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {stats.map((stat) => (
              <div key={stat.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-800 flex items-center gap-4 hover:-translate-y-0.5 transition-transform">
                <div className={`p-3.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-0.5 tracking-tight">{stat.value}</p>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400">{stat.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- REAL WHATSAPP TESTIMONIALS CAROUSEL --- */}
        <div className="relative">
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full mb-1.5 uppercase tracking-wider">
                💬 100% Real Student Feedback
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Success Proofs from WhatsApp
              </h2>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => scroll('left')}
                className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors shadow-sm"
                aria-label="Previous chats"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => scroll('right')}
                className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors shadow-sm"
                aria-label="Next chats"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Carousel Container */}
          <div 
            ref={scrollRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="flex overflow-x-auto gap-4 sm:gap-5 pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {whatsappChats.map((chat) => (
              <div 
                key={chat.id} 
                className="min-w-[300px] max-w-[330px] shrink-0 snap-center rounded-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-[#efeae2] dark:bg-[#0b141a]"
              >
                {/* Official WhatsApp Header */}
                <div className="bg-[#075e54] dark:bg-[#1f2c34] text-white px-3.5 py-2.5 flex items-center justify-between shrink-0 shadow-md">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Privacy Blurred Avatar */}
                    <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/30 relative bg-emerald-800">
                      <img 
                        src={chat.avatarImg} 
                        alt="Candidate DP" 
                        className="w-full h-full object-cover blur-[1.5px] scale-110"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs leading-tight text-white truncate">{chat.studentName}</h4>
                      <p className="text-[10px] text-emerald-200/90 dark:text-gray-300 leading-none mt-0.5 truncate">{chat.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 shrink-0">
                    <Video className="w-4 h-4 cursor-pointer hover:text-white" />
                    <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
                    <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
                  </div>
                </div>

                {/* WhatsApp Chat Wall Body */}
                <div className="p-3 flex-1 space-y-2 min-h-[240px] flex flex-col justify-end bg-repeat opacity-95" style={{ backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 0)", backgroundSize: "12px 12px" }}>
                  {chat.messages.map((msg, mIdx) => (
                    <div 
                      key={mIdx} 
                      className={`max-w-[88%] rounded-xl px-3 py-1.5 text-xs shadow-sm leading-relaxed relative ${
                        msg.type === "out" 
                          ? "bg-[#dcf8c6] dark:bg-[#005c4b] text-gray-900 dark:text-white self-end rounded-tr-none border border-green-200/30" 
                          : "bg-white dark:bg-[#202c33] text-gray-900 dark:text-gray-100 self-start rounded-tl-none border border-gray-200/50 dark:border-gray-800/50"
                      }`}
                    >
                      <p className="pr-12 text-[12px]">{msg.text}</p>
                      
                      <div className="flex items-center gap-1 absolute bottom-1 right-2 text-[9px] text-gray-500 dark:text-gray-400">
                        <span>{msg.time}</span>
                        {msg.type === "out" && (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-500 inline" />
                        )}
                      </div>
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
