import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Metadata } from "next";
import { Clock, AlertTriangle, ChevronRight, CalendarX2, Flame, Bell } from "lucide-react";

export const revalidate = 1800; // refresh every 30 min
const BASE = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: { absolute: "Jobs Closing Soon 2026 — Last Date Today, Tomorrow | Rojgar Suvidha" },
  description: "Government jobs closing today, tomorrow and this week. Don't miss deadlines! Live list of sarkari naukri last dates — updated every 30 minutes. SSC, Railway, Banking, Police, State PSC.",
  alternates: { canonical: `${BASE}/closing-soon` },
  openGraph: {
    title: "Sarkari Jobs Closing Soon — Last Date Alert 2026 | Rojgar Suvidha",
    description: "Jobs expiring today, tomorrow & this week. Check now before the deadline passes.",
    url: `${BASE}/closing-soon`,
  },
  keywords: [
    "sarkari naukri last date today", "government job closing today",
    "sarkari job deadline 2026", "last date sarkari naukri",
    "apply before last date", "jobs closing this week",
    "SSC last date 2026", "Railway application last date",
  ],
};

function daysBetween(dateStr: string): number | null {
  if (!dateStr) return null;
  try {
    const parts = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    let d: Date;
    if (parts) {
      d = new Date(+parts[3], +parts[2] - 1, +parts[1]);
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    d.setHours(0,0,0,0);
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  } catch { return null; }
}

function getLastDate(job: any): string {
  if (job.last_date) return job.last_date;
  if (Array.isArray(job.important_dates)) {
    const found = job.important_dates.find((d: any) =>
      /last\s*date|closing|deadline/i.test(d?.label || "")
    );
    return found?.value || "";
  }
  return "";
}

type Group = { label: string; color: string; bg: string; border: string; icon: string; items: any[] };

export default async function ClosingSoonPage() {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("title, slug, category, status, last_date, important_dates, state_code, total_posts")
    .neq("status", "draft")
    .neq("status", "closed")
    .neq("category", "news")
    .order("created_at", { ascending: false })
    .limit(300);

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Categorize by days remaining
  const groups: Record<string, Group> = {
    today:    { label: "🔴 Closing TODAY",         color: "text-red-700 dark:text-red-300",    bg: "bg-red-50 dark:bg-red-950/30",    border: "border-red-200 dark:border-red-800/50",    icon: "🚨", items: [] },
    tomorrow: { label: "🟠 Closing TOMORROW",      color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-800/50", icon: "⚠️", items: [] },
    week:     { label: "🟡 Closing in 2–7 Days",   color: "text-amber-700 dark:text-amber-300",  bg: "bg-amber-50 dark:bg-amber-950/30",  border: "border-amber-200 dark:border-amber-800/50",  icon: "⏰", items: [] },
    soon:     { label: "🟢 Closing in 8–15 Days",  color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800/50", icon: "📅", items: [] },
  };

  (jobs || []).forEach(job => {
    const ld = getLastDate(job);
    const days = daysBetween(ld);
    if (days === null) return;
    if (days < 0) return; // already closed
    const entry = { ...job, lastDate: ld, daysLeft: days };
    if (days === 0) groups.today.items.push(entry);
    else if (days === 1) groups.tomorrow.items.push(entry);
    else if (days <= 7) groups.week.items.push(entry);
    else if (days <= 15) groups.soon.items.push(entry);
  });

  const totalClosing = Object.values(groups).reduce((s, g) => s + g.items.length, 0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Aaj konsi sarkari naukri ki last date hai?",
        acceptedAnswer: { "@type": "Answer", text: `Rojgar Suvidha ke 'Closing Soon' page par aaj ki last date wali sarkari naukri ki list milegi. Yeh page har 30 minute mein update hota hai. Total ${groups.today.items.length} jobs aaj close ho rahi hain.` } },
      { "@type": "Question", name: "Last date ke baad form submit ho sakta hai?",
        acceptedAnswer: { "@type": "Answer", text: "Nahi. Sarkari naukri mein last date ke baad koi application accept nahi hoti. Isliye Rojgar Suvidha ka 'Closing Soon' page daily check karo aur apply kar lo." } },
      { "@type": "Question", name: "Agar last date Sunday ko hai to kya koi extension milega?",
        acceptedAnswer: { "@type": "Answer", text: "Kabhi kabhi official website last date extend karti hai. Lekin guarantee nahi hoti. Safe rahne ke liye 2 din pehle hi apply kar do." } },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 flex-wrap">
            <Link href="/" className="hover:text-red-600 font-medium">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 dark:text-white font-semibold">Closing Soon</span>
          </nav>

          {/* Hero */}
          <div className="bg-gradient-to-br from-red-700 via-red-600 to-rose-700 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-300 animate-pulse" />
                <span className="text-xs font-black text-yellow-200 uppercase tracking-widest">Live Deadline Tracker</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2">
                Sarkari Jobs — Last Date Alert 🚨
              </h1>
              <p className="text-red-100 text-sm mb-4">{dateLabel} — {totalClosing} jobs expiring soon. Apply karo time se pehle!</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Today", count: groups.today.items.length, color: "bg-red-500/40" },
                  { label: "Tomorrow", count: groups.tomorrow.items.length, color: "bg-orange-500/30" },
                  { label: "This Week", count: groups.week.items.length, color: "bg-amber-500/30" },
                  { label: "15 Days", count: groups.soon.items.length, color: "bg-emerald-500/30" },
                ].map(c => (
                  <div key={c.label} className={`${c.color} rounded-xl p-2.5 text-center border border-white/20`}>
                    <div className="text-xl font-black">{c.count}</div>
                    <div className="text-[10px] font-bold text-white/70 uppercase">{c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Groups */}
          <div className="space-y-8">
            {Object.values(groups).map(group => {
              if (group.items.length === 0) return null;
              return (
                <div key={group.label}>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${group.bg} ${group.border} border mb-4`}>
                    <Clock className={`w-4 h-4 ${group.color}`} />
                    <span className={`font-extrabold text-sm ${group.color}`}>{group.label}</span>
                    <span className={`text-xs font-bold ${group.color} opacity-70`}>({group.items.length} jobs)</span>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((job: any) => (
                      <Link key={job.slug} href={`/job/${job.slug}`}
                        className={`flex items-center justify-between gap-3 p-4 rounded-xl ${group.bg} ${group.border} border hover:shadow-md transition-all group`}>
                        <div className="flex-1 min-w-0">
                          <h2 className="font-bold text-gray-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {job.title}
                          </h2>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {job.total_posts && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                👥 {job.total_posts} Posts
                              </span>
                            )}
                            <span className={`text-xs font-black ${group.color}`}>
                              📅 Last Date: {job.lastDate}
                            </span>
                            {job.daysLeft === 0 && (
                              <span className="text-[10px] font-black text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full animate-pulse">AAKHRI DIN!</span>
                            )}
                            {job.daysLeft === 1 && (
                              <span className="text-[10px] font-black text-orange-600 bg-orange-100 dark:bg-orange-900/40 px-2 py-0.5 rounded-full">KAL DEADLINE!</span>
                            )}
                            {job.daysLeft > 1 && (
                              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{job.daysLeft} days left</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 group-hover:text-indigo-500 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}

            {totalClosing === 0 && (
              <div className="text-center py-20 text-gray-500">
                <CalendarX2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="font-bold text-lg">Abhi koi deadline nahi hai</p>
                <p className="text-sm mt-1">Naye notifications ke liye wapas aao!</p>
              </div>
            )}
          </div>

          {/* FAQ Section */}
          <div className="mt-12 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="font-extrabold text-gray-900 dark:text-white text-base mb-5 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" /> Last Date Ke Baare Mein Common Sawaal
            </h2>
            <div className="space-y-4">
              {faqSchema.mainEntity.map((faq: any, i: number) => (
                <div key={i} className="border-b border-gray-100 dark:border-zinc-800 pb-4 last:border-0 last:pb-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm mb-1.5">Q: {faq.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="mt-6 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl p-4 flex items-start gap-3">
            <Flame className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">Pro Tip: Is page ko bookmark karo</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Yeh page har 30 minute mein auto-update hota hai. Roz ek baar check karo aur koi bhi deadline miss mat karo.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
