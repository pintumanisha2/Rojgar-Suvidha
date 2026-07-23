export interface JobStatusBadge {
  label: string;
  dot: string;
  text: string;
  bg: string;
  state: "active" | "urgent" | "today" | "closed" | "live" | "completed" | "new";
  daysRemaining?: number;
  detailText?: string;
}

export function getJobStatusBadge(job: {
  category?: string;
  lastDate?: string;
  important_dates?: any[];
  exam_date?: string;
  created_at?: string;
  status?: string;
}): JobStatusBadge {
  const cat = (job.category || "").toLowerCase().trim();

  // Extract last date if available in important_dates array
  let rawLastDate = job.lastDate || "";
  let rawExamDate = job.exam_date || "";

  if (job.important_dates && Array.isArray(job.important_dates)) {
    if (!rawLastDate) {
      const ldObj = job.important_dates.find((d: any) => 
        (d.label || "").toLowerCase().includes("last date") || 
        (d.label || "").toLowerCase().includes("closing date") ||
        (d.label || "").toLowerCase().includes("deadline")
      );
      if (ldObj) rawLastDate = ldObj.value || "";
    }
    if (!rawExamDate) {
      const edObj = job.important_dates.find((d: any) => 
        (d.label || "").toLowerCase().includes("exam date") ||
        (d.label || "").toLowerCase().includes("test date")
      );
      if (edObj) rawExamDate = edObj.value || "";
    }
  }

  // Handle Category 1: Admit Cards
  if (cat.includes("admit")) {
    if (rawExamDate) {
      const parsedExam = Date.parse(rawExamDate);
      if (!isNaN(parsedExam) && parsedExam < Date.now() - (1000 * 60 * 60 * 24)) {
        return {
          label: "Exam Done",
          dot: "bg-slate-400",
          text: "text-slate-600 dark:text-slate-400",
          bg: "bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700",
          state: "completed",
          detailText: `Exam Date was ${rawExamDate}`
        };
      }
    }
    return {
      label: "Download Live",
      dot: "bg-orange-500 animate-pulse",
      text: "text-orange-700 dark:text-orange-300",
      bg: "bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40",
      state: "live",
      detailText: rawExamDate ? `Exam Date: ${rawExamDate}` : "Official Hall Ticket Live"
    };
  }

  // Handle Category 2: Results
  if (cat.includes("result")) {
    return {
      label: "Result Live",
      dot: "bg-emerald-500 animate-pulse",
      text: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40",
      state: "live",
      detailText: "Scorecard & Merit List Live"
    };
  }

  // Handle Category 3: Answer Key
  if (cat.includes("answer")) {
    if (rawLastDate) {
      const parsedLast = Date.parse(rawLastDate);
      if (!isNaN(parsedLast) && parsedLast < Date.now() - (1000 * 60 * 60 * 24)) {
        return {
          label: "Key Closed",
          dot: "bg-gray-400",
          text: "text-gray-600 dark:text-gray-400",
          bg: "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700",
          state: "closed",
          detailText: `Challenge Deadline Ended`
        };
      }
    }
    return {
      label: "Key Live",
      dot: "bg-purple-500 animate-pulse",
      text: "text-purple-700 dark:text-purple-300",
      bg: "bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40",
      state: "live",
      detailText: "Answer Key & Objections Live"
    };
  }

  // Handle Category 4: Latest Jobs & Admission & Others
  if (rawLastDate) {
    const lower = rawLastDate.toLowerCase();
    if (lower.includes("today")) {
      return {
        label: "Today Last Date!",
        dot: "bg-red-500 animate-pulse",
        text: "text-red-700 dark:text-red-300 font-extrabold",
        bg: "bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800",
        state: "today",
        daysRemaining: 0,
        detailText: "ONLINE APPLICATION ENDS TODAY!"
      };
    }

    try {
      const parsed = Date.parse(rawLastDate);
      if (!isNaN(parsed)) {
        const diffMs = parsed - Date.now();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          return {
            label: "Closed",
            dot: "bg-red-500",
            text: "text-red-700 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40",
            state: "closed",
            daysRemaining: diffDays,
            detailText: `Application Closed on ${rawLastDate}`
          };
        } else if (diffDays === 0) {
          return {
            label: "Today Last Date!",
            dot: "bg-red-500 animate-pulse",
            text: "text-red-700 dark:text-red-300 font-extrabold",
            bg: "bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800",
            state: "today",
            daysRemaining: 0,
            detailText: "ONLINE APPLICATION ENDS TODAY!"
          };
        } else if (diffDays === 1) {
          return {
            label: "Tomorrow Last Date!",
            dot: "bg-amber-500 animate-pulse",
            text: "text-amber-700 dark:text-amber-300 font-extrabold",
            bg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800",
            state: "urgent",
            daysRemaining: 1,
            detailText: "Only 1 Day Remaining to Apply"
          };
        } else if (diffDays <= 4) {
          return {
            label: `${diffDays} Days Left`,
            dot: "bg-amber-500 animate-pulse",
            text: "text-amber-700 dark:text-amber-300 font-bold",
            bg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40",
            state: "urgent",
            daysRemaining: diffDays,
            detailText: `Only ${diffDays} Days Remaining (Last Date: ${rawLastDate})`
          };
        } else {
          return {
            label: "Active",
            dot: "bg-indigo-500",
            text: "text-indigo-700 dark:text-indigo-300 font-bold",
            bg: "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40",
            state: "active",
            daysRemaining: diffDays,
            detailText: `Online Application Active — Last Date: ${rawLastDate}`
          };
        }
      }
    } catch (e) {}
  }

  // Fallback: Check created_at age
  if (job.created_at) {
    const createdMs = Date.parse(job.created_at);
    if (!isNaN(createdMs)) {
      const ageDays = (Date.now() - createdMs) / (1000 * 60 * 60 * 24);
      if (ageDays <= 3) {
        return {
          label: "New",
          dot: "bg-purple-500 animate-pulse",
          text: "text-purple-700 dark:text-purple-300 font-bold",
          bg: "bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40",
          state: "new",
          detailText: "Newly Announced Notification"
        };
      }
    }
  }

  return {
    label: "Active",
    dot: "bg-indigo-500",
    text: "text-indigo-700 dark:text-indigo-300 font-bold",
    bg: "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40",
    state: "active",
    detailText: "Online Application Active"
  };
}
