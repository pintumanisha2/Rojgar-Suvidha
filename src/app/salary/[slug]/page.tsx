import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import { IndianRupee, TrendingUp, Building2, CalendarDays, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";

const BASE_URL = "https://www.rojgarsuvidha.com";
export const revalidate = 86400;

// ── 7th Pay Commission pay matrix ─────────────────────────────────────────────
const PAY_MATRIX: Record<string, { level: string; basic: number; da: number; hra_a: number; hra_b: number; hra_c: number; ta: number }> = {
  "1":  { level: "Level 1",  basic: 18000,  da: 50, hra_a: 5400,  hra_b: 3600,  hra_c: 1800,  ta: 1350 },
  "2":  { level: "Level 2",  basic: 19900,  da: 50, hra_a: 5970,  hra_b: 3980,  hra_c: 1990,  ta: 1800 },
  "3":  { level: "Level 3",  basic: 21700,  da: 50, hra_a: 6510,  hra_b: 4340,  hra_c: 2170,  ta: 1800 },
  "4":  { level: "Level 4",  basic: 25500,  da: 50, hra_a: 7650,  hra_b: 5100,  hra_c: 2550,  ta: 3600 },
  "5":  { level: "Level 5",  basic: 29200,  da: 50, hra_a: 8760,  hra_b: 5840,  hra_c: 2920,  ta: 3600 },
  "6":  { level: "Level 6",  basic: 35400,  da: 50, hra_a: 10620, hra_b: 7080,  hra_c: 3540,  ta: 3600 },
  "7":  { level: "Level 7",  basic: 44900,  da: 50, hra_a: 13470, hra_b: 8980,  hra_c: 4490,  ta: 3600 },
  "8":  { level: "Level 8",  basic: 47600,  da: 50, hra_a: 14280, hra_b: 9520,  hra_c: 4760,  ta: 3600 },
  "9":  { level: "Level 9",  basic: 53100,  da: 50, hra_a: 15930, hra_b: 10620, hra_c: 5310,  ta: 7200 },
  "10": { level: "Level 10", basic: 56100,  da: 50, hra_a: 16830, hra_b: 11220, hra_c: 5610,  ta: 7200 },
  "11": { level: "Level 11", basic: 67700,  da: 50, hra_a: 20310, hra_b: 13540, hra_c: 6770,  ta: 7200 },
  "12": { level: "Level 12", basic: 78800,  da: 50, hra_a: 23640, hra_b: 15760, hra_c: 7880,  ta: 7200 },
  "13": { level: "Level 13", basic: 123100, da: 50, hra_a: 36930, hra_b: 24620, hra_c: 12310, ta: 7200 },
};

function detectPayLevel(title: string, qualification: string = ""): string {
  const t = title.toLowerCase();
  if (t.includes("ias") || t.includes("ips") || t.includes("upsc cse")) return "13";
  if (t.includes("inspector") && !t.includes("sub")) return "7";
  if (t.includes("sub-inspector") || t.includes("asi")) return "6";
  if (t.includes("constable") || t.includes("sipahi") || t.includes("group d") || t.includes("group-d")) return "3";
  if (t.includes("po ") || t.includes("probationary officer") || t.includes("management trainee")) return "8";
  if (t.includes("junior engineer") || t.includes("je ")) return "6";
  if (t.includes("cgl") || t.includes("combined graduate level")) return "6";
  if (t.includes("chsl") || t.includes("combined higher")) return "4";
  if (t.includes("ntpc") && t.includes("rail")) return "4";
  if (t.includes("mts") || t.includes("multi tasking")) return "1";
  if (t.includes("clerk") || t.includes("ldc")) return "2";
  if (qualification.includes("10th") || qualification.includes("matriculation")) return "1";
  if (qualification.includes("12th") || qualification.includes("intermediate")) return "2";
  return "4";
}

function fmt(n: number): string { return n.toLocaleString("en-IN"); }

async function getJob(slug: string) {
  const { data } = await supabase
    .from("jobs")
    .select("title, slug, short_info, category, state_code, important_dates, created_at")
    .eq("slug", slug)
    .neq("status", "draft")
    .single();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: "Salary Details | Rojgar Suvidha" };
  const shortTitle = job.title.split(/[:\-–|]/)[0].trim().slice(0, 55);
  const title = `${shortTitle} Salary 2026 — In-Hand Monthly Pay | Rojgar Suvidha`;
  const desc = `${shortTitle} in-hand salary per month 2026. Complete breakdown: Basic Pay, DA, HRA, TA, Gross, deductions (NPS, CGHS) and Net take-home after 7th Pay Commission.`;
  return {
    title: { absolute: title },
    description: desc,
    alternates: { canonical: `${BASE_URL}/salary/${slug}` },
    openGraph: { title, description: desc, url: `${BASE_URL}/salary/${slug}` },
  };
}

