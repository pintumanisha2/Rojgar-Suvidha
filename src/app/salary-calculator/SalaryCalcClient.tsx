"use client";
import { useState } from "react";
import Link from "next/link";
import { IndianRupee, ChevronRight, Share2, Copy, CheckCheck, Calculator } from "lucide-react";

const PAY_MATRIX = [
  { level: "1",  post: "MTS / Group D / Peon",                 basic: 18000  },
  { level: "2",  post: "LDC / Clerk / Constable (some)",       basic: 19900  },
  { level: "3",  post: "Constable / Jr. Steno",                basic: 21700  },
  { level: "4",  post: "JSA / PA / CHSL / NTPC Jr Clerk",      basic: 25500  },
  { level: "5",  post: "Senior Assistant / NTPC Sr Clerk",     basic: 29200  },
  { level: "6",  post: "SSC CGL / JE / SI (some)",             basic: 35400  },
  { level: "7",  post: "Inspector / ASI / Sub-Inspector",      basic: 44900  },
  { level: "8",  post: "Bank PO / Assistant Manager",          basic: 47600  },
  { level: "9",  post: "Section Officer / Asst Director",      basic: 53100  },
  { level: "10", post: "Sr Section Officer / IPS (entry)",     basic: 56100  },
  { level: "11", post: "Deputy Secretary / Dy SP",             basic: 67700  },
  { level: "12", post: "Director / DIG",                       basic: 78800  },
  { level: "13", post: "IAS / IPS / IFS (Joint Secretary+)",   basic: 123100 },
];

const CITY = [
  { key: "X", label: "X City — Delhi, Mumbai, Kolkata, Chennai, Hyderabad, Bengaluru", hraRate: 0.30 },
  { key: "Y", label: "Y City — State Capitals & cities >5 lakh pop.", hraRate: 0.20 },
  { key: "Z", label: "Z City — All other towns & rural areas",         hraRate: 0.10 },
];

const TA: Record<string, number> = { "1":1350,"2":1800,"3":1800,"4":3600,"5":3600,"6":3600,"7":3600,"8":3600,"9":7200,"10":7200,"11":7200,"12":7200,"13":7200 };

function fmt(n: number) { return n.toLocaleString("en-IN"); }

