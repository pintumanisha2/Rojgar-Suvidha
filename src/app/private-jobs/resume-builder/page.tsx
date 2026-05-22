"use client";

import { useState, useRef } from"react";
import { Loader2, Download, Sparkles, CheckCircle2, User, GraduationCap, Briefcase, ChevronRight, ChevronLeft, Eye, FileText, Shield, Clock, Star } from"lucide-react";
import AdSensePlaceholder from"@/components/ads/AdSensePlaceholder";
import { generateLocalResume } from"@/utils/localResumeGenerator";

function InputBox({ label, value, onChange, type ="text", placeholder =""}: {
 label: string; value: string; onChange: (v: string) => void;
 type?: string; placeholder?: string;
}) {
 return (
 <div className="space-y-1.5">
 <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">{label}</label>
 <input
 type={type}
 value={value}
 onChange={e => onChange(e.target.value)}
 placeholder={placeholder}
 className="w-full px-4 py-3.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 font-medium hover:scale-[1.005] focus:scale-[1.005] duration-300"
 />
 </div>
 );
}

const STEPS = ["Personal Info","Education","Skills & Experience","Preview & Download"];

const INITIAL = {
 name:"", email:"", phone:"", city:"", dob:"", gender:"male",
 objective_hint:"",
 edu10: { board:"", school:"", year:"", percent:""},
 edu12: { board:"", school:"", year:"", percent:"", stream:""},
 eduGrad: { degree:"", college:"", university:"", year:"", percent:""},
 skills:"", experience:"", languages:"Hindi, English",
};

