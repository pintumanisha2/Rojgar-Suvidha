"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar, Clock, Flame, Search, Filter,
  ChevronRight, Users, BookOpen, ExternalLink,
  Bell, Star, AlertTriangle, CheckCircle,
  ArrowRight, Bookmark, TrendingUp,
} from "lucide-react";

interface Exam {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  lastDateApply: string;
  registrationDate: string;
  category: string;
  vacancies: string;
  eligibility: string;
  ageLimit: string;
  officialUrl: string;
  emoji: string;
  color: string;
}

interface Props {
  exams: Exam[];
}

const CATEGORIES = ["All", "SSC", "Railway", "Banking", "UPSC", "Police", "Defence", "Teaching", "State PSC"];

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string; glow: string }> = {
  blue:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   badge: "bg-blue-600",   glow: "shadow-blue-500/20" },
  red:    { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    badge: "bg-red-600",    glow: "shadow-red-500/20" },
  green:  { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  badge: "bg-green-600",  glow: "shadow-green-500/20" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-600", glow: "shadow-purple-500/20" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", badge: "bg-indigo-600", glow: "shadow-indigo-500/20" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", badge: "bg-orange-600", glow: "shadow-orange-500/20" },
  yellow: { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200",  badge: "bg-amber-600",  glow: "shadow-amber-500/20" },
  teal:   { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200",   badge: "bg-teal-600",   glow: "shadow-teal-500/20" },
};

function CountdownTimer({ targetDate, label }: { targetDate: string; label: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, expired: false });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, expired: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        expired: false,
      });
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg">
        <AlertTriangle className="w-3.5 h-3.5" />
        {label} Closed
      </div>
    );
  }

  const isUrgent = timeLeft.days <= 7;
  return (
    <div className={`flex items-center gap-2 text-xs font-bold px-2.5 py-1.5 rounded-lg border ${
      isUrgent
        ? "text-rose-700 bg-rose-50 border-rose-200 animate-pulse"
        : "text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"
    }`}>
      {isUrgent ? <Flame className="w-3.5 h-3.5 text-rose-500" /> : <Clock className="w-3.5 h-3.5" />}
      <span className="tabular-nums">
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.mins}m
      </span>
      <span className="text-slate-500 font-medium">{label}</span>
    </div>
  );
}