export default function SalaryCalcClient() {
  const [level, setLevel] = useState("6");
  const [cityKey, setCityKey] = useState("Y");
  const [daRate, setDaRate] = useState(50);
  const [copied, setCopied] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const pm = PAY_MATRIX.find(p => p.level === level) || PAY_MATRIX[5];
  const city = CITY.find(c => c.key === cityKey) || CITY[1];
  const basic = pm.basic;
  const da = Math.round(basic * daRate / 100);
  const hra = Math.round(basic * city.hraRate);
  const ta = TA[level] || 3600;
  const gross = basic + da + hra + ta;
  const nps = Math.round(basic * 0.10);
  const cghs = 350;
  const net = gross - nps - cghs;

  const rows = [
    { label: "Basic Pay",               value: basic, neg: false, bold: false },
    { label: `Dearness Allowance (${daRate}%)`, value: da, neg: false, bold: false },
    { label: `HRA (${Math.round(city.hraRate*100)}% — ${city.key} city)`, value: hra, neg: false, bold: false },
    { label: "Transport Allowance",     value: ta,    neg: false, bold: false },
    { label: "GROSS SALARY",            value: gross, neg: false, bold: true },
    { label: "(-) NPS (10% of Basic)",  value: nps,   neg: true,  bold: false },
    { label: "(-) CGHS Contribution",   value: cghs,  neg: true,  bold: false },
    { label: "NET IN-HAND SALARY",      value: net,   neg: false, bold: true },
  ];

  function copyResult() {
    const text = `Sarkari Job Salary (Level ${level} — ${city.key} City)\nBasic: ₹${fmt(basic)} | DA: ₹${fmt(da)} | HRA: ₹${fmt(hra)} | TA: ₹${fmt(ta)}\nGross: ₹${fmt(gross)} | Net In-Hand: ₹${fmt(net)}\nCalculated at: rojgarsuvidha.com/salary-calculator`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Sarkari job mein DA kitna milta hai 2026 mein?",
        acceptedAnswer: { "@type": "Answer", text: "January 2024 se Dearness Allowance (DA) 50% ho gayi hai. Yeh basic pay ka 50% hota hai. For example Level 6 (SSC CGL) mein basic ₹35,400 par DA ₹17,700 milta hai." } },
      { "@type": "Question", name: "HRA kaise calculate hota hai central government mein?",
        acceptedAnswer: { "@type": "Answer", text: "X cities (Delhi, Mumbai) mein 30% of Basic, Y cities (state capitals) mein 20% of Basic, Z cities (small towns) mein 10% of Basic milta hai." } },
      { "@type": "Question", name: "NPS kya hota hai aur kitna katega salary se?",
        acceptedAnswer: { "@type": "Answer", text: "National Pension System (NPS) mein employee ka 10% aur employer ka 14% Basic Pay contribute hota hai. Employee ka 10% salary se katega. Level 6 mein ₹3,540/month katega." } },
      { "@type": "Question", name: "7th Pay Commission ke baad SSC CGL ki salary kitni hai?",
        acceptedAnswer: { "@type": "Answer", text: "SSC CGL (Level 6, Basic ₹35,400) ki 2026 mein in-hand salary Y city mein approximately ₹55,400 gross aur ₹51,500 net (after NPS + CGHS) milti hai." } },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 flex-wrap">
            <Link href="/" className="hover:text-indigo-600 font-medium">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-800 dark:text-gray-200 font-semibold">Salary Calculator</span>
          </nav>

          {/* Hero */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 rounded-2xl p-6 sm:p-8 text-white mb-8 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" />
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">7th Pay Commission • DA 50%</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2">Sarkari Job Salary Calculator 2026</h1>
              <p className="text-indigo-200 text-sm">Apni exact in-hand salary calculate karo — DA, HRA, TA, NPS sab included</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Panel */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm space-y-5">
              <h2 className="font-extrabold text-gray-900 dark:text-white text-base">Apni Details Enter Karo</h2>

              {/* Pay Level */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Pay Matrix Level</label>
                <select value={level} onChange={e => { setLevel(e.target.value); setCalculated(true); }}
                  className="w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm font-medium bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
                  {PAY_MATRIX.map(p => (
                    <option key={p.level} value={p.level}>Level {p.level} — ₹{fmt(p.basic)}/mo — {p.post}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Posting City Category</label>
                <div className="space-y-2">
                  {CITY.map(c => (
                    <label key={c.key} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${cityKey === c.key ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" : "border-gray-200 dark:border-zinc-700 hover:border-indigo-300"}`}>
                      <input type="radio" name="city" value={c.key} checked={cityKey === c.key} onChange={() => { setCityKey(c.key); setCalculated(true); }} className="mt-0.5 accent-indigo-600" />
                      <div>
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{c.key} City — HRA {Math.round(c.hraRate*100)}%</span>
                        <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* DA Rate */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Dearness Allowance (DA): <span className="text-indigo-600">{daRate}%</span>
                  <span className="text-xs font-normal text-gray-400 ml-2">(Current: 50%)</span>
                </label>
                <input type="range" min={42} max={58} step={1} value={daRate}
                  onChange={e => { setDaRate(+e.target.value); setCalculated(true); }}
                  className="w-full accent-indigo-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>42%</span><span className="font-bold text-indigo-600">{daRate}%</span><span>58%</span>
                </div>
              </div>
            </div>

            {/* Result Panel */}
            <div className="space-y-4">
              {/* Big Net Number */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]" />
                <div className="relative z-10">
                  <div className="text-xs font-bold text-emerald-200 uppercase tracking-widest mb-2">Net In-Hand Salary</div>
                  <div className="text-4xl font-black">₹{fmt(net)}<span className="text-lg font-bold text-emerald-200">/month</span></div>
                  <div className="text-emerald-200 text-sm mt-1">Pay Level {level} • {city.key} City • DA {daRate}%</div>
                  <div className="mt-4 flex gap-3">
                    <div className="bg-white/15 rounded-lg px-3 py-2 text-center flex-1">
                      <div className="text-xs text-emerald-200 font-bold">Gross</div>
                      <div className="font-black">₹{fmt(gross)}</div>
                    </div>
                    <div className="bg-white/15 rounded-lg px-3 py-2 text-center flex-1">
                      <div className="text-xs text-emerald-200 font-bold">Basic Pay</div>
                      <div className="font-black">₹{fmt(basic)}</div>
                    </div>
                    <div className="bg-white/15 rounded-lg px-3 py-2 text-center flex-1">
                      <div className="text-xs text-emerald-200 font-bold">Annual</div>
                      <div className="font-black">₹{fmt(net*12)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-zinc-800">
                  <span className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-indigo-500" /> Complete Salary Breakdown
                  </span>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-zinc-800/50">
                  {rows.map((row, i) => (
                    <div key={i} className={`flex justify-between items-center px-5 py-3 text-sm ${row.bold ? "bg-indigo-50/50 dark:bg-indigo-950/20" : ""}`}>
                      <span className={`${row.bold ? "font-extrabold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"}`}>{row.label}</span>
                      <span className={`tabular-nums font-bold ${row.neg ? "text-red-500" : row.bold ? "text-emerald-600 dark:text-emerald-400 text-base" : "text-gray-900 dark:text-white"}`}>
                        {row.neg ? `- ₹${fmt(row.value)}` : `₹${fmt(row.value)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button onClick={copyResult} className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors">
                  {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Result"}
                </button>
                <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Sarkari Job Salary (Level ${level})\nNet In-Hand: ₹${fmt(net)}/month\nGross: ₹${fmt(gross)}\n\nCalculate yours: rojgarsuvidha.com/salary-calculator`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors">
                  <Share2 className="w-4 h-4" /> WhatsApp Share
                </a>
              </div>
            </div>
          </div>

          {/* Other Pay Levels Quick Compare */}
          <div className="mt-8 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="font-extrabold text-gray-900 dark:text-white text-sm mb-4">Sabhi Pay Levels Ki In-Hand Salary (Y City, DA 50%)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-800">
                    <th className="text-left py-2 text-xs font-bold text-gray-500 uppercase">Level</th>
                    <th className="text-left py-2 text-xs font-bold text-gray-500 uppercase">Post</th>
                    <th className="text-right py-2 text-xs font-bold text-gray-500 uppercase">Basic</th>
                    <th className="text-right py-2 text-xs font-bold text-gray-500 uppercase">Gross</th>
                    <th className="text-right py-2 text-xs font-bold text-emerald-600 uppercase">In-Hand</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/40">
                  {PAY_MATRIX.map(p => {
                    const da_ = Math.round(p.basic * 0.50);
                    const hra_ = Math.round(p.basic * 0.20);
                    const ta_ = TA[p.level] || 3600;
                    const gross_ = p.basic + da_ + hra_ + ta_;
                    const nps_ = Math.round(p.basic * 0.10);
                    const net_ = gross_ - nps_ - 350;
                    const isSelected = p.level === level;
                    return (
                      <tr key={p.level} onClick={() => { setLevel(p.level); setCalculated(true); }}
                        className={`cursor-pointer transition-colors ${isSelected ? "bg-indigo-50 dark:bg-indigo-950/30 font-bold" : "hover:bg-gray-50 dark:hover:bg-zinc-800/50"}`}>
                        <td className="py-2.5 text-indigo-600 font-bold">{p.level}</td>
                        <td className="py-2.5 text-gray-600 dark:text-gray-400 text-xs max-w-[160px] truncate">{p.post}</td>
                        <td className="py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">₹{fmt(p.basic)}</td>
                        <td className="py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">₹{fmt(gross_)}</td>
                        <td className="py-2.5 text-right tabular-nums text-emerald-600 font-bold">₹{fmt(net_)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-6 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="font-extrabold text-gray-900 dark:text-white text-sm mb-5">Salary Calculator — Common Questions</h2>
            <div className="space-y-4">
              {faqSchema.mainEntity.map((f: any, i: number) => (
                <div key={i} className="border-b border-gray-100 dark:border-zinc-800 pb-4 last:border-0 last:pb-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm mb-1.5">Q: {f.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