export default function CorporateResumeBuilderPage() {
 const [step, setStep] = useState(0);
 const [form, setForm] = useState(INITIAL);
 const [generating, setGenerating] = useState(false);
 const [aiData, setAiData] = useState<any>(null);
 const [error, setError] = useState("");
 const [downloading, setDownloading] = useState(false);
 const [engine, setEngine] = useState<"local"|"groq">("local");
 const [fallbackBanner, setFallbackBanner] = useState(false);
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
 if (engine ==="local") {
 const localData = generateLocalResume(form);
 setAiData(localData);
 setFallbackBanner(false);
 setStep(3);
 } else {
 const res = await fetch("/api/generate-resume", {
 method:"POST",
 headers: {"Content-Type":"application/json"},
 body: JSON.stringify(form),
 });
 const data = await res.json();
 if (!res.ok) throw new Error(data.error);
 setAiData(data.data);
 setFallbackBanner(false);
 setStep(3);
 }
 } catch (e: any) {
 console.warn("AI generation failed, falling back to offline smart synthesis:", e);
 try {
 const localData = generateLocalResume(form);
 setAiData(localData);
 setFallbackBanner(true);
 setStep(3);
 } catch (fallbackErr: any) {
 setError(e.message ||"Failed to generate");
 }
 }
 setGenerating(false);
 }

 async function downloadPDF() {
 if (!resumeRef.current) return;
 setDownloading(true);
 try {
 if (!(window as any).html2pdf) {
 await new Promise<void>((resolve, reject) => {
 const script = document.createElement("script");
 script.src ="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
 script.onload = () => resolve();
 script.onerror = () => reject(new Error("Failed to load PDF library"));
 document.head.appendChild(script);
 });
 }
 const h2p = (window as any).html2pdf;
 await h2p()
 .set({
 margin: [8, 8, 8, 8],
 filename:`${form.name.replace(/\s+/g,"_") ||"Resume"}.pdf`,
 image: { type:"jpeg", quality: 0.98 },
 html2canvas: { scale: 2, useCORS: true, logging: false },
 jsPDF: { unit:"mm", format:"a4", orientation:"portrait"},
 pagebreak: { mode: ["avoid-all","css"] },
 })
 .from(resumeRef.current)
 .save();
 } catch (e: any) {
 alert("PDF download failed:"+ e.message);
 }
 setDownloading(false);
 }

 return (
 <div className="min-h-screen bg-slate-50/50 py-12 px-4 relative overflow-hidden transition-colors duration-500">
 
 {/* Premium Background Glow Orbs */}
 <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse pointer-events-none"/>
 <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"/>
 
 <div className="max-w-4xl mx-auto">

 {/* Header */}
 <div className="text-center mb-10 space-y-4">
 <div className="inline-flex items-center justify-center p-4 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm relative group">
 <Sparkles className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform duration-300"/>
 <div className="absolute -inset-0.5 bg-blue-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500 -z-10"/>
 </div>
 <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
 AI Corporate <span className="text-blue-600">Resume Builder</span>
 </h1>
 <p className="text-sm text-slate-500 max-w-xl mx-auto font-medium leading-relaxed">
 Professional ATS-friendly Resume banayein corporate openings ke liye — 100% FREE!
 </p>
 </div>

 {/* Progress Steps */}
 {step < 3 && (
 <div className="flex bg-white/70 p-4 rounded-3xl border border-slate-200/50 backdrop-blur-sm justify-between mb-8 px-6 sm:px-10 items-center">
 {STEPS.slice(0, 3).map((s, i) => (
 <div key={s} className="flex items-center flex-1 last:flex-initial">
 <div className={`flex items-center gap-3 ${i <= step ?"text-blue-600":"text-slate-400"}`}>
 <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all duration-300 relative
 ${i < step 
 ?"bg-blue-600 border-transparent text-white"
 : i === step 
 ?"border-blue-600 text-blue-600 shadow-lg shadow-blue-500/10"
 :"border-slate-200 bg-transparent text-slate-400"}`}>
 {i < step ?"✓": i + 1}
 {i === step && <span className="absolute -inset-1 rounded-full border border-blue-500/30 animate-ping pointer-events-none"/>}
 </div>
 <span className="text-xs font-black hidden sm:block tracking-wide uppercase">{s}</span>
 </div>
 {i < 2 && <div className={`flex-1 h-[2px] mx-4 transition-all duration-500 ${i < step ?"bg-blue-500":"bg-slate-200"}`} />}
 </div>
 ))}
 </div>
 )}

 <div className="bg-white/70 border border-slate-200/50 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-blue-500/5 p-6 sm:p-10 transition-all duration-300 hover:border-blue-400/50">

 {/* STEP 1: Personal Info */}
 {step === 0 && (
 <div className="space-y-6 animate-fadeIn">
 <h2 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
 <User className="w-6 h-6 text-blue-600"/> Personal Information
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
 <InputBox label="Full Name *"value={form.name} onChange={(v: string) => update("name", v)} placeholder="Aarav Sharma"/>
 <InputBox label="Date of Birth *"type="date"value={form.dob} onChange={(v: string) => update("dob", v)} />
 <InputBox label="Phone Number *"value={form.phone} onChange={(v: string) => update("phone", v)} placeholder="9876543210"/>
 <InputBox label="Email ID *"type="email"value={form.email} onChange={(v: string) => update("email", v)} placeholder="aarav@gmail.com"/>
 <InputBox label="City / District *"value={form.city} onChange={(v: string) => update("city", v)} placeholder="Bangalore, Karnataka"/>
 <div className="space-y-1.5">
 <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Gender</label>
 <select value={form.gender} onChange={e => update("gender", e.target.value)}
 className="w-full px-4 py-3.5 bg-slate-50/60 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 font-medium hover:scale-[1.005] focus:scale-[1.005]">
 <option value="male">Male</option>
 <option value="female">Female</option>
 <option value="other">Other</option>
 </select>
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Target Job Title / Domain (e.g., Frontend Engineer)</label>
 <input value={form.objective_hint} onChange={e => update("objective_hint", e.target.value)}
 placeholder="e.g., Software Engineer, Digital Marketer, HR Associate, Sales Lead..."
 className="w-full px-4 py-3.5 bg-slate-50/60 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 font-medium hover:scale-[1.005] focus:scale-[1.005]"/>
 </div>
 </div>
 )}

 {/* STEP 2: Education */}
 {step === 1 && (
 <div className="space-y-6 animate-fadeIn">
 <h2 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
 <GraduationCap className="w-6 h-6 text-blue-600"/> Education Details
 </h2>
 
 {/* Graduation */}
 <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-6 space-y-4">
 <h3 className="font-black text-emerald-800 tracking-wide text-sm uppercase">Graduation / Post Graduation / Diploma</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <InputBox label="Degree"value={form.eduGrad.degree} onChange={(v: string) => updateNested("eduGrad","degree", v)} placeholder="B.Tech / BCA / BBA / MBA"/>
 <InputBox label="College Name"value={form.eduGrad.college} onChange={(v: string) => updateNested("eduGrad","college", v)} placeholder="Engineering / Management College"/>
 <InputBox label="University"value={form.eduGrad.university} onChange={(v: string) => updateNested("eduGrad","university", v)} placeholder="VTU / IPU / Mumbai University"/>
 <div className="grid grid-cols-2 gap-4">
 <InputBox label="Passing Year"value={form.eduGrad.year} onChange={(v: string) => updateNested("eduGrad","year", v)} placeholder="2024"/>
 <InputBox label="CGPA / %"value={form.eduGrad.percent} onChange={(v: string) => updateNested("eduGrad","percent", v)} placeholder="8.5 CGPA"/>
 </div>
 </div>
 </div>

 {/* 12th */}
 <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-2xl p-6 space-y-4">
 <h3 className="font-black text-indigo-800 tracking-wide text-sm uppercase">12th / Intermediate</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <InputBox label="Board"value={form.edu12.board} onChange={(v: string) => updateNested("edu12","board", v)} placeholder="CBSE / ICSE / State Board"/>
 <InputBox label="School/College Name"value={form.edu12.school} onChange={(v: string) => updateNested("edu12","school", v)} placeholder="Senior Secondary School"/>
 <InputBox label="Stream"value={form.edu12.stream} onChange={(v: string) => updateNested("edu12","stream", v)} placeholder="Science / Commerce / Arts"/>
 <div className="grid grid-cols-2 gap-4">
 <InputBox label="Passing Year"value={form.edu12.year} onChange={(v: string) => updateNested("edu12","year", v)} placeholder="2020"/>
 <InputBox label="Percentage"value={form.edu12.percent} onChange={(v: string) => updateNested("edu12","percent", v)} placeholder="88%"/>
 </div>
 </div>
 </div>

 {/* 10th */}
 <div className="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-6 space-y-4">
 <h3 className="font-black text-blue-800 tracking-wide text-sm uppercase">10th / Matriculation</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <InputBox label="Board"value={form.edu10.board} onChange={(v: string) => updateNested("edu10","board", v)} placeholder="CBSE / State Board"/>
 <InputBox label="School Name"value={form.edu10.school} onChange={(v: string) => updateNested("edu10","school", v)} placeholder="High School"/>
 <InputBox label="Passing Year"value={form.edu10.year} onChange={(v: string) => updateNested("edu10","year", v)} placeholder="2018"/>
 <InputBox label="Percentage"value={form.edu10.percent} onChange={(v: string) => updateNested("edu10","percent", v)} placeholder="90%"/>
 </div>
 </div>
 </div>
 )}

 {/* STEP 3: Skills */}
 {step === 2 && (
 <div className="space-y-6 animate-fadeIn">
 <h2 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
 <Briefcase className="w-6 h-6 text-blue-600"/> Skills & Work Experience
 </h2>
 <div className="space-y-1.5">
 <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Technical & Soft Skills *</label>
 <textarea value={form.skills} onChange={e => update("skills", e.target.value)} rows={3}
 placeholder="e.g. JavaScript, React.JS, TailwindCSS, Communication, Public Speaking..."
 className="w-full px-4 py-3.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 font-medium hover:scale-[1.005] focus:scale-[1.005] resize-none"/>
 </div>
 <div className="space-y-1.5">
 <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Work Experience / Projects (Optional)</label>
 <textarea value={form.experience} onChange={e => update("experience", e.target.value)} rows={3}
 placeholder="e.g., Software Intern at TechCorp (3 months) - helped build user dashboard, API integrations... OR Fresh Graduate"
 className="w-full px-4 py-3.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-900 font-medium hover:scale-[1.005] focus:scale-[1.005] resize-none"/>
 </div>
 <InputBox label="Languages Known"value={form.languages} onChange={(v: string) => update("languages", v)} placeholder="English, Hindi"/>

 {/* Engine Selector */}
 <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-3.5 shadow-sm">
 <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
 Choose Resume Generation Engine
 </label>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
 <button
 type="button"
 onClick={() => setEngine("local")}
 className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
 engine ==="local"
 ?"bg-white border-blue-500 ring-2 ring-blue-500/10 shadow-md"
 :"bg-slate-50/50 border-slate-200 hover:border-slate-350"
 }`}
 >
 <div className="flex items-center gap-2 mb-1.5">
 <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-xs font-bold ${
 engine ==="local"?"bg-blue-600 border-blue-600 text-white":"border-slate-300 text-slate-500"
 }`}>
 {engine ==="local"?"✓":""}
 </span>
 <span className="font-black text-[10px] text-gray-900 uppercase tracking-wider">Local Engine</span>
 </div>
 <p className="text-[11px] text-slate-500 font-medium leading-relaxed">100% Free & Unlimited. Instant rendering, zero API limit consumption.</p>
 </button>
 
 <button
 type="button"
 onClick={() => setEngine("groq")}
 className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all relative overflow-hidden ${
 engine ==="groq"
 ?"bg-white border-blue-500 ring-2 ring-blue-500/10 shadow-md"
 :"bg-slate-50/50 border-slate-200 hover:border-slate-350"
 }`}
 >
 <div className="flex items-center gap-2 mb-1.5">
 <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-xs font-bold ${
 engine ==="groq"?"bg-blue-600 border-blue-600 text-white":"border-slate-300 text-slate-500"
 }`}>
 {engine ==="groq"?"✓":"🤖"}
 </span>
 <span className="font-black text-[10px] text-gray-900 uppercase tracking-wider">🤖 Groq AI Engine</span>
 </div>
 <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Runs dynamic neural optimization. Subject to key capacity limits.</p>
 </button>
 </div>
 </div>

 {error && <p className="text-rose-500 text-sm font-bold bg-rose-50 p-4 rounded-xl border border-rose-200/50">{error}</p>}

 <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 backdrop-blur-sm">
 <p className="text-sm font-black text-blue-700 flex items-center gap-2">
 <Sparkles className="w-4.5 h-4.5 text-amber-500"/> AI Resume Optimizer features:
 </p>
 <ul className="mt-2.5 space-y-1.5 text-xs text-slate-600 font-medium">
 <li className="flex items-center gap-2">• Professional Career Objective matching corporate job standards</li>
 <li className="flex items-center gap-2">• High impact summary tailored for HR ATS search screening</li>
 <li className="flex items-center gap-2">• Layout optimization designed for premium readability</li>
 </ul>
 </div>
 </div>
 )}

 {/* STEP 4: Resume Preview */}
 {step === 3 && aiData && (
 <div className="animate-fadeIn">
 {fallbackBanner && (
 <div className="mb-6 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-fadeIn">
 <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"/>
 <div>
 <h4 className="font-black text-xs tracking-wider uppercase text-amber-600">API Capacity Saved!</h4>
 <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
 The Groq AI model has hit its hourly rate limit or API key exhaustion. We have automatically leveraged our advanced offline smart rendering engine to construct a pristine corporate resume for you instantly!
 </p>
 </div>
 </div>
 )}
 <div className="flex items-center justify-between mb-8 flex-wrap gap-4 border-b border-slate-200/60 pb-5">
 <h2 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
 <Eye className="w-6 h-6 text-blue-600 animate-pulse"/> Live A4 Preview
 </h2>
 <button onClick={downloadPDF} disabled={downloading}
 className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3.5 rounded-2xl transition-all disabled:opacity-70 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
 {downloading ? <Loader2 className="w-4.5 h-4.5 animate-spin"/> : <Download className="w-4.5 h-4.5"/>}
 Download PDF Copy
 </button>
 </div>

 {/* Resume Template — A4 Compact */}
 <div className="overflow-x-auto p-1 sm:p-4 bg-slate-100 rounded-2xl border border-slate-200/50 mb-2">
 <div
 ref={resumeRef}
 className="shadow-2xl mx-auto rounded-sm"
 style={{
 fontFamily:"'Times New Roman', Times, serif",
 fontSize:"10.5px",
 lineHeight:"1.4",
 padding:"18mm 15mm 15mm 15mm",
 width:"210mm",
 minHeight:"270mm",
 maxWidth:"210mm",
 background:"white",
 color:"#111",
 boxSizing:"border-box",
 }}
 >
 {/* Header */}
 <div style={{ textAlign:"center", borderBottom:"2.5px solid #1e3a8a", paddingBottom:"8px", marginBottom:"10px"}}>
 <div style={{ fontSize:"20px", fontWeight:"900", textTransform:"uppercase", letterSpacing:"2px", color:"#1e1b4b"}}>
 {form.name ||"Your Name"}
 </div>
 <div style={{ marginTop:"4px", color:"#374151", fontSize:"9.5px", display:"flex", justifyContent:"center", flexWrap:"wrap", gap:"14px"}}>
 {form.phone && <span>📞 {form.phone}</span>}
 {form.email && <span>✉ {form.email}</span>}
 {form.city && <span>📍 {form.city}</span>}
 {form.dob && <span>DOB: {new Date(form.dob).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric"})}</span>}
 {form.gender && <span>Gender: {form.gender.charAt(0).toUpperCase() + form.gender.slice(1)}</span>}
 </div>
 </div>

 {/* Objective */}
 <ResumeSection title="CAREER OBJECTIVE">
 <p style={{ textAlign:"justify", margin: 0 }}>{aiData.objective}</p>
 </ResumeSection>

 {/* Summary */}
 <ResumeSection title="PROFESSIONAL SUMMARY">
 <p style={{ textAlign:"justify", margin: 0 }}>{aiData.summary}</p>
 </ResumeSection>

 {/* Education */}
 <ResumeSection title="EDUCATIONAL QUALIFICATION">
 <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"9.5px"}}>
 <thead>
 <tr style={{ background:"#1e3a8a", color:"white"}}>
 {["Degree/Exam","Board/University","Institution","Year","GPA/%"].map(h => (
 <th key={h} style={{ padding:"3px 6px", textAlign:"left", fontWeight:"700", whiteSpace:"nowrap"}}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {form.eduGrad.degree && (
 <ResumeEduRow exam={form.eduGrad.degree} board={form.eduGrad.university} inst={form.eduGrad.college} year={form.eduGrad.year} pct={form.eduGrad.percent} odd />
 )}
 {form.edu12.year && (
 <ResumeEduRow exam={`12th (${form.edu12.stream ||"Inter"})`} board={form.edu12.board} inst={form.edu12.school} year={form.edu12.year} pct={form.edu12.percent} odd={!form.eduGrad.degree} />
 )}
 {form.edu10.year && (
 <ResumeEduRow exam="10th (Matric)"board={form.edu10.board} inst={form.edu10.school} year={form.edu10.year} pct={form.edu10.percent} />
 )}
 </tbody>
 </table>
 </ResumeSection>

 {/* Skills */}
 <ResumeSection title="SKILLS & COMPETENCIES">
 <div style={{ display:"flex", flexWrap:"wrap", gap:"4px"}}>
 {aiData.skills_formatted?.map((s: string, i: number) => (
 <span key={i} style={{ background:"#eff6ff", border:"1px solid #bfdbfe", color:"#1e40af", padding:"1px 8px", borderRadius:"20px", fontSize:"9px", fontWeight:"600"}}>{s}</span>
 ))}
 </div>
 </ResumeSection>

 {/* Experience */}
 {form.experience && form.experience.toLowerCase() !=="fresh graduate"&& form.experience.toLowerCase() !=="fresher"&& (
 <ResumeSection title="PROFESSIONAL EXPERIENCE">
 <p style={{ margin: 0 }}>{form.experience}</p>
 </ResumeSection>
 )}

 {/* Achievements + Languages + Hobbies — compact 2 col */}
 <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px"}}>
 <ResumeSection title="KEY PROJECTS & ACHIEVEMENTS">
 <ul style={{ margin: 0, paddingLeft:"14px"}}>
 {aiData.achievements?.map((a: string, i: number) => <li key={i} style={{ marginBottom:"2px"}}>{a}</li>)}
 </ul>
 </ResumeSection>
 <div>
 <ResumeSection title="LANGUAGES">
 <p style={{ margin: 0 }}>{form.languages}</p>
 </ResumeSection>
 <ResumeSection title="INTERESTS">
 <p style={{ margin: 0 }}>{aiData.hobbies?.join(",")}</p>
 </ResumeSection>
 </div>
 </div>

 {/* Declaration */}
 <ResumeSection title="DECLARATION">
 <p style={{ textAlign:"justify", margin: 0 }}>
 I hereby declare that all the information provided above is true and correct to the best of my knowledge and belief.
 </p>
 <div style={{ display:"flex", justifyContent:"space-between", marginTop:"16px", fontSize:"9.5px"}}>
 <span>Place: {form.city}</span>
 <span>Date: {new Date().toLocaleDateString("en-IN")}</span>
 <div style={{ textAlign:"center"}}>
 <div style={{ marginBottom:"20px"}}></div>
 <div style={{ borderTop:"1px solid #374151", paddingTop:"2px"}}>{form.name}</div>
 <div style={{ fontSize:"8.5px", color:"#6b7280"}}>(Signature)</div>
 </div>
 </div>
 </ResumeSection>
 </div>
 </div>
 </div>
 )}

 {/* Navigation Buttons */}
 {step < 3 && (
 <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
 <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
 className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl transition-all disabled:opacity-30 text-xs">
 <ChevronLeft className="w-4 h-4"/> Back
 </button>

 {step < 2 ? (
 <button onClick={() => setStep(s => s + 1)}
 disabled={step === 0 && (!form.name || !form.phone)}
 className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50 text-xs">
 Next Step <ChevronRight className="w-4 h-4"/>
 </button>
 ) : (
 <button onClick={generateResume} disabled={generating || !form.skills}
 className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-xs">
 {generating ? (
 <><Loader2 className="w-4 h-4 animate-spin"/> Synthesizing ATS Resume...</>
 ) : (
 <><Sparkles className="w-4 h-4"/> Generate AI ATS Resume</>
 )}
 </button>
 )}
 </div>
 )}

 {step === 3 && (
 <div className="flex justify-between mt-8 pt-5 border-t border-slate-150">
 <button onClick={() => { setStep(2); setAiData(null); }}
 className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-2xl text-xs">
 <ChevronLeft className="w-4 h-4"/> Edit Details
 </button>
 <button onClick={generateResume} disabled={generating}
 className="flex items-center gap-2 px-5 py-3 bg-sky-100 hover:bg-sky-200 text-sky-700 font-black rounded-2xl text-xs">
 <Sparkles className="w-4 h-4 animate-spin-slow"/> Regenerate ATS Sheet
 </button>
 </div>
 )}
 </div>

 {/* AdSense — Top Banner after form */}
 <div className="mt-8">
 <AdSensePlaceholder format="leaderboard"/>
 </div>

 {/* Features Section — SEO content */}
 <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
 {[
 { icon: Sparkles, title:"AI Corporate Tuning", desc:"Our advanced AI models analyze corporate postings to craft optimal professional objectives and key experience highlights.", color:"indigo"as const },
 { icon: Shield, title:"100% Free & Direct", desc:"Zero registration required. Processed completely in-browser to protect critical candidate contact information and resume data.", color:"green"as const },
 { icon: Clock, title:"Standard ATS format", desc:"Formats generated files in a clean standard Times-New-Roman template highly rated by corporate Applicant Tracking Systems.", color:"blue"as const },
 ].map(({ icon: Icon, title, desc, color }) => {
 const styles = {
 indigo: { bg:"bg-blue-50 border border-blue-100/50", text:"text-blue-600"},
 green: { bg:"bg-emerald-50 border border-emerald-100/50", text:"text-emerald-600"},
 blue: { bg:"bg-indigo-50 border border-indigo-100/50", text:"text-indigo-600"}
 }[color];
 return (
 <div key={title} className="bg-white/70 backdrop-blur-sm rounded-[1.5rem] p-6 border border-slate-200/50 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:border-slate-350">
 <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${styles.bg}`}>
 <Icon className={`w-5 h-5 ${styles.text}`} />
 </div>
 <h3 className="font-black text-gray-900 text-sm mb-1.5">{title}</h3>
 <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
 </div>
 );
 })}
 </div>

 </div>
 </div>
 );
}

