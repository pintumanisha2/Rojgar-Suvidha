"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { 
 GraduationCap, Briefcase, Mail, Phone, Save, Sparkles, 
 Loader2, LogOut, CheckCircle, MessageSquare, User, 
 Tag, Plus, X, Building, Send, ChevronRight,
 MapPin, DollarSign, FileText, ExternalLink, Shield, TrendingUp, BookOpen, Award, Check,
 AlertCircle
} from "lucide-react";
import ResumeUploader from "../components/ResumeUploader";
import AvatarUploader from "../components/AvatarUploader";

interface CandidateProfile {
 id: string;
 full_name: string;
 email: string;
 phone: string;
 skills: string[];
 experience: string;
 college: string;
 bio: string;
 desired_role?: string;
 preferred_location?: string;
 expected_ctc?: string;
 resume_url?: string;
 portfolio_url?: string;
 video_pitch_url?: string;
 avatar_url?: string;
 hackerrank_url?: string;
 leetcode_url?: string;
 certifications?: string;
}

interface ChatMessage {
 id: string;
 sender_id: string;
 receiver_id: string;
 message: string;
 sender_type: "employer" | "candidate";
 created_at: string;
 sender_name?: string;
 company_name?: string;
}

export default function PrivateCandidateDashboardPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [activeTab, setActiveTab] = useState<"profile" | "messages" | "applications" | "mock-interview" | "ats-optimizer">("profile");
 const [loading, setLoading] = useState(false);

 // Profile Form States
 const [fullName, setFullName] = useState("");
 const [email, setEmail] = useState("");
 const [phone, setPhone] = useState("");
 const [skills, setSkills] = useState<string[]>([]);
 const [skillInput, setSkillInput] = useState("");
 const [experience, setExperience] = useState("");
 const [college, setCollege] = useState("");
 const [bio, setBio] = useState("");
 const [desiredRole, setDesiredRole] = useState("");
 const [preferredLocation, setPreferredLocation] = useState("");
 const [expectedCtc, setExpectedCtc] = useState("");
 const [resumeUrl, setResumeUrl] = useState("");
 const [portfolioUrl, setPortfolioUrl] = useState("");
 const [videoPitchUrl, setVideoPitchUrl] = useState("");
 const [avatarUrl, setAvatarUrl] = useState("");
 const [hackerrankUrl, setHackerrankUrl] = useState("");
 const [leetcodeUrl, setLeetcodeUrl] = useState("");
 const [certifications, setCertifications] = useState("");
 const [userId, setUserId] = useState<string | null>(null);

 // Message States
 const [threads, setThreads] = useState<{ id: string; name: string; company: string; lastMessage: string }[]>([]);
 const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
 const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
 const [newMessage, setNewMessage] = useState("");
 
 // Profile Visits / Notifications State
 const [profileVisits, setProfileVisits] = useState<any[]>([]);

 // AI Mock Interview States
 const [interviewStarted, setInterviewStarted] = useState(false);
 const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
 const [candidateResponse, setCandidateResponse] = useState("");
 const [interviewHistory, setInterviewHistory] = useState<{
 type: "bot" | "user";
 text: string;
 score?: number;
 tips?: string;
 }[]>([]);
 const [interviewEnded, setInterviewEnded] = useState(false);
 const [mockSelectedRole, setMockSelectedRole] = useState("");

 // AI Resume Matcher States
 const [jobDescription, setJobDescription] = useState("");
 const [isMatching, setIsMatching] = useState(false);
 const [matchResult, setMatchResult] = useState<{
 score: number;
 matchedKeywords: string[];
 missingKeywords: string[];
 recommendations: string[];
 } | null>(null);

 const messagesEndRef = useRef<HTMLDivElement>(null);

 // Profile completeness calculator
 const getProfileCompletion = () => {
 let score = 0;
 const items: { label: string; score: number; complete: boolean; action: string; fieldId: string }[] = [];

 // 1. Full Name (2%)
 const isFullNameComplete = !!fullName.trim() && fullName.trim() !== "New Candidate";
 score += isFullNameComplete ? 2 : 0;
 items.push({
 label: "Full Name",
 score: 2,
 complete: isFullNameComplete,
 action: "Enter your professional full name",
 fieldId: "field-fullName"
 });

 // 2. Email Address (8%)
 const isEmailComplete = !!email.trim();
 score += isEmailComplete ? 8 : 0;
 items.push({
 label: "Email Address",
 score: 8,
 complete: isEmailComplete,
 action: "Verify primary email address",
 fieldId: "field-email"
 });

 // 3. Mobile Number (10%)
 const isPhoneComplete = !!phone.trim();
 score += isPhoneComplete ? 10 : 0;
 items.push({
 label: "Mobile Number",
 score: 10,
 complete: isPhoneComplete,
 action: "Add a mobile number for recruiter calls",
 fieldId: "field-phone"
 });

 // 4. College (10%)
 const isCollegeComplete = !!college.trim();
 score += isCollegeComplete ? 10 : 0;
 items.push({
 label: "College & Education",
 score: 10,
 complete: isCollegeComplete,
 action: "Enter college or academic degree details",
 fieldId: "field-college"
 });

 // 5. Professional Experience (15%)
 const isExperienceComplete = experience.trim().length > 5;
 score += isExperienceComplete ? 15 : 0;
 items.push({
 label: "Professional Experience",
 score: 15,
 complete: isExperienceComplete,
 action: "Detail your past work experience",
 fieldId: "field-experience"
 });

 // 6. Desired Role (10%)
 const isDesiredRoleComplete = !!desiredRole.trim();
 score += isDesiredRoleComplete ? 10 : 0;
 items.push({
 label: "Desired Job Role",
 score: 10,
 complete: isDesiredRoleComplete,
 action: "Specify desired job role/title",
 fieldId: "field-desiredRole"
 });

 // 7. Preferred Location (10%)
 const isPreferredLocationComplete = !!preferredLocation.trim();
 score += isPreferredLocationComplete ? 10 : 0;
 items.push({
 label: "Preferred Location",
 score: 10,
 complete: isPreferredLocationComplete,
 action: "Add preferred job locations",
 fieldId: "field-preferredLocation"
 });

 // 8. Expected CTC (10%)
 const isExpectedCtcComplete = !!expectedCtc.trim();
 score += isExpectedCtcComplete ? 10 : 0;
 items.push({
 label: "Expected CTC",
 score: 10,
 complete: isExpectedCtcComplete,
 action: "Set your expected salary package",
 fieldId: "field-expectedCtc"
 });

 // 9. Skills (10%)
 const skillsCount = skills.length;
 const skillsScore = Math.min(skillsCount * 4, 10);
 score += skillsScore;
 items.push({
 label: "Skills Tagging",
 score: 10,
 complete: skillsCount >= 3,
 action: `Add 3+ skills (Current: ${skillsCount}/3)`,
 fieldId: "field-skills"
 });

 // 10. Bio (10%)
 const bioLength = bio.trim().length;
 let bioScore = 0;
 if (bioLength >= 100) bioScore = 10;
 else if (bioLength >= 50) bioScore = 5;
 else if (bioLength > 0) bioScore = 2;
 score += bioScore;
 items.push({
 label: "Professional Bio",
 score: 10,
 complete: bioLength >= 100,
 action: `Describe projects & experience (Current: ${bioLength} chars)`,
 fieldId: "field-bio"
 });

 // Cap the score at 95% maximum to encourage continuous profile updates
 score = Math.min(score, 95);

 return { score, items };
 };

  useEffect(() => {
    if (getProfileCompletion().score >= 95) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [fullName, email, phone, skills, experience, college, bio, desiredRole, preferredLocation, expectedCtc]);

 // Live ATS Score Analyzer Algorithm
 const getATSAnalysis = () => {
 let score = 0;
 const foundKeywords: string[] = [];
 const suggestions: string[] = [];
 
 // 1. Resume presence
 if (resumeUrl) {
 score += 25;
 } else {
 suggestions.push("Upload your PDF Resume to significantly boost ATS parsing.");
 }
 
 // 2. Skills Match (Check against common high-demand keywords)
 const premiumKeywords = ["REACT","NEXT.JS","TYPESCRIPT","NODE.JS","PYTHON","SQL","AWS","JAVASCRIPT","TAILWIND","SUPABASE","EXPRESS","JAVA","MONGODB"];
 
 let skillsMatched = 0;
 skills.forEach(skill => {
 const s = skill.toUpperCase();
 if (premiumKeywords.some(pk => s.includes(pk) || pk.includes(s))) {
 foundKeywords.push(skill);
 skillsMatched++;
 }
 });
 
 score += Math.min(skillsMatched * 10, 40); // Max 40 points from skills
 
 if (skillsMatched < 4) {
 suggestions.push("Add more core technical skills (e.g., React, Node.js) to match standard job descriptions.");
 }
 
 // 3. Experience Details
 if (experience.trim().length > 5) {
 score += 15;
 } else {
 suggestions.push("Detail your professional experience. ATS systems look for clear job tenures.");
 }
 
 // 4. Bio completeness
 if (bio.length > 50) {
 score += 20;
 } else {
 suggestions.push("Write a comprehensive bio (50+ characters). Algorithms parse this for context.");
 }
 
 return { 
 score: Math.min(score, 100), 
 suggestions, 
 foundKeywords 
 };
 };

 // Database of Mock Interview Questions based on role
 const mockInterviewQuestions: Record<string, { question: string; keywords: string[]; sampleAnswer: string }[]> = {
"Frontend Developer": [
 {
 question:"How do you optimize a React component that's causing lag or too many re-renders in a large dashboard app?",
 keywords: ["memo","usecallback","usememo","state","virtual dom","profiler","render","re-render","reconciliation"],
 sampleAnswer:"I use React.memo to prevent unnecessary child renders, useCallback and useMemo to preserve reference equality of functions and values, split state into localized components, and use the React DevTools Profiler to identify exact bottleneck spots."
 },
 {
 question:"What is the difference between Client-Side Rendering (CSR), Server-Side Rendering (SSR), and Static Site Generation (SSG) in Next.js?",
 keywords: ["seo","server","client","pre-render","hydration","performance","build","request","static","getServerSideProps","getStaticProps"],
 sampleAnswer:"CSR renders elements in the browser, leaving a blank initial screen. SSR pre-renders pages on the server upon every request, providing great SEO and fresh data. SSG renders pages during build time, serving fast pre-compiled HTML files from a CDN."
 },
 {
 question:"Explain how CSS specificity works and how modern utility tools like Tailwind CSS handle conflicting styles.",
 keywords: ["specificity","selector","override","utility","important","tailwind","class","inline"],
 sampleAnswer:"CSS specificity is calculated using a scoring system for IDs, classes, and tags. Tailwind resolves conflicting classes by relying on source-order compiling inside standard stylesheets rather than specificity hacks."
 }
 ],
"Backend Developer": [
 {
 question:"How do you handle database connection pooling in high-traffic applications, and what is your strategy for query indexing?",
 keywords: ["connection","pool","index","latency","cache","query","scale","performance","postgres","sql","explain"],
 sampleAnswer:"I configure dynamic connection pools using tools like PgBouncer, index frequently queried columns like foreign keys, use EXPLAIN ANALYZE to identify slow queries, and cache expensive database requests in Redis."
 },
 {
 question:"What are the key security headers or practices you employ to protect REST APIs against CSRF or SQL Injection?",
 keywords: ["csrf","injection","parameterize","jwt","cors","helmet","sanitize","security","encryption"],
 sampleAnswer:"I parameterize all database queries to prevent SQL injections, use CSRF tokens for form actions, configure strict CORS policies, and add security headers like Helmet in Express."
 },
 {
 question:"Can you describe a situation where you had to design an asynchronous task queue system?",
 keywords: ["queue","redis","celery","async","worker","job","bull","process","concurrency"],
 sampleAnswer:"I set up asynchronous workers using BullMQ and Redis to process heavy background tasks (like generating PDF resumes or sending emails) so the main API thread remains fully responsive."
 }
 ],
"Product Manager": [
 {
 question:"How do you prioritize features for a product roadmap when multiple stakeholders have conflicting demands?",
 keywords: ["prioritize","rice","roadmap","stakeholder","metric","impact","effort","reach","roi"],
 sampleAnswer:"I use standardized prioritization frameworks like RICE (Reach, Impact, Confidence, Effort) to calculate an objective score for each feature, aligning stakeholders through data-driven ROI assessments."
 },
 {
 question:"Can you give an example of a product that has exceptional UX onboarding, and how you would improve its onboarding?",
 keywords: ["onboarding","ux","friction","activation","tutorial","user","retention"],
 sampleAnswer:"I think Slack's onboarding is outstanding due to Slackbot's interactive tutorial. I would improve it by personalizing the channels recommended during the first sign-up according to their department profile."
 },
 {
 question:"How do you define success metrics (KPIs) for a newly launched search filtering algorithm?",
 keywords: ["kpi","conversion","retention","click-through","ctr","bounce","engagement","accuracy"],
 sampleAnswer:"I track Click-Through-Rate (CTR) on first page results, average search completion time, search bounce rate, and overall application conversion rate to measure algorithm success."
 }
 ],
"Sales & Marketing": [
 {
 question:"How do you handle a customer objection where they like your recruitment platform but complain that the package price is too high?",
 keywords: ["objection","value","roi","discount","budget","demonstrate","competitor","trial"],
 sampleAnswer:"I shift the focus from price to value and ROI. I show them how our platform reduces recruiter time-to-hire by 40% and avoids costly bad hires, illustrating that the platform pays for itself within three months."
 },
 {
 question:"What strategies would you use to design a successful referral marketing campaign for a job search portal?",
 keywords: ["referral","viral","incentive","loop","sharing","advocate","bonus","acquisition"],
 sampleAnswer:"I would design a dual-incentive program where both the referrer and referee get premium resume profile upgrades upon sign-up, leveraging standard social media quick sharing loops."
 },
 {
 question:"Explain the difference between inbound and outbound sales methodologies, and when to use each.",
 keywords: ["inbound","outbound","lead","cold","marketing","funnel","conversion","nurture"],
 sampleAnswer:"Inbound sales pulls interested prospects through high-value content and SEO, whereas outbound sales actively reaches out to prospects via cold calls and emails. Inbound is better for long-term organic growth, while outbound yields faster targeted results."
 }
 ],
"General / Other Roles": [
 {
 question:"Tell me about a challenging technical or workplace conflict you faced in your career, and how you resolved it.",
 keywords: ["conflict","resolved","communicate","listen","compromise","perspective","collaboration"],
 sampleAnswer:"I once had a dispute with a dispute with a designer over feature scope. I set up a quick prototype meeting, listened to their visual priorities, and compromised on a phased rollout that satisfied design standards while staying on schedule."
 },
 {
 question:"How do you plan your work and manage priorities when you have multiple tight deadlines on the same day?",
 keywords: ["prioritize","deadline","organize","calendar","focus","time-management","delegate"],
 sampleAnswer:"I list all tasks, rank them by impact and urgency, block dedicated focus sessions on my calendar, and proactively inform project leads if any lower-priority deliverables might be slightly delayed."
 },
 {
 question:"Why are you interested in working with top private companies, and what is your greatest professional strength?",
 keywords: ["strength","growth","challenge","impact","value","skills","adaptability","team"],
 sampleAnswer:"I want to work with top private companies because of their fast-paced innovation, high standards, and opportunities for professional growth. My greatest strength is adaptability; I learn new systems and solve complex problems quickly."
 }
 ]
 };

 const handleStartInterview = (role: string) => {
 setMockSelectedRole(role);
 setInterviewStarted(true);
 setCurrentQuestionIndex(0);
 setCandidateResponse("");
 setInterviewEnded(false);
 
 const selectedList = mockInterviewQuestions[role] || mockInterviewQuestions["General / Other Roles"];
 
 setInterviewHistory([
 {
 type: "bot",
 text: `Welcome to your AI Mock Interview for the **${role}** position! I am your AI Recruiter today. Let's begin.\n\n**Question 1**: ${selectedList[0].question}`
 }
 ]);
 };

 const handleNextInterviewQuestion = () => {
 if (!candidateResponse.trim()) return;
 
 const selectedList = mockInterviewQuestions[mockSelectedRole] || mockInterviewQuestions["General / Other Roles"];
 const currentQ = selectedList[currentQuestionIndex];
 
 const cleanResponse = candidateResponse.toLowerCase();
 let score = 3; 
 const matched: string[] = [];
 
 currentQ.keywords.forEach(kw => {
 if (cleanResponse.includes(kw)) {
 score += 1.5;
 matched.push(kw);
 }
 });
 
 if (cleanResponse.length > 150) score += 1.5;
 else if (cleanResponse.length > 80) score += 1.0;
 
 const finalScore = Math.min(Math.round(score * 10) / 10, 10);
 
 let tips = "";
 if (finalScore >= 8) {
 tips = "Outstanding answer! You demonstrated strong technical proficiency and hit all key vocabulary terms. Great structure.";
 } else if (finalScore >= 6) {
 tips = `Solid effort! You covered some key points, but could improve by directly mentioning concepts like: ${currentQ.keywords.filter(k => !matched.includes(k)).slice(0, 3).join(",")}.`;
 } else {
 tips = `Your answer is a bit brief. For MNC interviews, aim to explain 'how' and 'why' by including technical terms like: ${currentQ.keywords.slice(0, 4).join(",")}. Provide concrete examples of your work.`;
 }

 const updatedHistory = [
 ...interviewHistory,
 {
 type: "user" as const,
 text: candidateResponse
 },
 {
 type: "bot" as const,
 text: `Thanks for your response. I have audited your answer.\n\n* **Score**: ${finalScore}/10\n* **Auditor Feedback**: ${tips}`
 }
 ];

 const nextIndex = currentQuestionIndex + 1;
 
 if (nextIndex < selectedList.length) {
 setCurrentQuestionIndex(nextIndex);
 setCandidateResponse("");
 
 updatedHistory.push({
 type: "bot",
 text: `**Question ${nextIndex + 1}**: ${selectedList[nextIndex].question}`
 });
 setInterviewHistory(updatedHistory);
 } else {
 setInterviewEnded(true);
 setCandidateResponse("");
 
 const scores = updatedHistory
 .filter(h => h.type === "bot" && h.text.includes("Score"))
 .map(h => {
 const match = h.text.match(/Score:\s*([\d.]+)/);
 return match ? parseFloat(match[1]) : 7.0;
 });
 
 scores.push(finalScore);
 
 const totalScore = scores.reduce((a, b) => a + b, 0);
 const avgScore = Math.round((totalScore / scores.length) * 10) / 10;
 
 let finalVerdict = "";
 if (avgScore >= 8.0) {
 finalVerdict = "🏆 **Elite Candidate (Hiring Recommended)**: Your performance ranks in the top 5% of candidates. You are highly ready for immediate technical MNC roles!";
 } else if (avgScore >= 6.0) {
 finalVerdict = "📈 **Strong Match (Job Ready)**: You display solid functional understanding. Fine-tune your vocabulary definitions to guarantee top-tier selections.";
 } else {
 finalVerdict = "📚 **Developing (Needs Practice)**: Review the mock key terms and expand your definitions with details of direct project experiences.";
 }

 updatedHistory.push({
 type: "bot",
 text: `### 🎓 Interview Performance Audit Completed!\n\n* **Overall Prep Score**: \`${avgScore}/10\`\n* **Recruiter Recommendation**: ${finalVerdict}\n\n*Tips: You can restart the mock interview anytime or paste a target Job Description in our **AI Resume Matcher** tab to optimize your dashboard profile alignment!*`
 });
 setInterviewHistory(updatedHistory);
 }
 };

 const handleAnalyzeJobDescription = () => {
 if (!jobDescription.trim()) return;
 setIsMatching(true);
 
 setTimeout(() => {
 const cleanJD = jobDescription.toLowerCase();
 const matchableKeywords = [
 "react","next.js","nextjs","typescript","node.js","nodejs","python","sql","aws", 
 "javascript","tailwind","supabase","express","java","mongodb","postgres","docker","api","git"
 ];
 
 const matched: string[] = [];
 const missing: string[] = [];
 
 matchableKeywords.forEach(kw => {
 if (cleanJD.includes(kw)) {
 const hasSkill = skills.some(s => s.toLowerCase().includes(kw)) || bio.toLowerCase().includes(kw);
 if (hasSkill) {
 matched.push(kw === "nextjs" ? "Next.js" : kw === "nodejs" ? "Node.js" : kw.toUpperCase());
 } else {
 missing.push(kw === "nextjs" ? "Next.js" : kw === "nodejs" ? "Node.js" : kw.toUpperCase());
 }
 }
 });
 
 let scoreVal = 40; 
 scoreVal += matched.length * 12;
 if (experience.trim().length > 5) scoreVal += 15;
 if (bio.trim().length > 30) scoreVal += 10;
 
 const finalMatchScore = Math.min(Math.max(Math.round(scoreVal), 15), 98);
 
 const tips: string[] = [];
 if (missing.length > 0) {
 tips.push(`Add <strong>${missing.slice(0, 3).join(",")}</strong> to your profile skills tagger to instantly boost matching rank.`);
 }
 if (bio.length < 100) {
 tips.push("Expand your 'Professional Bio' on the Profile tab to detail specific work deliverables matching this role.");
 }
 if (!resumeUrl) {
 tips.push("Upload your master PDF resume to enable recruiters to instantly parse your profile details.");
 }
 if (tips.length === 0) {
 tips.push("Your profile matches this Job Description perfectly! You are 100% ready to click Quick Apply.");
 }
 
 setMatchResult({
 score: finalMatchScore,
 matchedKeywords: matched,
 missingKeywords: missing.length > 0 ? missing : ["None! You are fully optimized"],
 recommendations: tips
 });
 setIsMatching(false);
 }, 1500);
 };

 useEffect(() => {
 // Scroll to bottom of chat
 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 }, [chatMessages]);

  // Synchronize active tab from search params
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "mock-interview" ||
      tabParam === "messages" ||
      tabParam === "ats-optimizer" ||
      tabParam === "profile" ||
      tabParam === "applications"
    ) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

 useEffect(() => {
 const initCandidateSession = async () => {
 // Manual fallback for OAuth Hash if Supabase implicit flow is hanging in Next.js
 if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
 try {
 const hash = window.location.hash.substring(1);
 const params = new URLSearchParams(hash);
 const access_token = params.get('access_token');
 const refresh_token = params.get('refresh_token');
 if (access_token) {
 try {
 await supabase.auth.setSession({
 access_token,
 refresh_token: refresh_token || ""
 });
 } catch (err) {
 console.warn("Supabase setSession failed but forcing login anyway");
 }
 window.history.replaceState(null, '', window.location.pathname + window.location.search);
 localStorage.setItem("rs_candidate_session_active", "true");
 }
 } catch (e) {
 console.warn("Manual hash parsing failed", e);
 }
 }

 try {
 const { data } = await supabase.auth.getSession();
 const sessionUser = data.session?.user;

 // Check localStorage fallbacks (Multi-email sandbox DB)
 let localProfileStr = null;
 const currentEmail = sessionUser?.email || localStorage.getItem("rs_candidate_active_email");
 try {
   const dbStr = localStorage.getItem("rs_candidate_profiles_db");
   if (dbStr && currentEmail) {
      const db = JSON.parse(dbStr);
      if (db[currentEmail]) {
        localProfileStr = JSON.stringify(db[currentEmail]);
      }
   }
   // Fallback for older profiles
   if (!localProfileStr) {
      localProfileStr = localStorage.getItem("rs_candidate_mock_profile");
   }
 } catch (e) {}

 let localProfile: CandidateProfile | null = null;
 if (localProfileStr) {
   try {
     localProfile = JSON.parse(localProfileStr);
     // If we loaded the legacy single-profile, verify the email matches
     if (currentEmail && localProfile && localProfile.email && localProfile.email !== currentEmail) {
       console.warn("Legacy sandbox profile belongs to different email. Ignoring.");
       localProfile = null;
     }
   } catch (e) {
     console.warn("Error parsing candidate localProfileStr", e);
   }
 }

 if (sessionUser) {
 setUserId(sessionUser.id);
 try {
 localStorage.setItem("rs_candidate_session_active", "true");
 } catch (e) {}
 
 try {
 const { data: dbProfile } = await supabase
 .from("private_candidate_profiles")
 .select("*")
 .eq("id", sessionUser.id)
 .single();

 if (dbProfile) {
 applyProfileData(dbProfile);
 } else if (localProfile) {
 // Inherit Sandbox Profile Data but use Google Verified Email
 applyProfileData({
 ...localProfile,
 email: sessionUser.email || localProfile.email,
 full_name: sessionUser.user_metadata?.full_name || localProfile.full_name
 });
 } else {
 // Initialize fresh template from Google Auth session
 setFullName(sessionUser.user_metadata?.full_name || "New Candidate");
 setEmail(sessionUser.email || "");
 setPhone(sessionUser.user_metadata?.phone || "");
 }
 } catch (dbErr) {
 if (localProfile) {
 applyProfileData({
 ...localProfile,
 email: sessionUser.email || localProfile.email,
 full_name: sessionUser.user_metadata?.full_name || localProfile.full_name
 });
 } else {
 setFullName(sessionUser.user_metadata?.full_name || "New Candidate");
 setEmail(sessionUser.email || "");
 setPhone(sessionUser.user_metadata?.phone || "");
 }
 }
 } else {
  const isLocalActive = localStorage.getItem("rs_candidate_session_active") === "true";
  if (localProfile) {
  try {
  localStorage.setItem("rs_candidate_session_active", "true");
  } catch (e) {}
  applyProfileData(localProfile);
  } else if (isLocalActive) {
  // User is logged in via sandbox but hasn't saved a profile yet!
  setFullName("New Candidate");
  setEmail(currentEmail || "");
  setPhone("");
  } else {
  // CRITICAL FIX: Don't instantly redirect if Supabase is currently parsing OAuth tokens from the URL hash!
  if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
  console.log("OAuth parsing in progress, deferring redirect...");
  return;
  }
  router.push("/private-jobs/login");
  }
 }
 } catch (err) {
 console.warn("Exception in initCandidateSession:", err);
 }
 };

 initCandidateSession();

 // Subscribe to Supabase auth changes to dynamically catch OAuth session establishment
 const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
 if (session?.user) {
 setUserId(session.user.id);
 try {
 localStorage.setItem("rs_candidate_session_active", "true");
 } catch (e) {}
 
 try {
 const { data: dbProfile } = await supabase
 .from("private_candidate_profiles")
 .select("*")
 .eq("id", session.user.id)
 .single();

 if (dbProfile) {
 applyProfileData(dbProfile);
 } else {
 setFullName(session.user.user_metadata?.full_name || "New Candidate");
 setEmail(session.user.email || "");
 setPhone(session.user.user_metadata?.phone || "");
 }
 } catch (dbErr) {
 setFullName(session.user.user_metadata?.full_name || "New Candidate");
 setEmail(session.user.email || "");
 setPhone(session.user.user_metadata?.phone || "");
 }
 } else {
 initCandidateSession();
 }
 });

 return () => {
 if (authListener && authListener.subscription) {
 authListener.subscription.unsubscribe();
 }
 };
 }, [router]);

 const applyProfileData = (profile: CandidateProfile) => {
 setFullName(profile.full_name || "");
 setEmail(profile.email || "");
 setPhone(profile.phone || "");
 setSkills(profile.skills || []);
 setExperience(profile.experience || "");
 setCollege(profile.college || "");
 setBio(profile.bio || "");
 setDesiredRole(profile.desired_role || "");
 setPreferredLocation(profile.preferred_location || "");
 setExpectedCtc(profile.expected_ctc || "");
 setResumeUrl(profile.resume_url || "");
 setPortfolioUrl(profile.portfolio_url || "");
 setVideoPitchUrl(profile.video_pitch_url || "");
 setAvatarUrl(profile.avatar_url || "");
 setHackerrankUrl(profile.hackerrank_url || "");
 setLeetcodeUrl(profile.leetcode_url || "");
 setCertifications(profile.certifications || "");
 };

 // Fetch / Generate Chat Threads
 useEffect(() => {
 const fetchProfileVisits = async () => {
 try {
 if (userId) {
 const { data } = await supabase
 .from("profile_visits")
 .select(`
 id,
 visited_at,
 employer:employer_profiles(company_name, hr_name)
`)
 .eq("candidate_id", userId)
 .order("visited_at", { ascending: false })
 .limit(5);
 if (data) setProfileVisits(data);
 }
 } catch(e) {}
 
 // Mock fallback
 const localVisitsStr = localStorage.getItem("rs_mock_profile_visits");
 if (localVisitsStr) {
 const visits = JSON.parse(localVisitsStr);
 setProfileVisits(visits.reverse().slice(0, 5));
 }
 };

 const loadChats = async () => {
 if (userId) {
 try {
 const { data: messages } = await supabase
 .from("private_messages")
 .select("*")
 .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
 .order("created_at", { ascending: true });

 if (messages && messages.length > 0) {
 const recruiterIds = new Set<string>();
 messages.forEach((m: any) => {
 if (m.sender_id !== userId) recruiterIds.add(m.sender_id);
 if (m.receiver_id !== userId) recruiterIds.add(m.receiver_id);
 });

 const fetchedThreads: any[] = [];
 for (const rId of Array.from(recruiterIds)) {
 const { data: recProfile } = await supabase
 .from("employer_profiles")
 .select("company_name, hr_name")
 .eq("id", rId)
 .single();

 const rMessages = messages.filter((m: any) => m.sender_id === rId || m.receiver_id === rId);
 const lastMsg = rMessages[rMessages.length - 1]?.message || "";

 fetchedThreads.push({
 id: rId,
 name: recProfile?.hr_name || "HR Recruiter",
 company: recProfile?.company_name || "MNC Partner",
 lastMessage: lastMsg.length > 30 ? lastMsg.slice(0, 30) + "..." : lastMsg
 });
 }

 setThreads(fetchedThreads);
 if (fetchedThreads.length > 0 && !selectedThreadId) {
 setSelectedThreadId(fetchedThreads[0].id);
 }
 return;
 }
 } catch (e) {
 console.warn("Could not query DB messages. Falling back to simulated conversations.", e);
 }
 }

 const localMocks = localStorage.getItem("rs_candidate_mock_messages");
 if (localMocks) {
 const parsed = JSON.parse(localMocks) as ChatMessage[];
 updateThreadsFromMock(parsed);
 }
 };

 loadChats();
 fetchProfileVisits();
 }, [userId, activeTab]);

 const updateThreadsFromMock = (msgs: ChatMessage[]) => {
 const threadMap = new Map<string, { id: string; name: string; company: string; lastMessage: string }>();
 msgs.forEach(m => {
 const recId = m.sender_type === "employer" ? m.sender_id : m.receiver_id;
 const recName = m.sender_name || "HR Recruiter";
 const compName = m.company_name || "Corporate Partner";
 
 threadMap.set(recId, {
 id: recId,
 name: recName,
 company: compName,
 lastMessage: m.message.length > 30 ? m.message.slice(0, 30) + "..." : m.message
 });
 });

 const parsedThreads = Array.from(threadMap.values());
 setThreads(parsedThreads);
 if (parsedThreads.length > 0 && !selectedThreadId) {
 setSelectedThreadId(parsedThreads[0].id);
 }
 };

 // Load chat messages for the selected thread
 useEffect(() => {
 if (!selectedThreadId) return;

 const loadThreadMessages = async () => {
 if (userId) {
 try {
 const { data } = await supabase
 .from("private_messages")
 .select("*")
 .or(`and(sender_id.eq.${userId},receiver_id.eq.${selectedThreadId}),and(sender_id.eq.${selectedThreadId},receiver_id.eq.${userId})`)
 .order("created_at", { ascending: true });

 if (data) {
 setChatMessages(data as ChatMessage[]);
 return;
 }
 } catch (e) {
 // DB error fallback
 }
 }

 const mockStr = localStorage.getItem("rs_candidate_mock_messages");
 if (mockStr) {
 const msgs = JSON.parse(mockStr) as ChatMessage[];
 const filtered = msgs.filter(
 m => (m.sender_id === userId && m.receiver_id === selectedThreadId) ||
 (m.sender_id === selectedThreadId && m.receiver_id === userId) ||
 (m.sender_id === "demo-candidate-uid" && m.receiver_id === selectedThreadId) ||
 (m.sender_id === selectedThreadId && m.receiver_id === "demo-candidate-uid")
 );
 setChatMessages(filtered);
 }
 };

 loadThreadMessages();
 }, [selectedThreadId, userId]);

 // Profile tag updates
 const handleAddSkill = (e: React.FormEvent) => {
 e.preventDefault();
 if (skillInput.trim() && !skills.includes(skillInput.trim().toUpperCase())) {
 setSkills([...skills, skillInput.trim().toUpperCase()]);
 setSkillInput("");
 }
 };

 const handleRemoveSkill = (skillToRemove: string) => {
 setSkills(skills.filter(s => s !== skillToRemove));
 };

 // Submit Profile Changes
 const handleUpdateProfile = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);

 const updatedProfile: CandidateProfile = {
 id: userId || "demo-candidate-uid",
 full_name: fullName.trim(),
 email: email.trim(),
 phone: phone.trim(),
 skills: skills,
 experience: experience.trim(),
 college: college.trim(),
 bio: bio.trim(),
 desired_role: desiredRole.trim(),
 preferred_location: preferredLocation.trim(),
 expected_ctc: expectedCtc.trim(),
 resume_url: resumeUrl.trim(),
 portfolio_url: portfolioUrl.trim(),
 video_pitch_url: videoPitchUrl.trim(),
 avatar_url: avatarUrl.trim(),
 hackerrank_url: hackerrankUrl.trim(),
 leetcode_url: leetcodeUrl.trim(),
 certifications: certifications.trim()
 };

 try {
    if (userId && userId !== "demo-candidate-uid") {
      // Remove avatar_url from DB payload to prevent schema errors if the column hasn't been added yet
      const { avatar_url, ...dbSafeProfile } = updatedProfile;

      const { error } = await supabase
        .from("private_candidate_profiles")
        .upsert([{
          ...dbSafeProfile,
          user_id: userId // Required for RLS policy to pass!
        }]);

      if (error) {
         console.error("Supabase upsert error:", error);
         throw error;
      }
    }

    // Save to Multi-Profile Sandbox DB
    const currentEmail = email.trim();
    if (currentEmail) {
      try {
        const dbStr = localStorage.getItem("rs_candidate_profiles_db");
        const db = dbStr ? JSON.parse(dbStr) : {};
        db[currentEmail] = updatedProfile;
        localStorage.setItem("rs_candidate_profiles_db", JSON.stringify(db));
        localStorage.setItem("rs_candidate_active_email", currentEmail);
      } catch(e) {}
    }

    localStorage.setItem("rs_candidate_mock_profile", JSON.stringify(updatedProfile));
    toast.success("Profile saved securely to the Cloud!", { icon: "☁️" });
 } catch (err: any) {
   console.warn("Could not write to Supabase candidate profiles table, fallback to simulation storage.", err);
   
   // Save to Multi-Profile Sandbox DB (Fallback block)
   const currentEmail = email.trim();
   if (currentEmail) {
     try {
       const dbStr = localStorage.getItem("rs_candidate_profiles_db");
       const db = dbStr ? JSON.parse(dbStr) : {};
       db[currentEmail] = updatedProfile;
       localStorage.setItem("rs_candidate_profiles_db", JSON.stringify(db));
       localStorage.setItem("rs_candidate_active_email", currentEmail);
     } catch(e) {}
   }
   localStorage.setItem("rs_candidate_mock_profile", JSON.stringify(updatedProfile));
   
   toast.success("Profile saved locally (Sandbox Mode)", { icon: "💾" });
 } finally {
 setLoading(false);
 }
 };

 // Sending candidate message
 const handleSendMessage = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newMessage.trim() || !selectedThreadId) return;

 const messageText = newMessage.trim();
 setNewMessage("");

 const newMsgObj: ChatMessage = {
 id:"msg-"+ Date.now(),
 sender_id: userId ||"demo-candidate-uid",
 receiver_id: selectedThreadId,
 message: messageText,
 sender_type:"candidate",
 created_at: new Date().toISOString()
 };

 // 1. Attempt to write to Supabase
 if (userId) {
 try {
 const { error } = await supabase.from("private_messages").insert([{
 sender_id: userId,
 receiver_id: selectedThreadId,
 message: messageText,
 sender_type:"candidate"
 }]);
 if (!error) {
 setChatMessages(prev => [...prev, newMsgObj]);
 return;
 }
 } catch (err) {
 // Fallback
 }
 }

 // 2. Simulation sandbox mode
 const mockStr = localStorage.getItem("rs_candidate_mock_messages");
 const msgs = mockStr ? (JSON.parse(mockStr) as ChatMessage[]) : [];
 
 // Add candidate message
 const updatedMessages = [...msgs, newMsgObj];
 localStorage.setItem("rs_candidate_mock_messages", JSON.stringify(updatedMessages));
 setChatMessages(prev => [...prev, newMsgObj]);

 // Trigger simulated recruiter smart reply in 3 seconds!
 const activeThread = threads.find(t => t.id === selectedThreadId);
 const recName = activeThread?.name ||"HR Recruiter";
 const compName = activeThread?.company ||"Company Partner";

 setTimeout(() => {
 let replyText =`Thanks for your reply, ${fullName.split("")[0]}! We have forwarded your experience details (${experience ||"Fresher"}) to the hiring manager. Could you please share a good time for a quick 15-minute introductory video interview this week?`;
 
 if (messageText.toLowerCase().includes("resume") || messageText.toLowerCase().includes("cv")) {
 replyText =`Excellent! We received your profile details. Our hiring panel at ${compName} is highly impressed with your skills in: ${skills.slice(0, 3).join(",") ||"software engineering"}. Let's schedule a Zoom call for tomorrow. Are you available around 11:00 AM?`;
 } else if (messageText.toLowerCase().includes("hello") || messageText.toLowerCase().includes("hi")) {
 replyText =`Hello! Glad to connect with you. We are actively hiring for candidates with degrees from ${college ||"reputed universities"}. Can you describe a couple of projects you built recently?`;
 }

 const simReply: ChatMessage = {
 id:"msg-sim-reply-"+ Date.now(),
 sender_id: selectedThreadId,
 receiver_id: userId ||"demo-candidate-uid",
 message: replyText,
 sender_type:"employer",
 created_at: new Date().toISOString(),
 sender_name: recName,
 company_name: compName
 };

 const finalMessages = [...updatedMessages, simReply];
 localStorage.setItem("rs_candidate_mock_messages", JSON.stringify(finalMessages));
 
 // Update UI if user is still on this thread
 setChatMessages(prev => [...prev, simReply]);
 
 // Update threads list
 updateThreadsFromMock(finalMessages);
 }, 2500);
 };

 const handleLogout = async () => {
 await supabase.auth.signOut();
 localStorage.removeItem("rs_candidate_mock_profile");
 localStorage.removeItem("rs_candidate_mock_session");
 localStorage.removeItem("rs_candidate_session_active");
 router.push("/private-jobs/login");
 };

 return (
 <div className="flex-1 premium-gradient-bg py-10 px-4 sm:px-6 min-h-screen transition-colors duration-300 relative overflow-hidden">
 
 <div className="max-w-6xl mx-auto space-y-8 relative z-10">
 
 {/* Header Dashboard Banner */}
 <div 
 style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}
 className="relative overflow-hidden text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 shadow-2xl"
 >
 <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
 
 <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
 <div className="p-4 bg-white/10 backdrop-blur-xl text-yellow-400 rounded-2xl border border-white/10 shrink-0 shadow-lg shadow-black/5 hover:scale-105 transition-transform duration-300">
 <GraduationCap className="w-9 h-9"/>
 </div>
 <div className="space-y-1">
 <h2 className="text-2xl sm:text-3xl font-black flex items-center justify-center sm:justify-start flex-wrap gap-2.5 tracking-tight">
 {fullName ||"Candidate Portal"} 
 <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500 text-white font-black px-3 py-1 rounded-full shadow-lg shadow-emerald-500/20 tracking-wider uppercase border border-emerald-400/20">
 <Check className="w-3 h-3"/> Verified Candidate
 </span>
 </h2>
 <p className="text-xs text-blue-200 font-bold flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
 Candidate ID: 
 <span className="bg-white/10 px-2 py-0.5 rounded font-mono text-white/90 font-black tracking-wide text-[10px] select-all">
 {userId ||"Simulation Sandbox"}
 </span>
 </p>
 </div>
 </div>

 <div className="flex items-center gap-3.5 shrink-0 flex-wrap justify-center">
 <button 
 onClick={() => setActiveTab(activeTab ==="profile"?"messages":"profile")}
 className={`inline-flex items-center gap-2 font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
 activeTab ==="messages"
 ?"bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
 :"bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md"
 }`}
 >
 <MessageSquare className="w-4 h-4"/> 
 {activeTab ==="messages"?"My Resume Profile":"Recruiter Chat Inbox"}
 {threads.length > 0 && activeTab !=="messages"&& (
 <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse shadow-sm"></span>
 )}
 </button>
 <button 
 onClick={handleLogout}
 className="inline-flex items-center gap-2 border border-white/10 text-gray-300 bg-white/5 hover:bg-white/10 font-black px-5 py-3 rounded-2xl transition-all duration-200 text-xs uppercase tracking-wider hover:text-white"
 >
 <LogOut className="w-4 h-4"/> Log Out
 </button>
 </div>
 </div>

 {/* APPLICATIONS TAB */}
 {activeTab ==="applications"&& (
 <div className="space-y-8 animate-fadeIn">
 {/* Smart Recommendations Engine */}
 <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h3 className="font-black text-slate-900 text-xl flex items-center gap-2 tracking-tight">
 <Sparkles className="w-5 h-5 text-amber-500 animate-pulse"/> AI Job Recommendations
 </h3>
 <p className="text-xs font-bold text-slate-500 mt-1">Sourced automatically based on: {skills.slice(0,3).join(",") ||"General Skills"}</p>
 </div>
 <span className="text-[10px] bg-blue-50 text-blue-600 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100 self-start">Live Matching</span>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 {[1, 2].map((i) => (
 <div key={i} className="p-5 bg-white/80 rounded-2xl border border-slate-200/60 hover:border-blue-400 transition-all hover:-translate-y-0.5 flex flex-col justify-between gap-5 premium-glow-card">
 <div>
 <h4 className="font-extrabold text-slate-800 text-base">{desiredRole ||"Software Developer"} (MNC / Remote)</h4>
 <p className="text-xs font-black text-blue-600 mt-1">TechCorp Partners • <span className="text-slate-500 font-bold">Immediate Hiring</span></p>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-xs font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg">85% Match</span>
 <button className="text-xs font-black bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition-colors shadow-md">1-Click Apply</button>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Kanban Application Tracker */}
 <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
 <div>
 <h3 className="font-black text-slate-900 text-xl flex items-center gap-2 tracking-tight">
 <TrendingUp className="w-5 h-5 text-emerald-500"/> Pipeline Tracker (Kanban)
 </h3>
 <p className="text-xs font-bold text-slate-500 mt-1">Monitor active hiring & application pipelines.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {/* Column 1 */}
 <div className="bg-slate-100/60 rounded-2xl p-4.5 border border-slate-200/60 space-y-4">
 <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center justify-between">
 <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Applied</span>
 <span className="bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded text-[10px]">1</span>
 </h4>
 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/50 premium-glow-card">
 <p className="text-sm font-black text-slate-800 line-clamp-1">{desiredRole ||"Technical Associate"}</p>
 <p className="text-[10px] font-extrabold text-slate-500 mt-0.5">StartupX Partner Group</p>
 <p className="text-[10px] text-slate-400 mt-3 border-t border-slate-100 pt-2 flex justify-between items-center font-bold">
 <span>Applied</span>
 <span>2 days ago</span>
 </p>
 </div>
 </div>
 
 {/* Column 2 */}
 <div className="bg-slate-100/60 rounded-2xl p-4.5 border border-slate-200/60 space-y-4">
 <h4 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center justify-between">
 <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span> In Review</span>
 <span className="bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded text-[10px]">1</span>
 </h4>
 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/50 premium-glow-card">
 <p className="text-sm font-black text-slate-800 line-clamp-1">Frontend Developer</p>
 <p className="text-[10px] font-extrabold text-slate-500 mt-0.5">Global Tech Corp</p>
 <p className="text-[10px] text-emerald-500 mt-3 border-t border-slate-100 pt-2 flex justify-between items-center font-black">
 <span>Resume Shortlisted!</span>
 </p>
 </div>
 </div>

 {/* Column 3 */}
 <div className="bg-slate-100/60 rounded-2xl p-4.5 border border-slate-200/60 space-y-4">
 <h4 className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center justify-between">
 <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Interviewing</span>
 <span className="bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded text-[10px]">0</span>
 </h4>
 <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold bg-white/20">
 No active interviews
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* MOCK INTERVIEW TAB */}
 {activeTab ==="mock-interview"&& (
 <div className="space-y-8 animate-fadeIn">
 {/* Header description */}
 <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <span className="p-2 bg-blue-500/15 rounded-xl text-blue-600">
 <Sparkles className="w-5 h-5 animate-pulse"/>
 </span>
 <h3 className="font-black text-slate-900 text-xl tracking-tight">AI Mock Interview Prep Assistant</h3>
 </div>
 <p className="text-xs font-bold text-slate-500">
 Simulate standard technical and HR behavioral interviews with an automated recruiter. Hit key terms to score higher!
 </p>
 </div>
 <span className="text-[10px] bg-emerald-50 text-emerald-600 font-extrabold px-3.5 py-1.5 rounded-xl uppercase tracking-widest border border-emerald-100 self-start md:self-auto shadow-sm">
 100% Free & Unlimited
 </span>
 </div>

 {!interviewStarted ? (
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/40 space-y-6">
 <div className="text-center max-w-xl mx-auto space-y-3">
 <h4 className="font-extrabold text-slate-800 text-lg">Choose Your Mock Interview Track</h4>
 <p className="text-xs font-medium text-slate-500">
 Our AI Recruiter will tailor interview questions specifically to the roles below. Pick your track to begin.
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
 {[
 { name:"Frontend Developer", desc:"React, Next.js, UI architecture, and styling systems.", icon: User },
 { name:"Backend Developer", desc:"SQL databases, indexing, connection pooling, and REST security.", icon: Briefcase },
 { name:"Product Manager", desc:"Prioritization frameworks, user onboarding, and success metrics.", icon: Sparkles },
 { name:"Sales & Marketing", desc:"Handling objections, outbound growth, and referral campaigns.", icon: TrendingUp },
 { name:"General / Other Roles", desc:"Workplace scenarios, time management, and behavioral queries.", icon: GraduationCap }
 ].map((roleItem) => (
 <button
 key={roleItem.name}
 onClick={() => handleStartInterview(roleItem.name)}
 className="p-5 text-left bg-white/80 rounded-2xl border border-slate-200/60 hover:border-blue-400 transition-all hover:-translate-y-0.5 flex flex-col justify-between gap-5 premium-glow-card group w-full"
 >
 <div className="space-y-2.5">
 <span className="p-2.5 bg-slate-100 text-slate-600 rounded-xl inline-flex group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
 <roleItem.icon className="w-5 h-5"/>
 </span>
 <h5 className="font-extrabold text-slate-800 text-base group-hover:text-blue-600 transition-colors">{roleItem.name}</h5>
 <p className="text-xs font-medium text-slate-400 leading-relaxed">{roleItem.desc}</p>
 </div>
 <div className="flex items-center gap-1.5 text-xs font-black text-blue-600 mt-2">
 Start Simulation <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"/>
 </div>
 </button>
 ))}
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Chat window panel */}
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/40 flex flex-col h-[550px]">
 {/* Header */}
 <div className="p-5 border-b border-slate-200/50 bg-slate-50/50 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold relative">
 AI
 <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></span>
 </div>
 <div>
 <h4 className="font-extrabold text-slate-800 text-sm">Rojgar AI Recruiter</h4>
 <p className="text-[10px] font-bold text-slate-400">Mock Session: {mockSelectedRole}</p>
 </div>
 </div>
 <button
 onClick={() => setInterviewStarted(false)}
 className="text-xs font-black text-rose-500 hover:text-rose-600 bg-rose-50 px-3.5 py-1.5 rounded-xl border border-rose-100 transition-colors"
 >
 Quit Session
 </button>
 </div>

 {/* Conversation thread */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
 {interviewHistory.map((msg, index) => (
 <div
 key={index}
 className={`flex gap-3 max-w-[85%] ${
 msg.type ==="user"?"ml-auto flex-row-reverse":"mr-auto"
 }`}
 >
 <div
 className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] uppercase ${
 msg.type ==="user"
 ?"bg-indigo-600 text-white"
 :"bg-blue-100 text-blue-600"
 }`}
 >
 {msg.type ==="user"?"ME":"AI"}
 </div>
 
 <div
 className={`p-4.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line border ${
 msg.type ==="user"
 ?"bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10 rounded-tr-none"
 :"bg-white text-slate-800 border-slate-200/50 rounded-tl-none shadow-sm"
 }`}
 >
 {msg.text}
 </div>
 </div>
 ))}
 </div>

 {/* Chat response action footer */}
 {!interviewEnded ? (
 <div className="p-4 border-t border-slate-200/50 bg-slate-50/50 space-y-3.5">
 <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
 <span>Submit response when you are ready</span>
 <span>{candidateResponse.length} chars (aim for 100+)</span>
 </div>
 <div className="flex gap-3">
 <textarea
 value={candidateResponse}
 onChange={(e) => setCandidateResponse(e.target.value)}
 placeholder="Type your detailed professional answer here... (Tip: Include core technical keywords to score high!)"
 rows={2}
 className="flex-1 p-3.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none"
 />
 <button
 onClick={handleNextInterviewQuestion}
 disabled={!candidateResponse.trim()}
 className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-black px-6 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-lg shadow-blue-500/20"
 >
 <Send className="w-4 h-4"/>
 </button>
 </div>
 </div>
 ) : (
 <div className="p-5 border-t border-slate-200/50 bg-slate-50/50 text-center">
 <button
 onClick={() => handleStartInterview(mockSelectedRole)}
 className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/10"
 >
 Restart Interview
 </button>
 </div>
 )}
 </div>
 </div>

 {/* Audit remarks panel */}
 <div className="lg:col-span-1 space-y-6">
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-6 shadow-xl shadow-slate-100/40 space-y-5 premium-glow-card">
 <h4 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-2">
 <Shield className="w-4 h-4 text-blue-500 animate-pulse"/> Auditor Cheat-sheet
 </h4>
 <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
 Below are the primary keywords/concepts the automated grader is searching for in your answers. Include these to guarantee top ratings!
 </p>

 <div className="border-t border-slate-100 pt-4 space-y-4">
 {(() => {
 const selectedList = mockInterviewQuestions[mockSelectedRole] || mockInterviewQuestions["General / Other Roles"];
 const currentQ = selectedList[currentQuestionIndex];
 if (!currentQ || interviewEnded) return <p className="text-xs font-bold text-slate-400">Mock Complete! All questions audited.</p>;
 
 return (
 <div className="space-y-3.5">
 <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2.5 py-1 rounded uppercase tracking-wider">
 Target Keywords for Q{currentQuestionIndex + 1}
 </span>
 <div className="flex flex-wrap gap-1.5">
 {currentQ.keywords.map(kw => (
 <span key={kw} className="text-[10px] font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100/20">
 {kw.toUpperCase()}
 </span>
 ))}
 </div>
 <div className="bg-slate-50 border border-slate-200/40 p-3.5 rounded-xl text-[10px] font-medium text-slate-400 leading-relaxed space-y-1">
 <span className="font-extrabold text-slate-500 flex items-center gap-1"><BookOpen className="w-3 h-3"/> Ideal Answer Concept:</span>
 <p className="italic">"{currentQ.sampleAnswer}"</p>
 </div>
 </div>
 );
 })()}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {/* ATS RESUME MATCHER TAB */}
 {activeTab ==="ats-optimizer"&& (
 <div className="space-y-8 animate-fadeIn">
 {/* Header description */}
 <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="space-y-2">
 <div className="flex items-center gap-2">
 <span className="p-2 bg-emerald-500/15 rounded-xl text-emerald-600">
 <TrendingUp className="w-5 h-5 animate-pulse"/>
 </span>
 <h3 className="font-black text-slate-900 text-xl tracking-tight">AI ATS Resume Matcher</h3>
 </div>
 <p className="text-xs font-bold text-slate-500">
 Paste any job description to instantly compare it against your profile. Identify missing skills and increase interview odds!
 </p>
 </div>
 <span className="text-[10px] bg-emerald-50 text-emerald-600 font-extrabold px-3.5 py-1.5 rounded-xl uppercase tracking-widest border border-emerald-100 self-start md:self-auto shadow-sm">
 Real-Time Diagnostics
 </span>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
 {/* Job description input panel */}
 <div className="lg:col-span-6 space-y-6">
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/40 space-y-6">
 <div>
 <h4 className="font-extrabold text-slate-800 text-base">Paste Target Job Description</h4>
 <p className="text-[10px] font-bold text-slate-400 mt-0.5">Paste standard requirements or qualifications from any active posting.</p>
 </div>

 <textarea
 value={jobDescription}
 onChange={(e) => setJobDescription(e.target.value)}
 placeholder="Example: We are looking for a Senior Frontend Developer who has 3+ years experience with React, Next.js, and TypeScript. Experience with SQL and state managers is highly preferred..."
 rows={12}
 className="w-full p-4 text-xs sm:text-sm bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium resize-none shadow-inner"
 />

 <button
 onClick={handleAnalyzeJobDescription}
 disabled={isMatching || !jobDescription.trim()}
 className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
 >
 {isMatching ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin"/> Parsing & Auditing Profile Alignment...
 </>
 ) : (
 <>
 <Sparkles className="w-4 h-4"/> Run Compatibility Scan
 </>
 )}
 </button>
 </div>
 </div>

 {/* Match Result Display */}
 <div className="lg:col-span-6 space-y-6">
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/40 h-full min-h-[400px] flex flex-col">
 {!matchResult ? (
 <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
 <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center animate-pulse">
 <TrendingUp className="w-7 h-7"/>
 </div>
 <div>
 <h5 className="font-extrabold text-slate-700 text-base">Match Report Console</h5>
 <p className="text-[11px] font-medium text-slate-400 max-w-xs mt-1 mx-auto">
 Paste a job specification in the left pane and hit"Run Compatibility Scan"to compile diagnostic charts.
 </p>
 </div>
 </div>
 ) : (
 <div className="space-y-6 animate-fadeIn">
 <div className="flex items-center justify-between border-b border-slate-100 pb-4">
 <h5 className="font-extrabold text-slate-800 text-base">ATS Audit Diagnostic</h5>
 <span className="text-[10px] bg-blue-50 text-blue-600 font-extrabold px-2.5 py-1 rounded uppercase tracking-wider">
 Graded
 </span>
 </div>

 {/* Radial Progress Score dial */}
 <div className="flex flex-col sm:flex-row items-center gap-6 justify-center bg-slate-50 border border-slate-200/30 p-5 rounded-2xl">
 <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
 <svg className="w-full h-full transform -rotate-90"viewBox="0 0 100 100">
 <circle
 cx="50"
 cy="50"
 r="40"
 className="stroke-slate-200"
 strokeWidth="8"
 fill="transparent"
 />
 <circle
 cx="50"
 cy="50"
 r="40"
 className={
 matchResult.score >= 80 
 ?"stroke-emerald-500"
 : matchResult.score >= 50 
 ?"stroke-amber-500"
 :"stroke-rose-500"
 }
 strokeWidth="8"
 fill="transparent"
 strokeDasharray={2 * Math.PI * 40}
 strokeDashoffset={2 * Math.PI * 40 - (matchResult.score / 100) * (2 * Math.PI * 40)}
 strokeLinecap="round"
 />
 </svg>
 <div className="absolute flex flex-col items-center justify-center">
 <span className="text-2xl font-black tracking-tighter text-slate-900">{matchResult.score}%</span>
 <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Match</span>
 </div>
 </div>

 <div className="text-center sm:text-left space-y-2">
 <h6 className="font-extrabold text-sm text-slate-800">
 {matchResult.score >= 80 
 ?"Excellent Compatibility! 🎉"
 : matchResult.score >= 50 
 ?"Average ATS Alignment 📈"
 :"Critical Matching Gaps ⚠️"}
 </h6>
 <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
 {matchResult.score >= 80 
 ?"Your profile skills align with the core requirements. You are ready to apply for this position immediately."
 :"Your profile matches some core elements, but lacks key terms necessary to beat competitive automated screeners."}
 </p>
 </div>
 </div>

 {/* Keywords match */}
 <div className="space-y-4">
 <div className="space-y-2">
 <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
 <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Matched Skills ({matchResult.matchedKeywords.length})
 </span>
 <div className="flex flex-wrap gap-1.5">
 {matchResult.matchedKeywords.length > 0 ? (
 matchResult.matchedKeywords.map(kw => (
 <span key={kw} className="text-[10px] font-extrabold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100/10">
 {kw}
 </span>
 ))
 ) : (
 <span className="text-[10px] text-slate-400 font-bold italic">No direct matches. Paste skills inside profile details.</span>
 )}
 </div>
 </div>

 <div className="space-y-2">
 <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
 <span className="w-2 h-2 rounded-full bg-rose-500"></span> Missing Job Keywords ({matchResult.missingKeywords.length})
 </span>
 <div className="flex flex-wrap gap-1.5">
 {matchResult.missingKeywords.map(kw => (
 <span key={kw} className="text-[10px] font-extrabold bg-rose-50 text-rose-600 px-2 py-0.5 rounded border border-rose-100/10">
 {kw}
 </span>
 ))}
 </div>
 </div>
 </div>

 {/* Action items */}
 <div className="border-t border-slate-100 pt-4 space-y-3">
 <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">AI Optimizer Actions:</span>
 <ul className="space-y-2.5">
 {matchResult.recommendations.map((rec, index) => (
 <li key={index} className="flex gap-2 text-[11px] font-semibold text-slate-500 leading-relaxed items-start">
 <span className="w-4 h-4 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 font-extrabold text-[10px] mt-0.5">!</span>
 <span dangerouslySetInnerHTML={{ __html: rec }} />
 </li>
 ))}
 </ul>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* PROFILE TAB */}
 {activeTab ==="profile"&& (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
 
 {/* Sidebar Column: Completeness circle gauge & ATS console */}
 <div className="space-y-8 lg:col-span-1">
 
 {/* Circular SVG Profile Completeness Gauge */}
 {(() => {
 const { score: cmpScore } = getProfileCompletion();
 const radius = 42;
 const circumference = 2 * Math.PI * radius;
 const strokeDashoffset = circumference - (cmpScore / 100) * circumference;
 
 let progressStroke ="url(#progressGrad)";
 let textBadgeColorClass ="text-rose-600 bg-rose-50 border border-rose-100";
 let badgeText ="Needs Work";
 
 if (cmpScore >= 80) {
 textBadgeColorClass ="text-emerald-600 bg-emerald-50 border border-emerald-100";
 badgeText ="All Star";
 } else if (cmpScore >= 50) {
 textBadgeColorClass ="text-amber-600 bg-amber-50 border border-amber-100";
 badgeText ="Progressing";
 }

 return (
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-6 shadow-xl shadow-slate-100/40 space-y-6 premium-glow-card">
 <div className="flex items-center justify-between">
 <span className="text-xs font-black text-slate-600 uppercase tracking-widest block font-sans">Profile Strength</span>
 <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${textBadgeColorClass}`}>
 {badgeText}
 </span>
 </div>

 <div className="flex flex-col items-center justify-center py-4 relative">
 <div className="relative w-36 h-36">
 {/* Background circle track */}
 <svg className="w-full h-full transform -rotate-90"viewBox="0 0 100 100">
 <defs>
 <linearGradient id="progressGrad"x1="0%"y1="0%"x2="100%"y2="100%">
 <stop offset="0%"stopColor="#ec4899"/>
 <stop offset="55%"stopColor="#f59e0b"/>
 <stop offset="100%"stopColor="#10b981"/>
 </linearGradient>
 </defs>
 <circle
 cx="50"
 cy="50"
 r={radius}
 className="stroke-slate-100"
 strokeWidth="7"
 fill="transparent"
 />
 {/* Progress circle */}
 <circle
 cx="50"
 cy="50"
 r={radius}
 className="transition-all duration-1000 ease-out"
 strokeWidth="8"
 fill="transparent"
 stroke={progressStroke}
 strokeDasharray={circumference}
 strokeDashoffset={strokeDashoffset}
 strokeLinecap="round"
 />
 </svg>
 {/* Center text details */}
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-3xl font-black tracking-tighter text-slate-900">{cmpScore}%</span>
 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Complete</span>
 </div>
 </div>
 </div>

 <div className="pt-4 border-t border-slate-100">
 <div className="flex items-start gap-2.5 text-xs text-slate-600 font-bold leading-normal">
 <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5"/>
 <span>A completed profile attracts up to <b className="text-blue-600">4x more direct HR visits</b>.</span>
 </div>
 </div>
 </div>
 );
 })()}

 {/* Profile Visit Notifications Widget */}
 {(() => {
 const { score: cmpScore } = getProfileCompletion();
 const showGamifiedLock = profileVisits.length === 0 && cmpScore < 95; // using 95 since max score cap is 95
 
 return (
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-6 shadow-xl shadow-slate-100/40 space-y-5 premium-glow-card">
 <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 tracking-wider">
 <div className="relative">
 <Building className="w-4.5 h-4.5 text-blue-500"/>
 {(profileVisits.length > 0 || showGamifiedLock) && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>}
 </div>
 Recent HR Profile Visits
 </h3>
 
 {profileVisits.length > 0 ? (
 <div className="space-y-3.5">
 {profileVisits.map((visit) => {
 const companyName = visit.employer?.company_name || visit.employer_name ||"MNC Recruiter";
 return (
 <div key={visit.id} className="p-3 bg-white/60 rounded-xl border border-slate-200/40 flex items-start gap-3 transition-colors hover:bg-slate-50">
 <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-sm uppercase">
 {companyName.slice(0, 2)}
 </div>
 <div className="space-y-0.5">
 <p className="text-xs font-bold text-slate-700 leading-normal">
 <span className="font-extrabold text-blue-600">{companyName}</span> viewed your resume profile.
 </p>
 <span className="text-[9px] text-slate-400 font-bold block">
 {new Date(visit.visited_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 ) : showGamifiedLock ? (
 <div className="space-y-3 relative rounded-2xl overflow-hidden border border-slate-200/60 bg-slate-50/50 p-1">
 {/* Mock Blurred Items */}
 <div className="space-y-2 filter blur-[4px] opacity-40 select-none pointer-events-none p-2">
 {[
 { name:"T*** Consultancy S...", time:"2 hours ago", color:"bg-slate-300"},
 { name:"W*pro Tech...", time:"5 hours ago", color:"bg-slate-300"},
 ].map((mock, i) => (
 <div key={i} className="p-3 bg-white rounded-xl flex items-start gap-3">
 <div className={`w-8 h-8 rounded-xl ${mock.color} flex items-center justify-center shrink-0`}></div>
 <div className="space-y-1 w-full">
 <div className="h-3 bg-slate-300 rounded w-3/4"></div>
 <div className="h-2 bg-slate-200 rounded w-1/4"></div>
 </div>
 </div>
 ))}
 </div>
 
 {/* Lock Overlay */}
 <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm p-6 text-center">
 <div className="bg-gradient-to-tr from-rose-500 to-pink-500 p-3 rounded-full shadow-lg shadow-rose-500/30 mb-4 animate-bounce" style={{ animationDuration: '3s'}}>
 <Shield className="w-7 h-7 text-white"/>
 </div>
 <h4 className="font-black text-slate-800 text-base mb-2">Someone Viewed Your Profile!</h4>
 <p className="text-xs font-bold text-slate-600 max-w-[220px] leading-relaxed">
 Complete your profile to <span className="text-rose-600 font-black">100%</span> to see who is interested in your resume.
 </p>
 <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-md hover:bg-slate-800 transition-colors">
 Complete Profile Now
 </button>
 </div>
 </div>
 ) : (
 <div className="text-center py-8 bg-slate-50/40 rounded-2xl border border-dashed border-slate-200">
 <p className="text-xs font-bold text-slate-500 leading-relaxed px-4">Your profile is active and tracking. We will notify you when an HR visits!</p>
 </div>
 )}
 </div>
 );
 })()}

 {/* Actionable Roadmap Checklist Card */}
 {(() => {
 const { items } = getProfileCompletion();
 const pendingItems = items.filter(it => !it.complete);
 
 return (
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-6 shadow-xl shadow-slate-100/40 space-y-5 premium-glow-card">
 <span className="text-xs font-black text-slate-600 uppercase tracking-widest block font-sans">Completeness Roadmap</span>
 
 {pendingItems.length === 0 ? (
 <div className="p-4.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs space-y-1.5 shadow-inner">
 <div className="font-black flex items-center gap-1.5 text-emerald-600 uppercase tracking-wide">
 <CheckCircle className="w-5 h-5 text-emerald-500"/> Perfect Score!
 </div>
 <p className="leading-relaxed font-bold">Your professional portfolio profile is fully complete and ready to bypass applicant trackers.</p>
 </div>
 ) : (
 <div className="space-y-4">
 <p className="text-xs text-slate-500 leading-normal font-bold">
 Fill the pending fields below to unlock maximum recruiter visibility:
 </p>
 <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
 {pendingItems.map((item, idx) => (
 <button
 key={idx}
 type="button"
 onClick={() => scrollToField(item.fieldId)}
 className="w-full text-left p-3.5 bg-white/60 hover:bg-blue-50/40 border border-slate-200/50 rounded-2xl transition-all flex items-center justify-between gap-3 group premium-glow-card"
 >
 <div className="flex items-center gap-3">
 <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0"></div>
 <div className="space-y-0.5">
 <span className="font-extrabold text-xs text-slate-800 group-hover:text-blue-600 block transition-colors">
 {item.label}
 </span>
 <span className="text-[10px] text-slate-400 font-bold block">{item.action}</span>
 </div>
 </div>
 <span className="text-[10px] font-black text-blue-600 shrink-0 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50">
 +{item.score}%
 </span>
 </button>
 ))}
 </div>
 </div>
 )}
 </div>
 );
 })()}

 {/* Integrated AI/ATS Score Simulator Card */}
 {(() => {
 const { score: atSc, suggestions, foundKeywords } = getATSAnalysis();
 
 let scoreColor ="text-rose-600";
 let scoreBg ="bg-rose-500/10";
 let scoreTrack ="bg-rose-100";
 let scoreProgress ="bg-rose-500";
 
 if (atSc >= 80) {
 scoreColor ="text-emerald-600";
 scoreBg ="bg-emerald-500/10";
 scoreTrack ="bg-emerald-100";
 scoreProgress ="bg-emerald-500";
 } else if (atSc >= 60) {
 scoreColor ="text-amber-600";
 scoreBg ="bg-amber-500/10";
 scoreTrack ="bg-amber-100";
 scoreProgress ="bg-amber-500";
 }

 return (
 <div className="bg-slate-950 text-slate-100 border border-slate-900 rounded-3xl p-6 shadow-2xl space-y-5 premium-glow-card relative overflow-hidden font-mono">
 <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
 <div className="flex items-center justify-between border-b border-slate-900 pb-3">
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ATS compatibility</span>
 <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60 uppercase tracking-wider">
 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live Audit
 </div>
 </div>

 <div className="flex items-center gap-4.5">
 <div className={`w-14 h-14 rounded-xl ${scoreBg} flex items-center justify-center text-center shrink-0 border border-white/5`}>
 <span className={`text-xl font-black ${scoreColor}`}>{atSc}%</span>
 </div>
 <div className="space-y-1">
 <span className="font-extrabold text-xs text-white block">Keyword Match Rating</span>
 <p className="text-[10px] text-slate-400 leading-normal font-bold">
 Parsing algorithms compatibility evaluation.
 </p>
 </div>
 </div>

 {/* Progress visual bar */}
 <div className="space-y-1">
 <div className={`w-full ${scoreTrack} h-2 rounded overflow-hidden border border-white/5`}>
 <div className={`${scoreProgress} h-2 rounded transition-all duration-75`} style={{ width:`${atSc}%`}}></div>
 </div>
 </div>

 {/* Verified Keywords badging */}
 <div className="space-y-2 pt-3 border-t border-slate-900">
 <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Found Keywords ({foundKeywords.length})</span>
 <div className="flex flex-wrap gap-1">
 {foundKeywords.map((kw, idx) => (
 <span key={idx} className="inline-flex items-center text-[9px] font-black px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded shadow-sm">
 {kw}
 </span>
 ))}
 {foundKeywords.length === 0 && (
 <span className="text-[10px] text-slate-500 font-bold italic">No core technical keywords mapped.</span>
 )}
 </div>
 </div>
 
 {/* ATS Checklist Improvement */}
 {suggestions.length > 0 && (
 <div className="space-y-2 pt-3 border-t border-slate-900">
 <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Optimization Steps</span>
 <ul className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
 {suggestions.map((sug, idx) => (
 <li key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-300 leading-normal">
 <span className="text-amber-500 font-bold shrink-0">•</span>
 <span>{sug}</span>
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>
 );
 })()}

 {/* Job Preference & Resume Overview */}
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-6 shadow-xl shadow-slate-100/40 space-y-5 premium-glow-card">
 <span className="text-xs font-black text-slate-600 uppercase tracking-widest block font-sans">Job Preference & Resume</span>
 <div className="space-y-3.5 text-xs">
 <div className="flex items-center gap-3 text-slate-700">
 <div className="p-2 bg-blue-50 text-blue-500 rounded-xl border border-blue-100/50 shrink-0">
 <Briefcase className="w-4 h-4"/>
 </div>
 <div className="space-y-0.5">
 <span className="text-slate-400 block text-[9px] uppercase font-black tracking-widest">Desired Role</span>
 <span className="font-extrabold text-slate-800">{desiredRole ||"Not specified"}</span>
 </div>
 </div>

 <div className="flex items-center gap-3 text-slate-700 pt-3 border-t border-slate-100">
 <div className="p-2 bg-blue-50 text-blue-500 rounded-xl border border-blue-100/50 shrink-0">
 <MapPin className="w-4 h-4"/>
 </div>
 <div className="space-y-0.5">
 <span className="text-slate-400 block text-[9px] uppercase font-black tracking-widest">Preferred Location</span>
 <span className="font-extrabold text-slate-800">{preferredLocation ||"Not specified"}</span>
 </div>
 </div>

 <div className="flex items-center gap-3 text-slate-700 pt-3 border-t border-slate-100">
 <div className="p-2 bg-blue-50 text-blue-500 rounded-xl border border-blue-100/50 shrink-0">
 <DollarSign className="w-4 h-4"/>
 </div>
 <div className="space-y-0.5">
 <span className="text-slate-400 block text-[9px] uppercase font-black tracking-widest">Expected CTC</span>
 <span className="font-extrabold text-slate-800">{expectedCtc ||"Not specified"}</span>
 </div>
 </div>

 {resumeUrl && (
 <div className="flex items-center gap-3 text-slate-700 pt-3 border-t border-slate-100">
 <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl border border-emerald-100/50 shrink-0">
 <FileText className="w-4 h-4"/>
 </div>
 <div className="space-y-0.5">
 <span className="text-slate-400 block text-[9px] uppercase font-black tracking-widest">Online Resume</span>
 <a 
 href={resumeUrl.startsWith("http") ? resumeUrl :`https://${resumeUrl}`}
 target="_blank"
 rel="noopener noreferrer"
 className="font-black text-blue-600 hover:underline inline-flex items-center gap-1"
 >
 View Uploaded CV <ExternalLink className="w-3 h-3"/>
 </a>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Input Form Column: High-fidelity segment visual cards */}
 <div className="lg:col-span-2 space-y-8">
 
 <form onSubmit={handleUpdateProfile} className="space-y-8">
 
 {/* Visual Card 1: Personal & Contact details */}
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/40 space-y-6 transition-all premium-glow-card">
 <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shrink-0">
 <User className="w-5 h-5"/>
 </div>
 <div>
 <h4 className="font-black text-slate-900 text-lg tracking-tight">Personal & Contact Details</h4>
 <p className="text-xs text-slate-500 font-bold">Provide your primary contact coordinates for recruiter outreach.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Candidate Full Name</label>
 <div className="relative group">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
 <User className="w-4 h-4"/>
 </div>
 <input 
 id="field-fullName"
 type="text"
 required
 value={fullName}
 onChange={e => setFullName(e.target.value)}
 placeholder="e.g. Amit Sharma"
 className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold text-slate-800 transition-all shadow-sm placeholder:text-slate-400"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Official Email Address</label>
 <div className="relative">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
 <Mail className="w-4 h-4"/>
 </div>
 <input 
 id="field-email"
 type="email"
 required
 disabled
 value={email}
 className="w-full pl-10 pr-4 py-3 bg-slate-100/60 border border-slate-200 rounded-xl outline-none text-sm text-slate-500 font-bold cursor-not-allowed"
 />
 </div>
 </div>

 <div className="space-y-2 md:col-span-2">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Mobile Number</label>
 <div className="relative group">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
 <Phone className="w-4 h-4"/>
 </div>
 <input 
 id="field-phone"
 type="text"
 value={phone}
 onChange={e => setPhone(e.target.value)}
 placeholder="e.g. +91 99887 76655"
 className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold text-slate-800 transition-all shadow-sm placeholder:text-slate-400"
 />
 </div>
 </div>
 </div>
 </div>

 {/* Visual Card 2: Education & Experience Foundation */}
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/40 space-y-6 transition-all premium-glow-card">
 <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shrink-0">
 <GraduationCap className="w-5 h-5"/>
 </div>
 <div>
 <h4 className="font-black text-slate-900 text-lg tracking-tight">Education & Professional Experience</h4>
 <p className="text-xs text-slate-500 font-bold">List your colleges, degree specializations, and professional career summary.</p>
 </div>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">College Name & Degree Details</label>
 <div className="relative group">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
 <GraduationCap className="w-4 h-4"/>
 </div>
 <input 
 id="field-college"
 type="text"
 value={college}
 onChange={e => setCollege(e.target.value)}
 placeholder="e.g. DTU B.Tech Computer Science"
 className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold text-slate-800 transition-all shadow-sm placeholder:text-slate-400"
 />
 </div>
 </div>
 
 <div className="space-y-2">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Professional Experience Summary</label>
 <div className="relative group">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
 <Award className="w-4 h-4"/>
 </div>
 <input 
 id="field-experience"
 type="text"
 value={experience}
 onChange={e => setExperience(e.target.value)}
 placeholder="e.g. 2 Years as Software Engineer or Fresher"
 className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold text-slate-800 transition-all shadow-sm placeholder:text-slate-400"
 />
 </div>
 </div>
 </div>
 </div>

 {/* Visual Card 3: Job Preferences */}
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/40 space-y-6 transition-all premium-glow-card">
 <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shrink-0">
 <Briefcase className="w-5 h-5"/>
 </div>
 <div>
 <h4 className="font-black text-slate-900 text-lg tracking-tight">Job Preferences & CTC</h4>
 <p className="text-xs text-slate-500 font-bold">List your target jobs, locations, and salary expectation parameters.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 <div className="space-y-2">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Desired Job Role</label>
 <div className="relative group">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
 <Briefcase className="w-4 h-4"/>
 </div>
 <input 
 id="field-desiredRole"
 type="text"
 value={desiredRole}
 onChange={e => setDesiredRole(e.target.value)}
 placeholder="e.g. React Developer"
 className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold text-slate-800 transition-all shadow-sm placeholder:text-slate-400"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Preferred Location</label>
 <div className="relative group">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
 <MapPin className="w-4 h-4"/>
 </div>
 <input 
 id="field-preferredLocation"
 type="text"
 value={preferredLocation}
 onChange={e => setPreferredLocation(e.target.value)}
 placeholder="e.g. Remote / Delhi"
 className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold text-slate-800 transition-all shadow-sm placeholder:text-slate-400"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Expected CTC</label>
 <div className="relative group">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
 <DollarSign className="w-4 h-4"/>
 </div>
 <input 
 id="field-expectedCtc"
 type="text"
 value={expectedCtc}
 onChange={e => setExpectedCtc(e.target.value)}
 placeholder="e.g. 6,00,000 LPA"
 className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold text-slate-800 transition-all shadow-sm placeholder:text-slate-400"
 />
 </div>
 </div>
 </div>
 </div>

 {/* Visual Card 4: Professional Pitch & Skills Tags */}
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100/40 space-y-6 transition-all premium-glow-card">
 <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/50 shrink-0">
 <Sparkles className="w-5 h-5"/>
 </div>
 <div>
 <h4 className="font-black text-slate-900 text-lg tracking-tight">Professional Pitch & Skills</h4>
 <p className="text-xs text-slate-500 font-bold">Highlight your specialized core competencies and link your resume file.</p>
 </div>
 </div>
 
 <div className="space-y-5">
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <AvatarUploader 
 userId={userId || "demo-candidate-uid"}
 currentAvatarUrl={avatarUrl}
 onUploadSuccess={(url) => setAvatarUrl(url)}
 />
 <ResumeUploader 
 userId={userId || "demo-candidate-uid"}
 currentResumeUrl={resumeUrl}
 onUploadSuccess={(url) => setResumeUrl(url)}
 />
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 <div className="space-y-2">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Portfolio / GitHub URL</label>
 <div className="relative group">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
 <ExternalLink className="w-4 h-4"/>
 </div>
 <input 
 type="url"
 value={portfolioUrl}
 onChange={e => setPortfolioUrl(e.target.value)}
 placeholder="e.g. https://github.com/..."
 className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm text-slate-800 font-bold transition-all shadow-sm placeholder:text-slate-400"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Intro Video Pitch (YouTube/Loom)</label>
 <div className="relative group">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-rose-500 transition-colors">
 <BookOpen className="w-4 h-4"/>
 </div>
 <input 
 type="url"
 value={videoPitchUrl}
 onChange={e => setVideoPitchUrl(e.target.value)}
 placeholder="e.g. https://youtube.com/..."
 className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-sm text-slate-800 font-bold transition-all shadow-sm placeholder:text-slate-400"
 />
 </div>
 </div>
 </div>
  
  <div className="pt-4 border-t border-slate-100">
    <div className="flex items-center gap-2 mb-4">
      <Award className="w-5 h-5 text-indigo-500" />
      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Coding Profiles & Certifications <span className="text-[10px] text-slate-400 normal-case">(Optional)</span></h4>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
      <div className="space-y-2">
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">HackerRank Profile URL</label>
      <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-green-500 transition-colors">
      <ExternalLink className="w-4 h-4"/>
      </div>
      <input 
      type="url"
      value={hackerrankUrl}
      onChange={e => setHackerrankUrl(e.target.value)}
      placeholder="e.g. https://hackerrank.com/..."
      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none text-sm text-slate-800 font-bold transition-all shadow-sm placeholder:text-slate-400"
      />
      </div>
      </div>

      <div className="space-y-2">
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">LeetCode Profile URL</label>
      <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-yellow-500 transition-colors">
      <ExternalLink className="w-4 h-4"/>
      </div>
      <input 
      type="url"
      value={leetcodeUrl}
      onChange={e => setLeetcodeUrl(e.target.value)}
      placeholder="e.g. https://leetcode.com/..."
      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none text-sm text-slate-800 font-bold transition-all shadow-sm placeholder:text-slate-400"
      />
      </div>
      </div>
    </div>
    
    <div className="space-y-2">
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Professional Certifications</label>
      <div className="relative group">
      <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
      <Award className="w-4 h-4"/>
      </div>
      <textarea 
      value={certifications}
      onChange={e => setCertifications(e.target.value)}
      placeholder="List your certifications (e.g., AWS Certified Solutions Architect, Google Data Analytics...)"
      rows={3}
      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm text-slate-800 font-bold transition-all shadow-sm placeholder:text-slate-400 resize-none"
      />
      </div>
    </div>
  </div>
  
  <div className="space-y-3 pt-4 border-t border-slate-100 mt-4">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Add Professional Skills (Press Enter)</label>
 <div className="flex gap-2.5">
 <div className="relative flex-1 group">
 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
 <Tag className="w-4 h-4"/>
 </div>
 <input 
 id="field-skills"
 type="text"
 value={skillInput}
 onChange={e => setSkillInput(e.target.value)}
 onKeyDown={e => {
 if (e.key ==="Enter") {
 e.preventDefault();
 if (skillInput.trim()) {
 setSkills([...skills, skillInput.trim().toUpperCase()]);
 setSkillInput("");
 }
 }
 }}
 placeholder="Type skill tag (e.g. REACT, TYPESCRIPT) and press Enter"
 className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm text-slate-800 font-mono transition-all shadow-sm placeholder:text-slate-400"
 />
 </div>
 <button
 type="button"
 onClick={() => {
 if (skillInput.trim()) {
 setSkills([...skills, skillInput.trim().toUpperCase()]);
 setSkillInput("");
 }
 }}
 className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-wider"
 >
 <Plus className="w-4 h-4"/> Add
 </button>
 </div>
 
 {/* Dynamic interactive tags list */}
 <div className="flex flex-wrap gap-2 pt-2">
 {skills.map((s, idx) => (
 <span key={idx} className="inline-flex items-center gap-1.5 text-[10px] font-black pl-3 pr-2 py-1.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 shadow-sm">
 {s}
 <button 
 type="button"
 onClick={() => handleRemoveSkill(s)}
 className="hover:text-red-500 transition-colors inline-block"
 >
 <X className="w-3 h-3 text-slate-400 hover:text-red-500 shrink-0"/>
 </button>
 </span>
 ))}
 </div>
 </div>
 
 <div className="space-y-2">
 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Professional Bio / Profile Statement</label>
 <textarea 
 id="field-bio"
 rows={4}
 value={bio}
 onChange={e => setBio(e.target.value)}
 placeholder="Provide a short, professional description of your projects, web expertise, or career goals..."
 className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold text-slate-800 transition-all shadow-sm resize-none placeholder:text-slate-400"
 />
 </div>
 </div>
 </div>
 
 <button
 type="submit"
 disabled={loading}
 className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50 text-[11px] sm:text-xs tracking-widest uppercase hover:shadow-lg hover:shadow-blue-500/20"
 >
 {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-4 h-4"/>}
 Save Candidate Resume Profile
 </button>
 </form>
 </div>
 </div>
 )}

 {/* MESSAGES TAB */}
 {activeTab ==="messages"&& (
 <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl shadow-2xl overflow-hidden min-h-[550px] grid grid-cols-1 md:grid-cols-3 animate-fadeIn">
 
 {/* Direct Message Thread Lists Sidebar */}
 <div className="border-r border-slate-200/60 p-5 space-y-5">
 <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 uppercase tracking-wider pb-3 border-b border-slate-100">
 <Building className="w-4.5 h-4.5 text-blue-500"/> Active MNC Chats
 </h3>
 
 <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
 {threads.map((t) => (
 <button
 key={t.id}
 onClick={() => setSelectedThreadId(t.id)}
 className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
 selectedThreadId === t.id
 ?"bg-blue-50/80 border-blue-200 shadow-md shadow-blue-500/5"
 :"border-slate-200/50 hover:bg-slate-50"
 }`}
 >
 <div className="space-y-1 flex-1">
 <span className="font-black text-xs text-slate-800 block">{t.company}</span>
 <span className="text-[10px] text-slate-500 font-bold block">HR: {t.name}</span>
 <p className="text-[11px] text-slate-400 truncate max-w-[170px] font-bold">{t.lastMessage}</p>
 </div>
 <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center"/>
 </button>
 ))}

 {threads.length === 0 && (
 <div className="text-center py-16 text-slate-500 text-xs italic font-bold leading-relaxed px-4">
 No active messages yet. Build a premium profile to invite recruiter engagement in Talent Scout!
 </div>
 )}
 </div>
 </div>

 {/* Direct message view terminal */}
 <div className="md:col-span-2 flex flex-col min-h-[550px] bg-slate-50/20">
 {selectedThreadId ? (
 <>
 {/* Active thread header */}
 <div className="px-6 py-4.5 bg-white/70 backdrop-blur-md border-b border-slate-200/60 flex items-center gap-3.5 shadow-sm">
 <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md uppercase">
 {threads.find(t => t.id === selectedThreadId)?.company.slice(0, 2) ||"HR"}
 </div>
 <div>
 <span className="font-black text-sm text-slate-800 block">
 {threads.find(t => t.id === selectedThreadId)?.company}
 </span>
 <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mt-0.5">
 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm"></span>
 HR Recruiter: {threads.find(t => t.id === selectedThreadId)?.name}
 </span>
 </div>
 </div>

 {/* Message stream area */}
 <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[350px]">
 {chatMessages.map((m) => (
 <div
 key={m.id}
 className={`flex flex-col max-w-[80%] ${
 m.sender_type ==="candidate"?"ml-auto items-end":"mr-auto items-start"
 }`}
 >
 <div
 className={`p-3.5 rounded-2xl text-xs leading-normal shadow-sm border transition-all ${
 m.sender_type ==="candidate"
 ?"bg-blue-600 text-white rounded-tr-none border-blue-600 shadow-blue-500/10"
 :"bg-white text-slate-800 rounded-tl-none border-slate-200/50"
 }`}
 >
 {m.message}
 </div>
 <span className="text-[9px] text-slate-400 font-bold mt-1.5 px-1 block">
 {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 ))}
 
 <div ref={messagesEndRef} />
 </div>

 {/* Message sending form input */}
 <form onSubmit={handleSendMessage} className="p-4 bg-white/70 border-t border-slate-200/60 flex gap-2.5 items-center">
 <input
 type="text"
 value={newMessage}
 onChange={e => setNewMessage(e.target.value)}
 placeholder="Type a message to the Recruiter... (Press Enter or Send)"
 className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs text-slate-800 font-bold"
 />
 <button
 type="submit"
 className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
 >
 <Send className="w-4 h-4"/>
 </button>
 </form>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-4">
 <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200/40">
 <MessageSquare className="w-7 h-7 text-blue-500 animate-pulse"/>
 </div>
 <div className="space-y-1 max-w-[320px]">
 <span className="font-black text-slate-700 text-sm block">Select an Active MNC Thread</span>
 <span className="text-xs text-slate-400 font-bold block leading-relaxed">
 Recruiters will initiate direct chats when they source your verified profile in their smart scout dashboard.
 </span>
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 </div>
 </div>
 );
}
