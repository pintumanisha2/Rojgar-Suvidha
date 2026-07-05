import { createClient } from "@supabase/supabase-js";
import { CALENDAR_CONFIG } from "@/config/calendarConfig";
import { Printer, Calendar, BookOpen, CheckSquare, Sparkles } from "lucide-react";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 60; // Cache for 1 minute

interface PageProps {
  searchParams: Promise<{
    categories?: string;
    state?: string;
    month?: string;
  }>;
}

export default async function CalendarPrintPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categoriesParam = params.categories || "general";
  const stateParam = params.state || "";
  
  // Parse target categories
  const targetCategories = categoriesParam.split(",");
  
  // Determine Month and Year to show
  const now = new Date();
  let year = now.getFullYear();
  let monthIndex = now.getMonth(); // 0 = Jan, 6 = Jul
  
  if (params.month) {
    const parts = params.month.split("-");
    if (parts.length === 2) {
      year = parseInt(parts[0]);
      monthIndex = parseInt(parts[1]) - 1;
    }
  }

  const monthName = new Date(year, monthIndex).toLocaleString("en-IN", { month: "long" });
  const startOfMonthStr = `${year}-${(monthIndex + 1).toString().padStart(2, "0")}-01`;
  const endOfMonthStr = `${year}-${(monthIndex + 1).toString().padStart(2, "0")}-31`;

  // Fetch jobs for events
  let query = supabase
    .from("jobs")
    .select("title, category, state_code, last_date, exam_date, slug")
    .neq("status", "draft")
    .or(`last_date.gte.${startOfMonthStr},exam_date.gte.${startOfMonthStr}`)
    .or(`last_date.lte.${endOfMonthStr},exam_date.lte.${endOfMonthStr}`);

  // Category filter
  if (categoriesParam !== "general") {
    query = query.in("category", targetCategories);
  }

  // State filter
  if (stateParam) {
    const stateUpper = stateParam.toUpperCase();
    query = query.or(`state_code.eq.${stateUpper},state_code.is.null,state_code.eq.,state_code.ilike.%all%`);
  }

  const { data: jobs } = await query;
  const eventJobs = jobs || [];

  // Generate Calendar Grid
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  
  // Get start day of the week (0 = Sunday, 1 = Monday, etc.)
  // We want Monday to be index 0, Sunday to be index 6
  const rawStartDay = new Date(year, monthIndex, 1).getDay();
  const startDayOffset = rawStartDay === 0 ? 6 : rawStartDay - 1;

  const calendarDays: any[] = [];
  
  // Pad offset days
  for (let i = 0; i < startDayOffset; i++) {
    calendarDays.push({ date: null, events: [] });
  }

  // Populate actual dates
  for (let dateNum = 1; dateNum <= daysInMonth; dateNum++) {
    const currentDateStr = `${year}-${(monthIndex + 1).toString().padStart(2, "0")}-${dateNum.toString().padStart(2, "0")}`;
    
    // Find matching events on this date
    const matches = eventJobs.filter(job => {
      const isLastDate = job.last_date === currentDateStr;
      const isExamDate = job.exam_date === currentDateStr;
      return isLastDate || isExamDate;
    });

    const dayEvents = matches.map(job => {
      const type = job.last_date === currentDateStr ? "last" : "exam";
      // Clean up title for small printing
      let shortTitle = job.title.replace(/(Online Form|Recruitment|Vacancy|2026|2025)/gi, "").trim();
      if (shortTitle.length > 25) shortTitle = shortTitle.slice(0, 22) + "...";
      return {
        title: shortTitle,
        type,
        slug: job.slug
      };
    });

    calendarDays.push({
      date: dateNum,
      events: dayEvents
    });
  }

  // Pad remaining days to form a perfect grid row
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push({ date: null, events: [] });
  }

  // Determine study targets and checklist (dynamic countdown hook)
  const primaryCategory = targetCategories[0] || "general";
  const targetConfig = CALENDAR_CONFIG.studyTargets[primaryCategory] || CALENDAR_CONFIG.studyTargets.general;

  // Render QR Code using a public high-quality API (safe and no dependencies)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    CALENDAR_CONFIG.mockTestUrl + `&month=${monthName.toLowerCase()}_${year}`
  )}`;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-2 sm:p-6 print:p-0 flex flex-col items-center">
      {/* Dynamic print-optimized stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 landscape;
            margin: 6mm 8mm;
          }
          .print-scale {
            width: 280mm !important;
            height: 195mm !important;
            max-height: 195mm !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
        }
      `}} />

      {/* Control panel (Hidden on print) */}
      <div className="w-full max-w-7xl bg-white dark:bg-gray-900 shadow-md rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 no-print border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-indigo-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Your Print Preview</h1>
            <p className="text-xs text-gray-500">Scale matches landscape A4 size sheet.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Go to Home
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Sheet (Landscape A4: 297mm x 210mm scaled box) */}
      <div className="print-scale w-full max-w-7xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 p-4 sm:p-5 shadow-lg rounded-2xl flex flex-col justify-between font-sans min-h-[620px] text-gray-900 dark:text-gray-100 overflow-hidden">
        
        {/* Header Block */}
        <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-2 mb-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-black text-indigo-600">Rojgar Suvidha — Desh Ka Sabse Tezz Job Portal</span>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mt-0.5">
              {monthName} {year} <span className="text-gray-400 font-medium">| {primaryCategory.toUpperCase()} Prep Calendar</span>
            </h1>
          </div>
          <div className="text-right flex items-center gap-2">
            <div className="border border-indigo-200 dark:border-indigo-800/60 rounded-lg px-2.5 py-1 bg-indigo-50/50 dark:bg-indigo-900/10">
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Countdown Target</span>
              <p className="text-xs font-black text-indigo-700 dark:text-indigo-400">{targetConfig.monthsToGo} Months to Go!</p>
            </div>
          </div>
        </div>

        {/* Calendar & Sidebar Layout */}
        <div className="grid grid-cols-12 gap-3 flex-1">
          
          {/* 1. Main Calendar Grid (9 Columns) */}
          <div className="col-span-9 flex flex-col justify-between h-full">
            <div className="grid grid-cols-7 text-center font-bold text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest pb-1 border-b border-gray-100 dark:border-gray-800">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div className="text-red-500">Sun</div>
            </div>

            {/* Days grid container */}
            <div className="grid grid-cols-7 gap-1 mt-1.5 flex-1">
              {calendarDays.map((day, idx) => {
                const isSunday = (idx + 1) % 7 === 0;
                return (
                  <div
                    key={idx}
                    className={`min-h-[68px] border border-gray-200 dark:border-gray-800/80 rounded-lg p-1 flex flex-col justify-between ${
                      day.date ? "bg-white dark:bg-gray-850" : "bg-gray-50/40 dark:bg-gray-900/20 opacity-30"
                    } ${isSunday && day.date ? "bg-red-50/10 dark:bg-red-950/5 border-red-100 dark:border-red-900/20" : ""}`}
                  >
                    {day.date && (
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`text-xs font-extrabold ${isSunday ? "text-red-500" : "text-gray-700 dark:text-gray-300"}`}>
                          {day.date}
                        </span>
                      </div>
                    )}
                    
                    {/* Events List */}
                    <div className="flex-1 flex flex-col gap-0.5 overflow-hidden justify-end">
                      {day.events?.slice(0, 2).map((event: any, eIdx: number) => (
                        <div
                          key={eIdx}
                          className={`text-[8px] font-black px-1 py-0.5 rounded leading-tight tracking-tight truncate border ${
                            event.type === "last"
                              ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                              : "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30"
                          }`}
                          title={event.title}
                        >
                          {event.type === "last" ? "🚨 " : "📝 "}
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Side Panel - Study Tracker & QA (3 Columns) */}
          <div className="col-span-3 border-l border-gray-200 dark:border-gray-800 pl-3 flex flex-col justify-between h-full gap-2">
            
            {/* Countdown Target Box */}
            <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-2.5 text-xs">
              <span className="flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-400 mb-1 text-[10px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                This Month's Target
              </span>
              <p className="text-gray-700 dark:text-gray-350 leading-relaxed font-semibold">{targetConfig.focus}</p>
            </div>

            {/* Daily Habit Tracker Streak */}
            <div>
              <span className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                Monthly Habit Streak
              </span>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: daysInMonth }).map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 sm:w-6 sm:h-6 border border-gray-300 dark:border-gray-700 rounded flex items-center justify-center text-[8px] font-bold text-gray-400 dark:text-gray-500 cursor-pointer hover:border-indigo-500 select-none bg-white dark:bg-gray-850"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Category checklist */}
            <div>
              <span className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Daily Checklist
              </span>
              <div className="space-y-1">
                {targetConfig.checklist.map((item, index) => (
                  <div key={index} className="flex items-start gap-1 text-[9px] text-gray-600 dark:text-gray-400 font-medium">
                    <span className="mt-0.5 flex-shrink-0">⬜</span>
                    <span className="leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Mock Test redirect */}
            <div className="flex items-center gap-2.5 border-t border-gray-150 dark:border-gray-800 pt-2 bg-gray-50/50 dark:bg-gray-900/20 p-2 rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt="Mock Test QR Code"
                className="w-14 h-14 border border-gray-200 dark:border-gray-700 rounded p-0.5 bg-white flex-shrink-0"
              />
              <div>
                <span className="text-[8px] font-black text-indigo-600 uppercase tracking-wider block">Free Mock Test</span>
                <p className="text-[9px] font-extrabold text-gray-700 dark:text-gray-300 leading-tight">Scan for this month's live test challenge!</p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Current Affairs Row */}
        <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-gray-800 grid grid-cols-4 gap-2">
          <div className="col-span-4 mb-0.5 flex items-center justify-between">
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block">🔥 Cheat Sheet: Last Month's Top Current Affairs</span>
            <span className="text-[8px] text-gray-400">RojgarSuvidha.com</span>
          </div>
          {CALENDAR_CONFIG.currentAffairs.slice(0, 4).map((ca, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-1.5 border border-gray-100 dark:border-gray-800/80">
              <span className="text-[8px] font-black text-indigo-600">Q{index + 1}. {ca.question.slice(0, 60)}...</span>
              <p className="text-[8px] font-extrabold text-gray-700 dark:text-gray-300 mt-0.5">Ans: {ca.answer}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
