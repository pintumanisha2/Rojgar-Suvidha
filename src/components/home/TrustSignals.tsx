"use client";

import { Users, FileText, CheckCircle, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const stats = [
  {
    id: 1,
    name: "Active Students",
    value: "15,400+",
    icon: Users,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: 2,
    name: "Forms Filled (Apply For Me)",
    value: "850+",
    icon: FileText,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    id: 3,
    name: "Verified Job Updates",
    value: "1,200+",
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
];

const seedTestimonials = [
  {
    id: 'seed-1',
    content: "Pehle form bharne me hamesha error aata tha. Rojgar Suvidha's 'Apply For Me' feature did my job in 5 mins. Zero error, full trust!",
    author: "Rahul Kumar",
    role: "SSC Aspirant",
    location: "Patna, Bihar",
    rating: 5,
  },
  {
    id: 'seed-2',
    content: "I get job updates here first. Their Telegram group is very fast. No tension of fake jobs because everything is verified.",
    author: "Priya Sharma",
    role: "Banking Aspirant",
    location: "Jaipur, RJ",
    rating: 5,
  }
];

export default function TrustSignals() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [liveTestimonials, setLiveTestimonials] = useState<any[]>(seedTestimonials);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("is_visible", true)
          .order("created_at", { ascending: false })
          .limit(6);
          
        if (data && data.length > 0) {
          const formatted = data.map((r: any) => ({
            id: r.id,
            content: r.review_text || "Great service! Highly recommended.",
            author: r.reviewer_name || "Aspirant",
            role: "Verified User",
            location: "India",
            rating: r.rating || 5,
          }));
          
          if (formatted.length >= 2) {
             setLiveTestimonials(formatted);
          } else {
             setLiveTestimonials([...formatted, ...seedTestimonials.slice(formatted.length)]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      }
    }
    fetchReviews();
  }, []);

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
    }, 3000); // Scrolls every 3 seconds
    
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
                Student Reviews
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                Loved by thousands
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
            {liveTestimonials.map((testimonial) => (
              <div 
                key={testimonial.id} 
                className="min-w-[300px] max-w-[320px] shrink-0 snap-center bg-gray-50 dark:bg-gray-900/50 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 relative flex flex-col"
              >
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 text-indigo-200 dark:text-indigo-900/40">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  {testimonial.rating === 4 && <Star className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 font-medium relative z-10 flex-1">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-3 border-t border-gray-200 dark:border-gray-800 pt-4 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{testimonial.author}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role} • {testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
