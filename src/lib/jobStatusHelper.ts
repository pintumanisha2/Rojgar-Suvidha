export interface JobStatusBadge {
  label: string;
  dot: string;
  text: string;
  bg: string;
  state: "active" | "urgent" | "today" | "closing_soon" | "closing_today" | "closed" | "live" | "completed" | "new" | "soon";
  daysRemaining?: number;
  detailText?: string;
}

// ── Date parser (matches cron logic) ─────────────────────────────────────────
function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  // ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) { const d = new Date(s + "T00:00:00"); return isNaN(d.getTime()) ? null : d; }
  // DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmy) { const d = new Date(`${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}T00:00:00`); return isNaN(d.getTime()) ? null : d; }
  // Natural language ("31 Aug 2026")
  try { const d = new Date(s); return isNaN(d.getTime()) ? null : d; } catch { return null; }
}

function daysFromNow(date: Date): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}

// ── Extract last date from important_dates ────────────────────────────────────
function extractLastDate(importantDates: any[]): string {
  if (!Array.isArray(importantDates)) return "";
  const found = importantDates.find((d: any) =>
    /last\s*date|closing|deadline|apply.*last|last.*apply/i.test(d?.label || "")
  );
  return found?.value || "";
}

// ── Extract exam date from important_dates ────────────────────────────────────
function extractExamDate(importantDates: any[]): string {
  if (!Array.isArray(importantDates)) return "";
  const found = importantDates.find((d: any) =>
    /exam\s*date|test\s*date|written\s*exam/i.test(d?.label || "")
  );
  return found?.value || "";
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export function getJobStatusBadge(job: {
  category?: string;
  lastDate?: string;          // Direct last_date column value
  important_dates?: any[];
  exam_date?: string;
  created_at?: string;
  status?: string;            // DB status: active | closing_soon | closing_today | closed
  apply_status?: string;      // open | coming_soon | closed
}): JobStatusBadge {
  const cat         = (job.category    || "").toLowerCase().trim();
  const dbStatus    = (job.status      || "active").toLowerCase();
  const applyStatus = (job.apply_status || "").toLowerCase();

  // Resolve dates
  const rawLastDate = job.lastDate
    || (job.important_dates ? extractLastDate(job.important_dates) : "");
  const rawExamDate = job.exam_date
    || (job.important_dates ? extractExamDate(job.important_dates) : "");

  // ── 1. ADMIT CARD ─────────────────────────────────────────────────────────
  if (cat.includes("admit")) {
    const examParsed = rawExamDate ? parseDate(rawExamDate) : null;
    if (examParsed && daysFromNow(examParsed) < 0) {
      return {
        label: "Exam Done", dot: "bg-slate-400",
        text: "text-slate-600 dark:text-slate-400",
        bg: "bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700",
        state: "completed", detailText: `Exam was on ${rawExamDate}`,
      };
    }
    if (examParsed) {
      const d = daysFromNow(examParsed);
      if (d === 0) return { label: "Exam Today!", dot: "bg-red-500 animate-pulse", text: "text-red-700 dark:text-red-300 font-extrabold", bg: "bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800", state: "today", detailText: "Exam is TODAY" };
      if (d <= 3) return { label: `Exam in ${d}d`, dot: "bg-amber-500 animate-pulse", text: "text-amber-700 dark:text-amber-300 font-bold", bg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40", state: "urgent", detailText: `Exam in ${d} days` };
    }
    return {
      label: "Download Now", dot: "bg-orange-500 animate-pulse",
      text: "text-orange-700 dark:text-orange-300",
      bg: "bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40",
      state: "live", detailText: rawExamDate ? `Exam: ${rawExamDate}` : "Hall Ticket Available",
    };
  }

  // ── 2. RESULTS ────────────────────────────────────────────────────────────
  if (cat.includes("result")) {
    return {
      label: "Result Live", dot: "bg-emerald-500 animate-pulse",
      text: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40",
      state: "live", detailText: "Merit List & Scorecard Live",
    };
  }

  // ── 3. ANSWER KEY ────────────────────────────────────────────────────────
  if (cat.includes("answer")) {
    if (rawLastDate) {
      const parsed = parseDate(rawLastDate);
      if (parsed && daysFromNow(parsed) < 0) {
        return {
          label: "Key Closed", dot: "bg-gray-400",
          text: "text-gray-600 dark:text-gray-400",
          bg: "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700",
          state: "closed", detailText: "Objection Window Closed",
        };
      }
    }
    return {
      label: "Key Live", dot: "bg-purple-500 animate-pulse",
      text: "text-purple-700 dark:text-purple-300",
      bg: "bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40",
      state: "live", detailText: "Answer Key & Objections Live",
    };
  }

  // ── 4. DB status from cron lifecycle ─────────────────────────────────────
  if (dbStatus === "closed") {
    return {
      label: "Closed", dot: "bg-gray-500",
      text: "text-gray-600 dark:text-gray-400",
      bg: "bg-gray-100 dark:bg-zinc-800/80 border border-gray-300 dark:border-zinc-700",
      state: "closed", detailText: rawLastDate ? `Last Date was ${rawLastDate}` : "Application Closed",
    };
  }

  if (dbStatus === "closing_today") {
    return {
      label: "Today Last Date!", dot: "bg-red-500 animate-pulse",
      text: "text-red-700 dark:text-red-300 font-extrabold",
      bg: "bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800",
      state: "today", daysRemaining: 0, detailText: "APPLICATION ENDS TODAY!",
    };
  }

  if (dbStatus === "closing_soon") {
    const parsed = rawLastDate ? parseDate(rawLastDate) : null;
    const d = parsed ? daysFromNow(parsed) : null;
    if (d !== null && d === 1) {
      return {
        label: "Tomorrow Last!", dot: "bg-amber-500 animate-pulse",
        text: "text-amber-700 dark:text-amber-300 font-extrabold",
        bg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800",
        state: "urgent", daysRemaining: 1, detailText: "Only 1 Day Remaining",
      };
    }
    return {
      label: d !== null ? `${d} Days Left` : "Closing Soon",
      dot: "bg-amber-500 animate-pulse",
      text: "text-amber-700 dark:text-amber-300 font-bold",
      bg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40",
      state: "closing_soon", daysRemaining: d ?? undefined,
      detailText: rawLastDate ? `Last Date: ${rawLastDate}` : "Apply Soon",
    };
  }

  // ── 5. apply_status param ─────────────────────────────────────────────────
  if (applyStatus === "coming_soon") {
    return {
      label: "Apply Soon", dot: "bg-blue-400 animate-pulse",
      text: "text-blue-700 dark:text-blue-300",
      bg: "bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40",
      state: "soon", detailText: "Notification Out — Apply Link Coming",
    };
  }

  // ── 6. Date-based logic for active jobs ───────────────────────────────────
  if (rawLastDate) {
    const lower = rawLastDate.toLowerCase();

    // "Today" text in date field
    if (lower.includes("today")) {
      return {
        label: "Today Last Date!", dot: "bg-red-500 animate-pulse",
        text: "text-red-700 dark:text-red-300 font-extrabold",
        bg: "bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800",
        state: "today", daysRemaining: 0, detailText: "APPLICATION ENDS TODAY!",
      };
    }

    const parsed = parseDate(rawLastDate);
    if (parsed) {
      const diff = daysFromNow(parsed);

      if (diff < 0) {
        const ago = Math.abs(diff);
        return {
          label: "Closed",
          dot: "bg-gray-500",
          text: "text-gray-600 dark:text-gray-400",
          bg: "bg-gray-100 dark:bg-zinc-800/80 border border-gray-300 dark:border-zinc-700",
          state: "closed", daysRemaining: diff,
          detailText: ago <= 7 ? `Closed ${ago} day${ago > 1 ? "s" : ""} ago` : `Last Date was ${rawLastDate}`,
        };
      }
      if (diff === 0) return {
        label: "Today Last Date!", dot: "bg-red-500 animate-pulse",
        text: "text-red-700 dark:text-red-300 font-extrabold",
        bg: "bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800",
        state: "today", daysRemaining: 0, detailText: "APPLICATION ENDS TODAY!",
      };
      if (diff === 1) return {
        label: "Tomorrow Last!", dot: "bg-amber-500 animate-pulse",
        text: "text-amber-700 dark:text-amber-300 font-extrabold",
        bg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800",
        state: "urgent", daysRemaining: 1, detailText: "Only 1 Day Left to Apply",
      };
      if (diff <= 5) return {
        label: `${diff} Days Left`,
        dot: "bg-amber-500 animate-pulse",
        text: "text-amber-700 dark:text-amber-300 font-bold",
        bg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40",
        state: "urgent", daysRemaining: diff,
        detailText: `Only ${diff} Days Remaining — Last Date: ${rawLastDate}`,
      };
      // Active with known date
      return {
        label: "Apply Open", dot: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-300 font-bold",
        bg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40",
        state: "active", daysRemaining: diff,
        detailText: `Online Application Open — Last Date: ${rawLastDate}`,
      };
    }
  }

  // ── 7. Fallback: NEW badge for fresh posts ────────────────────────────────
  if (job.created_at) {
    const createdMs = Date.parse(job.created_at);
    if (!isNaN(createdMs) && (Date.now() - createdMs) / 86400000 <= 3) {
      return {
        label: "New", dot: "bg-purple-500 animate-pulse",
        text: "text-purple-700 dark:text-purple-300 font-bold",
        bg: "bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40",
        state: "new", detailText: "Newly Announced Notification",
      };
    }
  }

  return {
    label: "Active", dot: "bg-indigo-500",
    text: "text-indigo-700 dark:text-indigo-300 font-bold",
    bg: "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40",
    state: "active", detailText: "Online Application Active",
  };
}
