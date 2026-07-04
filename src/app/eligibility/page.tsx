"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  Calculator, CheckCircle, ShieldAlert, Sparkles, 
  Search, ArrowRight, Loader2, Calendar, Briefcase, Award
} from "lucide-react";

// Standard qualifications mapping
const QUALIFICATIONS = [
  { value: "10th", label: "10th Pass (High School / Matric)" },
  { value: "12th", label: "12th Pass (Intermediate / 10+2)" },
  { value: "graduate", label: "Graduate (B.A, B.Sc, B.Com, etc.)" },
  { value: "technical", label: "B.Tech / BE / Diploma / Technical Degree" },
  { value: "iti", label: "ITI (Apprentice / Technician)" },
];

const CATEGORIES = [
  { value: "GEN", label: "General (UR)" },
  { value: "OBC", label: "OBC" },
  { value: "SC", label: "SC" },
  { value: "ST", label: "ST" },
  { value: "EWS", label: "EWS" },
];

export default function EligibilityScoutPage() {
  // Input states
  const [dob, setDob] = useState("");
  const [qualification, setQualification] = useState("graduate");
  const [category, setCategory] = useState("GEN");
  const [gender, setGender] = useState("male");

  // App states
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [userAge, setUserAge] = useState<number | null>(null);

  // Fetch all active jobs on page load
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from("jobs")
          .select("id, title, slug, category, status, short_info, blog_content, created_at, important_dates")
          .eq("status", "published")
          .order("created_at", { ascending: false });
        if (!error && data) {
          setJobs(data);
        }
      } catch (err) {
        console.error("Error fetching jobs for eligibility:", err);
      }
    };
    fetchJobs();
  }, []);

  const calculateAge = (dobString: string) => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleCheck = () => {
    if (!dob) {
      alert("Apni Date of Birth select karein.");
      return;
    }

    setLoading(true);
    setSearched(true);

    const calculatedAge = calculateAge(dob);
    setUserAge(calculatedAge);

    // Matching Logic Engine
    setTimeout(() => {
      const results = jobs.filter((job) => {
        const titleLower = job.title.toLowerCase();
        const contentLower = (job.blog_content || "").toLowerCase();
        const infoLower = (job.short_info || "").toLowerCase();
        const fullText = `${titleLower} ${infoLower} ${contentLower}`;

        // 1. Qualification Check (Keyword Matcher)
        let qualMatch = false;
        if (qualification === "10th") {
          qualMatch = 
            fullText.includes("10th") || 
            fullText.includes("mts") || 
            fullText.includes("matric") || 
            fullText.includes("high school") ||
            fullText.includes("group d") ||
            fullText.includes("gd constable");
        } else if (qualification === "12th") {
          qualMatch = 
            fullText.includes("12th") || 
            fullText.includes("10+2") || 
            fullText.includes("chsl") || 
            fullText.includes("intermediate") ||
            fullText.includes("clerk") || 
            fullText.includes("constable") ||
            fullText.includes("stenographer");
        } else if (qualification === "graduate") {
          qualMatch = 
            fullText.includes("graduate") || 
            fullText.includes("cgl") || 
            fullText.includes("degree") || 
            fullText.includes("officer") || 
            fullText.includes("inspector") || 
            fullText.includes("po") ||
            fullText.includes("assistant") ||
            fullText.includes("upsc") ||
            fullText.includes("psc");
        } else if (qualification === "technical") {
          qualMatch = 
            fullText.includes("b.tech") || 
            fullText.includes("be") || 
            fullText.includes("diploma") || 
            fullText.includes("engineer") || 
            fullText.includes("je") ||
            fullText.includes("technical") ||
            fullText.includes("alp");
        } else if (qualification === "iti") {
          qualMatch = 
            fullText.includes("iti") || 
            fullText.includes("technician") || 
            fullText.includes("apprentice");
        }

        // 2. Category Age Relaxation Logic
        let maxAgeLimit = 27; // Default max age limit if not found
        let minAgeLimit = 18; // Default min age limit

        // Extract age constraints using regex patterns like "18-27", "18 to 30", "max 25 years"
        const ageRangeRegex = /(\d{2})\s*(?:-|to)\s*(\d{2})/g;
        const match = ageRangeRegex.exec(fullText);
        if (match) {
          minAgeLimit = parseInt(match[1]);
          maxAgeLimit = parseInt(match[2]);
        } else {
          const maxAgeRegex = /(?:maximum|max|limit)\s*(?:age)?\s*(?:of)?\s*(\d{2})/i;
          const maxMatch = maxAgeRegex.exec(fullText);
          if (maxMatch) maxAgeLimit = parseInt(maxMatch[1]);
        }

        // Apply reservation age relaxation
        let userMaxAgeAllowed = maxAgeLimit;
        if (category === "OBC") userMaxAgeAllowed += 3;
        else if (category === "SC" || category === "ST") userMaxAgeAllowed += 5;

        const ageMatch = calculatedAge >= minAgeLimit && calculatedAge <= userMaxAgeAllowed;

        return qualMatch && ageMatch;
      });

      setMatchedJobs(results);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex p-3.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl mb-4 border border-indigo-200/50">
            <Calculator className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2">
            Smart Eligibility Checker <Sparkles className="w-5 h-5 text-amber-500" />
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">
            Apni qualification aur details select karein, aur instantly dekhein aap kis vacancy ke liye eligible hain.
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Panel: Input form */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl shadow-black/5 self-start">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" /> Detail Check Form
            </h2>

            <div className="space-y-4">
              {/* DOB */}
              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2">Date of Birth</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2">Highest Qualification</label>
                <select
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                >
                  {QUALIFICATIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2">Category (Age relaxation ke liye)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:border-indigo-500 outline-none"
                >
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-gray-400 tracking-wider mb-2">Gender</label>
                <div className="flex gap-2">
                  {["male", "female"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all capitalize ${gender === g ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Check Button */}
              <button
                onClick={handleCheck}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 mt-6"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-4 h-4" /> Check My Eligibility</>}
              </button>
            </div>
          </div>

          {/* Right Panel: Results */}
          <div className="lg:col-span-2 space-y-6">
            {!searched ? (
              <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-16 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
                <h3 className="font-extrabold text-gray-800 dark:text-gray-200 text-lg">Eligibility Result Aise Dikhega</h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto mt-1">Form fill karke button click karein, eligible jobs list ho jayenge.</p>
              </div>
            ) : loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 animate-pulse flex justify-between items-center">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                    </div>
                    <div className="w-24 h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : matchedJobs.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-gray-800 dark:text-gray-200 text-lg">No Matching Jobs Found</h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto mt-1">
                  Aapki select ki gayi details ke mutabik abhi koi vacancies active nahi hain. Dobara details check karein.
                </p>
                {userAge !== null && (
                  <p className="text-xs text-indigo-500 mt-2 font-bold">Calculated Age: {userAge} Years</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                    🎉 Congratulation! Aap <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{matchedJobs.length} matches</span> ke liye eligible hain.
                  </p>
                  {userAge !== null && (
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Age: {userAge} Years
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {matchedJobs.map((job) => {
                    const matchedCat = QUALIFICATIONS.find(q => q.value === qualification)?.label.split(" ")[0];
                    return (
                      <div key={job.id} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-700">
                        <div>
                          <span className="inline-flex px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30 mb-2">
                            {job.category?.replace(/-/g, " ")}
                          </span>
                          <h3 className="font-extrabold text-gray-900 dark:text-white leading-snug group-hover:text-indigo-600 transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mt-2">
                            <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Match: {matchedCat}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Checked Now</span>
                          </div>
                        </div>

                        <div className="flex gap-2 w-full sm:w-auto self-stretch sm:self-center shrink-0">
                          <Link href={`/job/${job.slug}`} className="flex-1 sm:flex-none text-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors">
                            Details
                          </Link>
                          <Link href={`/apply-for-me?job=${encodeURIComponent(job.title)}&url=${encodeURIComponent(`/job/${job.slug}`)}`}
                            className="flex-1 sm:flex-none text-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Apply For Me <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