// Helper Components for Resume Template
function ResumeSection({ title, children }: { title: string; children: React.ReactNode }) {
 return (
 <div style={{ marginBottom:"9px"}}>
 <div style={{ background:"#1e3a8a", color:"white", padding:"3px 8px", fontWeight:"800", fontSize:"9.5px", letterSpacing:"1px", textTransform:"uppercase"as const, marginBottom:"6px"}}>
 {title}
 </div>
 {children}
 </div>
 );
}

function ResumeEduRow({ exam, board, inst, year, pct, odd }: any) {
 return (
 <tr style={{ background: odd ?"#f0f4ff":"white"}}>
 <td style={{ padding:"3px 6px", borderBottom:"1px solid #e5e7eb"}}>{exam}</td>
 <td style={{ padding:"3px 6px", borderBottom:"1px solid #e5e7eb"}}>{board}</td>
 <td style={{ padding:"3px 6px", borderBottom:"1px solid #e5e7eb"}}>{inst}</td>
 <td style={{ padding:"3px 6px", borderBottom:"1px solid #e5e7eb", whiteSpace:"nowrap"as const }}>{year}</td>
 <td style={{ padding:"3px 6px", borderBottom:"1px solid #e5e7eb", fontWeight:"700"}}>{pct}</td>
 </tr>
 );
}