function ExamCard({ exam }: { exam: Exam }) {
  const c = colorMap[exam.color] || colorMap.blue;
  const lastDate = new Date(exam.lastDateApply);
  const examDate = new Date(exam.startDate);
  const now = new Date();
  const isLastDatePassed = lastDate < now;
  const daysToLastDate = Math.ceil((lastDate.getTime() - now.getTime()) / 86400000);
  const isUrgent = !isLastDatePassed && daysToLastDate <= 15;

  return (
    <div className={`group relative bg-white rounded-3xl border ${c.border} hover:border-opacity-70 shadow-sm hover:shadow-xl ${c.glow} transition-all duration-300 hover:-translate-y-1 overflow-hidden`}>
      {/* Top accent bar */}
      <div className={`h-1.5 w-full ${c.badge}`} />

      {/* Urgency banner */}
      {isUrgent && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse z-10">
          <Flame className="w-3 h-3 fill-white" />
          LAST {daysToLastDate} DAYS
        </div>
      )}
      {isLastDatePassed && (
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full z-10">
          <CheckCircle className="w-3 h-3" />
          CLOSED
        </div>
      )}

      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`text-3xl shrink-0 p-2.5 ${c.bg} rounded-2xl`}>
            {exam.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-[10px] font-extrabold uppercase tracking-widest ${c.text} ${c.bg} px-2 py-0.5 rounded-full border ${c.border} mb-1.5`}>
              {exam.category}
            </span>
            <h2 className={`text-base font-extrabold text-slate-900 group-hover:${c.text} transition-colors leading-snug`}>
              {exam.name}
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">
          {exam.description}
        </p>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className={`${c.bg} rounded-xl p-3 border ${c.border}`}>
            <p className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Vacancies</p>
            <p className={`text-sm font-extrabold ${c.text}`}>{exam.vacancies}</p>
          </div>
          <div className={`${c.bg} rounded-xl p-3 border ${c.border}`}>
            <p className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Eligibility</p>
            <p className="text-sm font-extrabold text-slate-700 dark:text-zinc-300 truncate">{exam.eligibility}</p>
          </div>
          <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-3 border border-slate-200 dark:border-zinc-800">
            <p className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Age Limit</p>
            <p className="text-sm font-extrabold text-slate-700 dark:text-zinc-300">{exam.ageLimit}</p>
          </div>
          <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-3 border border-slate-200 dark:border-zinc-800">
            <p className="text-[9px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Exam Date</p>
            <p className="text-sm font-extrabold text-slate-700 dark:text-zinc-300">
              {examDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Last Date Countdown */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Last Date to Apply</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-extrabold ${isLastDatePassed ? "text-slate-400 dark:text-zinc-500 line-through" : "text-slate-800"}`}>
              {lastDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            <CountdownTimer targetDate={exam.lastDateApply} label="left" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
          <a
            href={exam.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 ${c.badge} text-white text-xs font-extrabold rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-sm`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Apply Official
          </a>
          <Link
            href="/latest-jobs"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-extrabold rounded-xl transition-colors active:scale-95"
          >
            Details
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Monthly view grouping
function groupByMonth(exams: Exam[]) {
  const groups: Record<string, Exam[]> = {};
  exams.forEach(exam => {
    const d = new Date(exam.lastDateApply);
    const key = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = [];
    groups[key].push(exam);
  });
  return groups;
}

export default function ExamCalendarClient({ exams }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [sortBy, setSortBy] = useState<"lastDate" | "examDate" | "vacancies">("lastDate");

  const filtered = exams
    .filter(e =>
      (selectedCategory === "All" || e.category === selectedCategory) &&
      (searchQuery === "" ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "lastDate") return new Date(a.lastDateApply).getTime() - new Date(b.lastDateApply).getTime();
      if (sortBy === "examDate") return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      // vacancies sort — extract number
      const getNum = (v: string) => parseInt(v.replace(/[^0-9]/g, "")) || 0;
      return getNum(b.vacancies) - getNum(a.vacancies);
    });

  const monthGroups = groupByMonth(filtered);
  const totalVacancies = exams.reduce((sum, e) => {
    const n = parseInt(e.vacancies.replace(/[^0-9]/g, "")) || 0;
    return sum + n;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Hero Section ──────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 text-white overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold mb-6 border border-white/20">
            <Calendar className="w-4 h-4 text-yellow-300" />
            Updated — May 2025
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
            Government Exam
            <span className="block text-yellow-300">Calendar 2025–2026</span>
          </h1>
          <p className="text-indigo-100 text-base sm:text-lg max-w-2xl mb-8 leading-relaxed">
            Sabhi upcoming sarkari exams ek jagah. Last dates, eligibility, vacancies aur countdown — sabh kuch track karo bina kisi website browse kiye.
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl">
            {[
              { label: "Exams Listed", value: `${exams.length}+`, icon: BookOpen },
              { label: "Total Vacancies", value: `${(totalVacancies / 1000).toFixed(0)}K+`, icon: Users },
              { label: "Categories", value: `${CATEGORIES.length - 1}`, icon: Filter },
            ].map(s => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/15 text-center">
                <s.icon className="w-5 h-5 text-yellow-300 mx-auto mb-1.5" />
                <p className="text-xl sm:text-2xl font-extrabold">{s.value}</p>
                <p className="text-indigo-200 text-[10px] sm:text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters & Controls ────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search exams..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-zinc-800 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white dark:bg-gray-800 text-slate-900 dark:text-white transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-nowrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-extrabold border transition-all active:scale-95 whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white border-transparent shadow-sm"
                      : "bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-zinc-800 dark:border-gray-700 hover:border-indigo-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 dark:border-zinc-800 dark:border-slate-700 rounded-xl text-xs font-bold outline-none bg-white dark:bg-gray-800 text-slate-700 dark:text-zinc-300 dark:text-gray-300 cursor-pointer"
              >
                <option value="lastDate">Sort: Last Date</option>
                <option value="examDate">Sort: Exam Date</option>
                <option value="vacancies">Sort: Vacancies</option>
              </select>

              <div className="flex bg-slate-100 dark:bg-gray-800 rounded-xl p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
                  title="Grid View"
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    {[1,2,3,4].map(i => <div key={i} className={`rounded-[2px] ${viewMode === "grid" ? "bg-indigo-600" : "bg-slate-400"}`} />)}
                  </div>
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === "timeline" ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
                  title="Timeline View"
                >
                  <div className="w-4 h-4 flex flex-col gap-1 justify-center">
                    {[1,2,3].map(i => <div key={i} className={`h-0.5 rounded-full ${viewMode === "timeline" ? "bg-indigo-600" : "bg-slate-400"}`} />)}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Active filter indicator */}
          {(selectedCategory !== "All" || searchQuery) && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-500">{filtered.length} exams found</span>
              <button
                onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-zinc-800 dark:border-gray-800 p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-bold text-slate-700 dark:text-zinc-300 dark:text-gray-300">No exams found</p>
            <p className="text-sm text-slate-400 dark:text-zinc-500 mt-1">Try a different search or category</p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((exam, i) => <ExamCard key={i} exam={exam} />)}
          </div>
        ) : (
          /* Timeline View — grouped by month */
          <div className="space-y-10">
            {Object.entries(monthGroups).map(([month, monthExams]) => (
              <div key={month}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-extrabold text-sm shadow-md">
                    <Calendar className="w-4 h-4" />
                    {month}
                  </div>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                  <span className="text-xs font-bold text-slate-400 dark:text-zinc-500">{monthExams.length} deadline{monthExams.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-3">
                  {monthExams.map((exam, i) => {
                    const c = colorMap[exam.color] || colorMap.blue;
                    const lastDate = new Date(exam.lastDateApply);
                    return (
                      <div key={i} className={`flex items-center gap-4 bg-white dark:bg-gray-900 rounded-2xl border ${c.border} p-4 hover:shadow-md transition-all group`}>
                        <div className={`text-2xl p-2.5 ${c.bg} rounded-xl shrink-0`}>{exam.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${c.text}`}>{exam.category}</span>
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">{exam.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{exam.vacancies} vacancies • {exam.eligibility}</p>
                        </div>
                        <div className="text-right shrink-0 hidden sm:block">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Last Date</p>
                          <p className="text-sm font-extrabold text-slate-800 dark:text-gray-200">
                            {lastDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                          <CountdownTimer targetDate={exam.lastDateApply} label="" />
                        </div>
                        <a
                          href={exam.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`shrink-0 ${c.badge} text-white p-2 rounded-xl hover:opacity-90 transition-opacity active:scale-95`}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── AEO FAQ Section ────────────────────────────────────── */}
        <div className="mt-16 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-zinc-800 dark:border-gray-800 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 sm:p-8 text-white">
            <h2 className="text-2xl font-extrabold mb-2 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-yellow-300" />
              Frequently Asked Questions
            </h2>
            <p className="text-indigo-200 text-sm">Sabse zyada puche jaane wale sawaal — exams ke baare mein</p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {[
              {
                q: "2025 mein sabse zyada vacancies wala government exam kaun sa hai?",
                a: "2025 mein sabse zyada vacancies hain UP Police Constable mein (60,244 vacancies), uske baad Indian Army Agniveer (25,000+), SSC CGL 2025 (17,727 vacancies), aur RRB NTPC 2025 (11,558 vacancies). Exam Calendar pe 'Vacancies' sort option use karein.",
              },
              {
                q: "SSC CGL 2025 ki last date miss ho gayi — ab kya karein?",
                a: "Agar SSC CGL 2025 ki last date nikal gayi hai, toh aap doosre upcoming SSC exams dekh sakte hain jaise SSC CHSL, SSC MTS, ya SSC CPO. Rojgar Suvidha ka Telegram channel join karein — agle recruitment ke liye instant notification milega.",
              },
              {
                q: "10th pass ke liye 2025 mein kaunse government exams hain?",
                a: "10th pass candidates ke liye: Indian Army Agniveer (17.5-21 years), SSC MTS (Multi-Tasking Staff), RRB Group D (10th + ITI), UP Police Constable, aur RPF Constable. Ye sab exams 2025 mein scheduled hain. Rojgar Suvidha pe 'Latest Jobs' section mein '10th Pass' filter use karein.",
              },
              {
                q: "Government exam ki preparation ke liye best strategy kya hai?",
                a: "Effective preparation ke liye: 1) Exam notification se syllabus download karein 2) Previous year papers solve karein (kam se kam 5 saal ke) 3) Weekly mock tests dein 4) Daily current affairs padhe 5) Consistent 6-8 ghante ki study karein. Exam Calendar bookmark karein taaki last dates yaad rahein.",
              },
            ].map((faq, i) => (
              <div key={i} className="border-b border-slate-100 dark:border-gray-800 pb-6 last:border-0 last:pb-0">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2 flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center text-[10px] font-extrabold mt-0.5">Q</span>
                  {faq.q}
                </h3>
                <p className="text-sm text-slate-600 dark:text-gray-400 font-medium leading-relaxed ml-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Telegram CTA ───────────────────────────────────────── */}
        <div className="mt-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/15 rounded-2xl shrink-0">
              <Bell className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold mb-1">Exam Dates Miss Mat Karo!</h3>
              <p className="text-emerald-100 text-sm max-w-md">
                Telegram channel join karo — last date se 7 din pehle automatic reminder milega. 5 lakh+ aspirants already join kar chuke hain!
              </p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <a
              href="https://t.me/rojgarsuvidha"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-white text-emerald-700 font-extrabold text-sm rounded-xl hover:bg-emerald-50 transition-colors shadow-lg active:scale-95"
            >
              Join Telegram
              <ChevronRight className="w-4 h-4" />
            </a>
            <Link
              href="/latest-jobs"
              className="flex items-center gap-2 px-5 py-3 bg-white/15 text-white font-extrabold text-sm rounded-xl hover:bg-white/25 transition-colors active:scale-95 border border-white/20"
            >
              All Jobs
            </Link>
          </div>
        </div>

        {/* ── SEO Content Block ─────────────────────────────────── */}
        <div className="mt-8 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-zinc-800 dark:border-gray-800 p-6 sm:p-8">
          <article className="prose dark:prose-invert max-w-none prose-sm prose-headings:font-extrabold prose-h2:text-xl prose-p:text-slate-600 dark:prose-p:text-gray-400">
            <h2>Government Exam Calendar 2025-2026: Complete Guide</h2>
            <p>
              India mein har saal lakho government jobs aate hain different departments se — <strong>SSC, UPSC, Railway, Banking, Police, Defence, Teaching</strong> aur State PSCs. Lekin problem yeh hai ki har department ka apna alag schedule hota hai aur notifications alag-alag websites par aati hain. Isi problem ko solve karne ke liye Rojgar Suvidha ne yeh comprehensive <strong>Exam Calendar 2025-2026</strong> banaya hai.
            </p>

            <h3>Is Exam Calendar Se Kya Fayda Hoga?</h3>
            <ul>
              <li><strong>Ek Jagah Sabhi Dates:</strong> SSC, UPSC, Railway, Banking sab ka schedule ek hi page par</li>
              <li><strong>Live Countdown Timers:</strong> Last date se kitne din baaki hain — real-time countdown</li>
              <li><strong>Category Filter:</strong> Sirf apni category ke exams dekho — waste of time nahi</li>
              <li><strong>Direct Official Links:</strong> Seedha official website par apply karo — koi redirect nahi</li>
              <li><strong>Monthly Timeline View:</strong> Month-wise view se planning aasaan ho jaati hai</li>
            </ul>

            <h3>2025 Ke Important Government Exam Dates</h3>
            <p>
              <strong>SSC CGL 2025</strong> ek sabse bada exam hai is saal — 17,727 vacancies ke saath September 2025 mein scheduled hai. <strong>UP Police Constable 2025</strong> mein 60,244 vacancies hain jo 12th pass ke liye hain. <strong>RRB NTPC 2025</strong> mein 11,558 vacancies hain graduation ke liye October-November 2025 mein. <strong>IBPS PO 2025</strong> October mein aur <strong>SBI PO 2025</strong> November mein hai.
            </p>

            <p className="text-slate-500 text-xs mt-6">
              <strong>Disclaimer:</strong> Ye dates approximate hain aur official notifications par based hain. Final dates confirm karne ke liye hamesha official government websites check karein. Rojgar Suvidha ek educational information portal hai aur kisi government organization se affiliated nahi hai.
            </p>
          </article>
        </div>

      </div>
    </div>
  );
}