export default async function SalaryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const shortTitle = job.title.split(/[:\-–|]/)[0].trim();
  const payLevel = detectPayLevel(job.title, "");
  const pm = PAY_MATRIX[payLevel] || PAY_MATRIX["4"];

  const daAmt  = Math.round(pm.basic * pm.da / 100);
  const grossA = pm.basic + daAmt + pm.hra_a + pm.ta;
  const grossB = pm.basic + daAmt + pm.hra_b + pm.ta;
  const grossC = pm.basic + daAmt + pm.hra_c + pm.ta;
  const nps    = Math.round(pm.basic * 0.10);
  const cghs   = 350;
  const netA   = grossA - nps - cghs;
  const netB   = grossB - nps - cghs;
  const netC   = grossC - nps - cghs;

  let lastDate = "";
  let datesObj = job.important_dates;
  if (typeof datesObj === "string") {
    try { datesObj = JSON.parse(datesObj); } catch {}
  }
  if (Array.isArray(datesObj)) {
    lastDate = datesObj.find((d: any) => /last\s*date|closing/i.test(d?.label || ""))?.value || "";
  } else if (datesObj && typeof datesObj === "object") {
    for (const [key, val] of Object.entries(datesObj)) {
      if (/last\s*date|closing/i.test(key)) {
        lastDate = String(val);
        break;
      }
    }
  }

  const postMatch = (job.title + " " + (job.short_info || "")).match(/(\d[\d,]*)\s*(?:posts?|vacanc(?:y|ies))/i);
  const totalPosts = postMatch ? postMatch[1] : "";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Salary", item: `${BASE_URL}/salary` },
      { "@type": "ListItem", position: 3, name: `${shortTitle} Salary`, item: `${BASE_URL}/salary/${slug}` },
    ],
  };

  const faqItems = [
    {
      q: `${shortTitle} ki in-hand salary kitni hoti hai per month?`,
      a: `${shortTitle} ki net in-hand salary ₹${fmt(netB)} per month hoti hai (B-category city mein) after NPS aur CGHS deduction. A-category cities mein ₹${fmt(netA)} milta hai. Yeh 7th Pay Commission ke mutabiq hai (${pm.level}).`,
    },
    {
      q: `${shortTitle} mein basic pay kitna hai?`,
      a: `${shortTitle} ka basic pay ₹${fmt(pm.basic)} per month hai (Pay Matrix ${pm.level}). Is par 50% DA (₹${fmt(daAmt)}) bhi milta hai.`,
    },
    {
      q: `${shortTitle} mein HRA kitna milta hai?`,
      a: `HRA city ke hisab se: A-cities (Delhi, Mumbai) mein ₹${fmt(pm.hra_a)}, B-cities (state capitals) mein ₹${fmt(pm.hra_b)}, C-cities mein ₹${fmt(pm.hra_c)} per month.`,
    },
    {
      q: `${shortTitle} mein pension milti hai?`,
      a: `Haan, NPS applicable hai. Employee 10% + employer 14% basic pay contribute karte hain. Retirement ke baad annuity milti hai.`,
    },
    {
      q: `${shortTitle} ke baad promotion kab milta hai?`,
      a: `MACP scheme ke tahat 10, 20 aur 30 saal ki service ke baad financial upgradation milta hai. Regular promotion department-wise seniority se hoti hai.`,
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(f => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const rows = [
    { label: "Basic Pay",          a: pm.basic, b: pm.basic, c: pm.basic, neg: false, bold: false },
    { label: "Dearness Allowance (50%)", a: daAmt, b: daAmt, c: daAmt, neg: false, bold: false },
    { label: "HRA",                a: pm.hra_a, b: pm.hra_b, c: pm.hra_c, neg: false, bold: false },
    { label: "Transport Allowance",a: pm.ta,    b: pm.ta,    c: pm.ta,    neg: false, bold: false },
    { label: "🟰 Gross Salary",    a: grossA,   b: grossB,   c: grossC,   neg: false, bold: true },
    { label: "(-) NPS (10%)",      a: nps,      b: nps,      c: nps,      neg: true,  bold: false },
    { label: "(-) CGHS",           a: cghs,     b: cghs,     c: cghs,     neg: true,  bold: false },
    { label: "✅ Net In-Hand",     a: netA,     b: netB,     c: netC,     neg: false, bold: true },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 flex-wrap">
            <Link href="/" className="hover:text-indigo-600 font-medium">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/job/${slug}`} className="hover:text-indigo-600 font-medium truncate max-w-[220px]">{shortTitle}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700 dark:text-gray-200 font-semibold">Salary Details</span>
          </nav>

          {/* Hero */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 rounded-2xl p-6 sm:p-8 text-white mb-6 shadow-xl border border-indigo-700/40 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" />
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <IndianRupee className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">7th Pay Commission • {pm.level}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-2">{shortTitle} Salary 2026</h1>
              <p className="text-indigo-200 text-sm mb-5">In-Hand Monthly Salary • Complete Breakdown • After All Deductions</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Basic Pay",    value: `₹${fmt(pm.basic)}`, sub: pm.level,      cls: "bg-white/10" },
                  { label: "Gross Salary", value: `₹${fmt(grossB)}`,  sub: "B-city avg",   cls: "bg-amber-500/20 border border-amber-400/30" },
                  { label: "Net In-Hand",  value: `₹${fmt(netB)}`,    sub: "After deductions", cls: "bg-emerald-500/20 border border-emerald-400/30" },
                ].map(c => (
                  <div key={c.label} className={`${c.cls} rounded-xl p-3 text-center backdrop-blur-sm`}>
                    <div className="text-[10px] font-bold text-white/70 uppercase mb-1">{c.label}</div>
                    <div className="text-lg font-black text-white">{c.value}</div>
                    <div className="text-[10px] text-white/60 mt-0.5">{c.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-5">

              {/* Salary Table */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm">
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" /> City-wise In-Hand Salary Breakdown
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-zinc-800">
                        <th className="text-left py-2 font-bold text-gray-500 text-xs uppercase">Component</th>
                        <th className="text-right py-2 font-bold text-xs text-emerald-600">X City (A)</th>
                        <th className="text-right py-2 font-bold text-xs text-indigo-600">Y City (B)</th>
                        <th className="text-right py-2 font-bold text-xs text-amber-600">Z City (C)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/40">
                      {rows.map((row, i) => (
                        <tr key={i} className={row.bold ? "bg-indigo-50/50 dark:bg-indigo-950/20" : ""}>
                          <td className={`py-2.5 text-sm ${row.bold ? "font-extrabold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>{row.label}</td>
                          {[row.a, row.b, row.c].map((v, j) => (
                            <td key={j} className={`py-2.5 text-right tabular-nums text-sm ${row.neg ? "text-red-500" : row.bold ? "text-emerald-600 font-extrabold" : "text-gray-700 dark:text-gray-300"}`}>
                              {row.neg ? `- ₹${fmt(v)}` : `₹${fmt(v)}`}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-3">* X: Delhi, Mumbai, Kolkata, Chennai | Y: State capitals | Z: All other cities</p>
              </div>

              {/* Benefits */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm">
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Additional Benefits
                </h2>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {[
                    ["Medical (CGHS)", "Full family coverage"],
                    ["Leave Travel Concession", "2 times in 4 years"],
                    ["Children Education", "₹2,250/child/month"],
                    ["Annual Increment", "3% of Basic (July)"],
                    ["NPS Pension", "10% employee + 14% employer"],
                    ["Gratuity", "After 5 years service"],
                    ["Group Insurance", "CGEGIS coverage"],
                    ["Govt Quarter", "If allotted (HRA not given)"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-2 py-2 px-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50 text-sm">
                      <span className="text-gray-500 font-medium">{label}</span>
                      <span className="font-bold text-gray-900 dark:text-white text-right text-xs">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm">
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqItems.map((f, i) => (
                    <div key={i} className="border-b border-gray-100 dark:border-zinc-800 pb-4 last:border-0 last:pb-0">
                      <p className="font-bold text-gray-900 dark:text-white text-sm mb-1.5">{f.q}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-500" /> Job Overview
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    ["Post", shortTitle.slice(0, 40)],
                    ["Pay Level", pm.level],
                    ["Basic Pay", `₹${fmt(pm.basic)}/month`],
                    ...(totalPosts ? [["Total Posts", totalPosts]] : []),
                    ...(lastDate ? [["Last Date", lastDate]] : []),
                    ["Location", job.state_code && job.state_code !== "ALL" ? job.state_code : "All India"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-start gap-2 py-1.5 border-b border-gray-50 dark:border-zinc-800/50 last:border-0">
                      <span className="text-gray-500 font-medium shrink-0">{label}</span>
                      <span className="font-bold text-gray-900 dark:text-white text-right text-xs">{value}</span>
                    </div>
                  ))}
                </div>
                <Link href={`/job/${slug}`} className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors">
                  View Full Notification
                </Link>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 text-xs text-amber-700 dark:text-amber-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p><strong>Note:</strong> Salary figures are estimated based on 7th Pay Commission. Actual in-hand may vary by posting location, seniority, and additional allowances. DA is revised quarterly.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 text-white text-center shadow-lg">
                <CalendarDays className="w-7 h-7 mx-auto mb-2 text-indigo-200" />
                <p className="font-black text-sm mb-1">Apply For Me Service</p>
                <p className="text-indigo-200 text-xs mb-3">Expert team fills your form. Zero errors.</p>
                <Link href={`/apply-for-me?jobSlug=${slug}`} className="inline-block bg-white text-indigo-700 font-black px-4 py-2 rounded-lg text-sm hover:bg-indigo-50 transition-colors">
                  Apply For Me →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
