"use client";

import { useState, useRef } from "react";
import { Loader2, Download, Sparkles, CheckCircle2, User, GraduationCap, Briefcase, ChevronRight, ChevronLeft, Eye, FileText, Shield, Clock, Star } from "lucide-react";
import AdSensePlaceholder from "@/components/ads/AdSensePlaceholder";

// ⚠️ MUST be outside the component — otherwise re-renders cause cursor to jump
function InputBox({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      />
    </div>
  );
}

const STEPS = ["Personal Info", "Education", "Skills & More", "Preview & Download"];

const INITIAL = {
  name: "", email: "", phone: "", city: "", dob: "", gender: "male",
  objective_hint: "",
  edu10: { board: "", school: "", year: "", percent: "" },
  edu12: { board: "", school: "", year: "", percent: "", stream: "" },
  eduGrad: { degree: "", college: "", university: "", year: "", percent: "" },
  skills: "", experience: "", languages: "Hindi, English",
};

export default function ResumeBuilderPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [generating, setGenerating] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }
  function updateNested(parent: string, field: string, value: string) {
    setForm(prev => ({ ...prev, [parent]: { ...(prev as any)[parent], [field]: value } }));
  }

  async function generateResume() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiData(data.data);
      setStep(3);
    } catch (e: any) {
      setError(e.message || "Failed to generate");
    }
    setGenerating(false);
  }

  async function downloadPDF() {
    if (!resumeRef.current) return;
    setDownloading(true);
    try {
      // Load html2pdf from CDN (no npm install needed)
      if (!(window as any).html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load PDF library"));
          document.head.appendChild(script);
        });
      }
      const h2p = (window as any).html2pdf;
      await h2p()
        .set({
          margin: [8, 8, 8, 8], // top, right, bottom, left in mm
          filename: `${form.name.replace(/\s+/g, "_") || "Resume"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["avoid-all", "css"] },
        })
        .from(resumeRef.current)
        .save();
    } catch (e: any) {
      alert("PDF download failed: " + e.message);
    }
    setDownloading(false);
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">AI Resume Builder</h1>
          <p className="text-gray-500 mt-2">Professional resume banayein seconds mein — Bilkul FREE!</p>
        </div>

        {/* Progress Steps */}
        {step < 3 && (
          <div className="flex items-center justify-between mb-8 px-2">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${i <= step ? "text-indigo-600" : "text-gray-400"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                    ${i < step ? "bg-indigo-600 border-indigo-600 text-white" : i === step ? "border-indigo-600 text-indigo-600" : "border-gray-300"}`}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className="text-xs font-semibold hidden sm:block">{s}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-indigo-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8">

          {/* STEP 1: Personal Info */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" /> Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputBox label="Full Name *" value={form.name} onChange={(v: string) => update("name", v)} placeholder="Rahul Kumar" />
                <InputBox label="Date of Birth *" type="date" value={form.dob} onChange={(v: string) => update("dob", v)} />
                <InputBox label="Phone Number *" value={form.phone} onChange={(v: string) => update("phone", v)} placeholder="9876543210" />
                <InputBox label="Email ID *" type="email" value={form.email} onChange={(v: string) => update("email", v)} placeholder="rahul@gmail.com" />
                <InputBox label="City / District *" value={form.city} onChange={(v: string) => update("city", v)} placeholder="Patna, Bihar" />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Gender</label>
                  <select value={form.gender} onChange={e => update("gender", e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Job Objective (Optional hint)</label>
                <input value={form.objective_hint} onChange={e => update("objective_hint", e.target.value)}
                  placeholder="e.g. SSC, Railway, Banking, Police, Teacher..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
            </div>
          )}

          {/* STEP 2: Education */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-500" /> Education Details
              </h2>
              {/* 10th */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-blue-700 dark:text-blue-400">10th / Matriculation</h3>
                <div className="grid grid-cols-2 gap-3">
                  <InputBox label="Board" value={form.edu10.board} onChange={(v: string) => updateNested("edu10", "board", v)} placeholder="BSEB / CBSE / UP" />
                  <InputBox label="School Name" value={form.edu10.school} onChange={(v: string) => updateNested("edu10", "school", v)} placeholder="High School Name" />
                  <InputBox label="Passing Year" value={form.edu10.year} onChange={(v: string) => updateNested("edu10", "year", v)} placeholder="2018" />
                  <InputBox label="Percentage / CGPA" value={form.edu10.percent} onChange={(v: string) => updateNested("edu10", "percent", v)} placeholder="75%" />
                </div>
              </div>
              {/* 12th */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-purple-700 dark:text-purple-400">12th / Intermediate</h3>
                <div className="grid grid-cols-2 gap-3">
                  <InputBox label="Board" value={form.edu12.board} onChange={(v: string) => updateNested("edu12", "board", v)} placeholder="BSEB / CBSE / UP" />
                  <InputBox label="School/College Name" value={form.edu12.school} onChange={(v: string) => updateNested("edu12", "school", v)} placeholder="Inter College Name" />
                  <InputBox label="Stream" value={form.edu12.stream} onChange={(v: string) => updateNested("edu12", "stream", v)} placeholder="Science / Arts / Commerce" />
                  <InputBox label="Passing Year" value={form.edu12.year} onChange={(v: string) => updateNested("edu12", "year", v)} placeholder="2020" />
                  <InputBox label="Percentage / CGPA" value={form.edu12.percent} onChange={(v: string) => updateNested("edu12", "percent", v)} placeholder="68%" />
                </div>
              </div>
              {/* Graduation */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-green-700 dark:text-green-400">Graduation / Diploma (Optional)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <InputBox label="Degree" value={form.eduGrad.degree} onChange={(v: string) => updateNested("eduGrad", "degree", v)} placeholder="B.A. / B.Sc / B.Com" />
                  <InputBox label="College Name" value={form.eduGrad.college} onChange={(v: string) => updateNested("eduGrad", "college", v)} placeholder="College Name" />
                  <InputBox label="University" value={form.eduGrad.university} onChange={(v: string) => updateNested("eduGrad", "university", v)} placeholder="University Name" />
                  <InputBox label="Passing Year" value={form.eduGrad.year} onChange={(v: string) => updateNested("eduGrad", "year", v)} placeholder="2023" />
                  <InputBox label="Percentage / CGPA" value={form.eduGrad.percent} onChange={(v: string) => updateNested("eduGrad", "percent", v)} placeholder="65%" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Skills */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-500" /> Skills & Additional Info
              </h2>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Skills *</label>
                <textarea value={form.skills} onChange={e => update("skills", e.target.value)} rows={3}
                  placeholder="Computer (MS Office, Typing), Communication, Leadership, Problem Solving..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Work Experience (Optional)</label>
                <textarea value={form.experience} onChange={e => update("experience", e.target.value)} rows={3}
                  placeholder="e.g. Office Clerk at ABC Company (2022-2023) — handled records, filing, data entry... OR Fresher"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
              </div>
              <InputBox label="Languages Known" value={form.languages} onChange={(v: string) => update("languages", v)} placeholder="Hindi, English, Bhojpuri" />

              {error && <p className="text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">{error}</p>}

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Resume Builder kya karega:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-indigo-600 dark:text-indigo-300">
                  <li>✨ Professional Career Objective statement likhega</li>
                  <li>✨ Career Summary auto-generate karega</li>
                  <li>✨ Skills ko professional format me present karega</li>
                  <li>✨ Achievements aur Hobbies suggest karega</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 4: Resume Preview */}
          {step === 3 && aiData && (
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-500" /> Resume Preview
                </h2>
                <button onClick={downloadPDF} disabled={downloading}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-70 shadow-lg shadow-indigo-600/20">
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Download PDF
                </button>
              </div>

              {/* Resume Template — A4 Compact */}
              <div
                ref={resumeRef}
                style={{
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: "10.5px",
                  lineHeight: "1.4",
                  padding: "18mm 15mm 15mm 15mm",
                  width: "210mm",
                  minHeight: "270mm",
                  maxWidth: "210mm",
                  background: "white",
                  color: "#111",
                  margin: "0 auto",
                  boxSizing: "border-box",
                }}
              >
                {/* Header */}
                <div style={{ textAlign: "center", borderBottom: "2.5px solid #1e3a8a", paddingBottom: "8px", marginBottom: "10px" }}>
                  <div style={{ fontSize: "20px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "2px", color: "#1e1b4b" }}>
                    {form.name || "Your Name"}
                  </div>
                  <div style={{ marginTop: "4px", color: "#374151", fontSize: "9.5px", display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "14px" }}>
                    {form.phone && <span>📞 {form.phone}</span>}
                    {form.email && <span>✉ {form.email}</span>}
                    {form.city && <span>📍 {form.city}</span>}
                    {form.dob && <span>DOB: {new Date(form.dob).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                    {form.gender && <span>Gender: {form.gender.charAt(0).toUpperCase() + form.gender.slice(1)}</span>}
                  </div>
                </div>

                {/* Objective */}
                <ResumeSection title="CAREER OBJECTIVE">
                  <p style={{ textAlign: "justify", margin: 0 }}>{aiData.objective}</p>
                </ResumeSection>

                {/* Summary */}
                <ResumeSection title="PROFESSIONAL SUMMARY">
                  <p style={{ textAlign: "justify", margin: 0 }}>{aiData.summary}</p>
                </ResumeSection>

                {/* Education */}
                <ResumeSection title="EDUCATIONAL QUALIFICATION">
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5px" }}>
                    <thead>
                      <tr style={{ background: "#1e3a8a", color: "white" }}>
                        {["Examination", "Board/University", "Institution", "Year", "%"].map(h => (
                          <th key={h} style={{ padding: "3px 6px", textAlign: "left", fontWeight: "700", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {form.eduGrad.degree && (
                        <ResumeEduRow exam={form.eduGrad.degree} board={form.eduGrad.university} inst={form.eduGrad.college} year={form.eduGrad.year} pct={form.eduGrad.percent} odd />
                      )}
                      {form.edu12.year && (
                        <ResumeEduRow exam={`12th (${form.edu12.stream || "Inter"})`} board={form.edu12.board} inst={form.edu12.school} year={form.edu12.year} pct={form.edu12.percent} odd={!form.eduGrad.degree} />
                      )}
                      {form.edu10.year && (
                        <ResumeEduRow exam="10th (Matric)" board={form.edu10.board} inst={form.edu10.school} year={form.edu10.year} pct={form.edu10.percent} />
                      )}
                    </tbody>
                  </table>
                </ResumeSection>

                {/* Skills */}
                <ResumeSection title="SKILLS & COMPETENCIES">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {aiData.skills_formatted?.map((s: string, i: number) => (
                      <span key={i} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: "1px 8px", borderRadius: "20px", fontSize: "9px", fontWeight: "600" }}>{s}</span>
                    ))}
                  </div>
                </ResumeSection>

                {/* Experience */}
                {form.experience && form.experience.toLowerCase() !== "fresher" && (
                  <ResumeSection title="WORK EXPERIENCE">
                    <p style={{ margin: 0 }}>{form.experience}</p>
                  </ResumeSection>
                )}

                {/* Achievements + Languages + Hobbies — compact 2 col */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <ResumeSection title="ACHIEVEMENTS">
                    <ul style={{ margin: 0, paddingLeft: "14px" }}>
                      {aiData.achievements?.map((a: string, i: number) => <li key={i} style={{ marginBottom: "2px" }}>{a}</li>)}
                    </ul>
                  </ResumeSection>
                  <div>
                    <ResumeSection title="LANGUAGES KNOWN">
                      <p style={{ margin: 0 }}>{form.languages}</p>
                    </ResumeSection>
                    <ResumeSection title="HOBBIES & INTERESTS">
                      <p style={{ margin: 0 }}>{aiData.hobbies?.join(", ")}</p>
                    </ResumeSection>
                  </div>
                </div>

                {/* Declaration */}
                <ResumeSection title="DECLARATION">
                  <p style={{ textAlign: "justify", margin: 0 }}>
                    I hereby declare that all the information provided above is true and correct to the best of my knowledge and belief.
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", fontSize: "9.5px" }}>
                    <span>Place: {form.city}</span>
                    <span>Date: {new Date().toLocaleDateString("en-IN")}</span>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ marginBottom: "20px" }}></div>
                      <div style={{ borderTop: "1px solid #374151", paddingTop: "2px" }}>{form.name}</div>
                      <div style={{ fontSize: "8.5px", color: "#6b7280" }}>(Signature)</div>
                    </div>
                  </div>
                </ResumeSection>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 3 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" /> Pichhe
              </button>

              {step < 2 ? (
                <button onClick={() => setStep(s => s + 1)}
                  disabled={step === 0 && (!form.name || !form.phone)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50">
                  Aage <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={generateResume} disabled={generating || !form.skills}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50">
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> AI Generate kar raha hai...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> AI se Resume Banao</>
                  )}
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => { setStep(2); setAiData(null); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl">
                <ChevronLeft className="w-4 h-4" /> Edit Karein
              </button>
              <button onClick={generateResume} disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold rounded-xl">
                <Sparkles className="w-4 h-4" /> Regenerate
              </button>
            </div>
          )}
        </div>

        {/* AdSense — Top Banner after form */}
        <div className="mt-6">
          <AdSensePlaceholder format="leaderboard" />
        </div>

        {/* Features Section — SEO content */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Sparkles, title: "AI-Powered Content", desc: "Our advanced AI automatically generates your Career Objective, Professional Summary, and Achievements — perfectly crafted for Indian government job applications.", color: "indigo" },
            { icon: Shield, title: "100% Free & Secure", desc: "No hidden charges, no registration required. Your personal information is never stored — the resume is built entirely within your browser session.", color: "green" },
            { icon: Clock, title: "Ready in 2 Minutes", desc: "Just 3 simple steps and your professional resume is ready to download. Perfect format for SSC, Railway, Banking, Police, and all government exams.", color: "blue" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-${color}-100 dark:bg-${color}-900/30`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* AdSense — Rectangle Middle */}
        <div className="mt-8 flex justify-center">
          <AdSensePlaceholder format="rectangle" />
        </div>

        {/* SEO Rich Content */}
        <div className="mt-10 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
            Free AI Resume Builder — Best for Government Job Aspirants in India
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Rojgar Suvidha's <strong>Free AI Resume Builder</strong> is specifically designed for <strong>Indian government job aspirants</strong>. Whether you are preparing for SSC CGL, SSC CHSL, Railway NTPC, RRB Group D, IBPS PO, SBI Clerk, UP Police, Bihar Police, or any State PSC exam — having a <strong>professional, well-structured resume</strong> is essential to make a strong first impression.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Our tool uses advanced AI to instantly generate a <strong>complete, formatted resume</strong> tailored to Indian government job standards — including a formal Career Objective, Educational Qualification table, Skills section, and a proper Declaration with signature space.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" /> What's Included in Your Resume
              </h3>
              <ul className="space-y-2">
                {[
                  "✅ Professional Career Objective",
                  "✅ Educational Qualification Table",
                  "✅ Skills & Competencies Section",
                  "✅ Work Experience / Fresher Format",
                  "✅ Achievements & Extra Activities",
                  "✅ Languages Known",
                  "✅ Hobbies & Interests",
                  "✅ Formal Signature & Declaration",
                ].map(item => (
                  <li key={item} className="text-xs text-gray-600 dark:text-gray-400">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Best Suited For
              </h3>
              <ul className="space-y-2">
                {[
                  "🏛️ SSC CGL, CHSL, MTS, GD Constable",
                  "🚂 Railway NTPC, Group D, ALP",
                  "🏦 IBPS PO, Clerk, SBI, RBI Grade B",
                  "👮 UP Police, Bihar Police, CISF, BSF",
                  "🎖️ UPSC Civil Services, NDA, CDS, IAS",
                  "📚 CTET, KVS, NVS, State TET",
                  "🏢 State PSC — UPPSC, BPSC, MPPSC",
                  "🛡️ Indian Army, Navy, Air Force",
                ].map(item => (
                  <li key={item} className="text-xs text-gray-600 dark:text-gray-400">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section — SEO */}
        <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-5">
            Frequently Asked Questions (FAQ)
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Is this AI resume builder completely free?",
                a: "Yes, 100% free! No registration, no credit card, no hidden charges. You can create unlimited resumes without any cost."
              },
              {
                q: "How do I download the resume as PDF?",
                a: "After viewing the resume preview, click the 'Download PDF' button. Your browser's print dialog will open — select 'Save as PDF' as the destination and click Save."
              },
              {
                q: "What does the AI automatically generate?",
                a: "The AI uses your entered details to automatically generate a professional Career Objective, Professional Summary, formatted Skills list, relevant Achievements, and suitable Hobbies — all in formal English."
              },
              {
                q: "Is my personal information safe?",
                a: "Absolutely. Your data is only used to generate the resume and is never stored on our servers. Everything happens within your browser session and is discarded once you leave the page."
              },
              {
                q: "What is the best resume format for government jobs in India?",
                a: "For Indian government jobs, a clean, formal, and structured resume works best. Our template follows the standard format used for sarkari naukri applications — with an Education Table, formal Career Objective, Declaration section, and signature space."
              },
              {
                q: "Can a fresher use this resume builder?",
                a: "Yes! The resume builder is perfectly suitable for freshers with no work experience. Simply leave the experience field blank or type 'Fresher' — the AI will generate an impressive resume based on your education and skills alone."
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">❓ {q}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom AdSense */}
        <div className="mt-6 mb-4">
          <AdSensePlaceholder format="leaderboard" />
        </div>

      </div>
    </div>
  );
}


// Helper Components for Resume Template
function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "9px" }}>
      <div style={{ background: "#1e3a8a", color: "white", padding: "3px 8px", fontWeight: "800", fontSize: "9.5px", letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: "6px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ResumeEduRow({ exam, board, inst, year, pct, odd }: any) {
  return (
    <tr style={{ background: odd ? "#f0f4ff" : "white" }}>
      <td style={{ padding: "3px 6px", borderBottom: "1px solid #e5e7eb" }}>{exam}</td>
      <td style={{ padding: "3px 6px", borderBottom: "1px solid #e5e7eb" }}>{board}</td>
      <td style={{ padding: "3px 6px", borderBottom: "1px solid #e5e7eb" }}>{inst}</td>
      <td style={{ padding: "3px 6px", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" as const }}>{year}</td>
      <td style={{ padding: "3px 6px", borderBottom: "1px solid #e5e7eb", fontWeight: "700" }}>{pct}</td>
    </tr>
  );
}
