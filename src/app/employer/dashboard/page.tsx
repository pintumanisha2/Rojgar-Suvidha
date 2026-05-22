"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Building, LogOut, PlusCircle, CheckCircle, Clock, 
  Trash2, Save, FileText, ChevronRight, Briefcase, 
  MapPin, IndianRupee, Tag, Sparkles, Loader2, Info,
  ShieldCheck, Search, MessageSquare, X, Send
} from "lucide-react";

interface JobPosting {
  id: string;
  title: string;
  category: string;
  location: string;
  salary: string;
  education: string;
  experience: string;
  apply_url: string;
  description: string;
  status: "pending_approval" | "active" | "closed";
  created_at: string;
  slug: string;
}

export default function EmployerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("Demo Recruiters");
  const [hrName, setHrName] = useState("HR Manager");
  const [userId, setUserId] = useState<string | null>(null);
  
  // Verification States
  const [isVerified, setIsVerified] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  const [verifyingLoading, setVerifyingLoading] = useState(false);
  
  // Dashboard Listings State
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isPostingFormOpen, setIsPostingFormOpen] = useState(false);
  
  // Post Job Fields
  const [title, setTitle] = useState("");
  const [jobCategory, setJobCategory] = useState("private-jobs");
  const [location, setLocation] = useState("Remote/WFH");
  const [salary, setSalary] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [description, setDescription] = useState("");
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);

  // Talent Scout & Chat Workspace States
  const [activeTab, setActiveTab] = useState<"jobs" | "talent" | "applications">("jobs");
  const [searchQuery, setSearchQuery] = useState("");
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [candidateChatMessages, setCandidateChatMessages] = useState<any[]>([]);
  const [candidateChatInput, setCandidateChatInput] = useState("");

  const handleCandidateSelect = async (candidate: any) => {
    setSelectedCandidate(candidate);
    
    // Trigger Profile Visit Notification
    if (userId && !candidate.id.startsWith("mock-")) {
      try {
        await supabase.from("profile_visits").insert([{
          employer_id: userId,
          candidate_id: candidate.id
        }]);
      } catch (e) {
        console.warn("Failed to record profile visit:", e);
      }
    } else {
      // Mock local storage notification
      const localVisits = localStorage.getItem("rs_mock_profile_visits");
      const visits = localVisits ? JSON.parse(localVisits) : [];
      visits.push({
        id: "visit-" + Date.now(),
        employer_id: userId || "mock-employer",
        candidate_id: candidate.id,
        employer_name: companyName,
        visited_at: new Date().toISOString()
      });
      localStorage.setItem("rs_mock_profile_visits", JSON.stringify(visits));
    }
  };

  // Applications & ATS States
  const [selectedJobForApps, setSelectedJobForApps] = useState<JobPosting | null>(null);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Fetch Candidates for Sourcing
  useEffect(() => {
    if (!isVerified || activeTab !== "talent") return;

    const fetchCandidates = async () => {
      // 1. Attempt Supabase fetch
      try {
        const { data, error } = await supabase
          .from("private_candidate_profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setCandidates(data);
          return;
        }
      } catch (e) {
        console.warn("Could not fetch candidate profiles from DB. Loading sandbox simulations.", e);
      }

      // 2. Load Simulation Mock Candidates
      const localCandidatesStr = localStorage.getItem("rs_candidate_mock_profile");
      const baseCandidates = [
        {
          id: "demo-candidate-uid",
          full_name: "Amit Sharma",
          email: "candidate@rojgarsuvidha.com",
          phone: "+91 99887 76655",
          skills: ["REACT", "NEXT.JS", "TYPESCRIPT", "TAILWIND CSS", "NODE.JS"],
          experience: "2 Years as Frontend Developer",
          college: "Delhi Technological University",
          bio: "Passionate web developer specializing in reactive user experiences and modern frontend tooling."
        },
        {
          id: "mock-candidate-rahul",
          full_name: "Rahul Verma",
          email: "rahul.verma@example.com",
          phone: "+91 98987 87878",
          skills: ["JAVA", "SPRING BOOT", "POSTGRESQL", "DOCKER"],
          experience: "Fresher",
          college: "IIT Bombay",
          bio: "Enthusiastic backend software engineering graduate eager to build highly scalable microservices."
        },
        {
          id: "mock-candidate-priya",
          full_name: "Priya Nair",
          email: "priya.nair@example.com",
          phone: "+91 88776 65544",
          skills: ["PYTHON", "MACHINE LEARNING", "PANDAS", "AWS"],
          experience: "1 Year as Data Analyst",
          college: "BITS Pilani",
          bio: "Data enthusiast with strong analytical capabilities and hands-on ML model deployment experience."
        }
      ];

      if (localCandidatesStr) {
        try {
          const parsed = JSON.parse(localCandidatesStr);
          const idx = baseCandidates.findIndex(c => c.id === parsed.id || c.email === parsed.email);
          if (idx !== -1) {
            baseCandidates[idx] = parsed;
          } else {
            baseCandidates.unshift(parsed);
          }
        } catch (err) {}
      }

      setCandidates(baseCandidates);
    };

    fetchCandidates();
  }, [isVerified, activeTab]);

  // Fetch Job Applications when ATS view opens
  useEffect(() => {
    if (!selectedJobForApps || activeTab !== "applications") return;

    const fetchApplications = async () => {
      setLoadingApps(true);
      try {
        // Attempt Supabase fetch if userId exists
        if (userId && !selectedJobForApps.id.startsWith("mock-")) {
          const { data, error } = await supabase
            .from("private_job_applications")
            .select(`
              id,
              status,
              cover_letter,
              created_at,
              candidate:private_candidate_profiles(
                id, full_name, email, phone, skills, experience, college, resume_url
              )
            `)
            .eq("job_id", selectedJobForApps.id)
            .order("created_at", { ascending: false });
          
          if (!error && data) {
            setJobApplications(data);
            setLoadingApps(false);
            return;
          }
        }
      } catch(e) {}

      // Fallback to local storage simulation
      const localAppsStr = localStorage.getItem("rs_mock_applications");
      if (localAppsStr) {
        const apps = JSON.parse(localAppsStr);
        const filtered = apps.filter((a: any) => a.job_id === selectedJobForApps.id);
        setJobApplications(filtered);
      } else {
        setJobApplications([]); // No mock applications yet
      }
      setLoadingApps(false);
    };

    fetchApplications();
  }, [selectedJobForApps, activeTab, userId]);

  const handleUpdateApplicationStatus = async (appId: string, status: string) => {
    // Optimistic UI Update
    setJobApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    
    // Attempt DB Update
    if (userId && !appId.startsWith("mock-")) {
      supabase.from("private_job_applications").update({ status }).eq("id", appId).then();
    } else {
      // Local mock update
      const localAppsStr = localStorage.getItem("rs_mock_applications");
      if (localAppsStr) {
        let apps = JSON.parse(localAppsStr);
        apps = apps.map((a: any) => a.id === appId ? { ...a, status } : a);
        localStorage.setItem("rs_mock_applications", JSON.stringify(apps));
      }
    }
  };

  // Fetch messages between Recruiter and Selected Candidate
  useEffect(() => {
    if (!selectedCandidate) return;

    const fetchCandidateChat = async () => {
      const senderId = userId || "demo-recruiter-uid";
      
      if (userId) {
        try {
          const { data } = await supabase
            .from("private_messages")
            .select("*")
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${selectedCandidate.id}),and(sender_id.eq.${selectedCandidate.id},receiver_id.eq.${userId})`)
            .order("created_at", { ascending: true });

          if (data) {
            setCandidateChatMessages(data);
            return;
          }
        } catch (e) {}
      }

      const mockStr = localStorage.getItem("rs_candidate_mock_messages");
      if (mockStr) {
        const msgs = JSON.parse(mockStr) as any[];
        const filtered = msgs.filter(
          m => (m.sender_id === senderId && m.receiver_id === selectedCandidate.id) ||
               (m.sender_id === selectedCandidate.id && m.receiver_id === senderId) ||
               (m.sender_id === "demo-candidate-uid" && m.receiver_id === selectedCandidate.id) ||
               (m.sender_id === selectedCandidate.id && m.receiver_id === "demo-candidate-uid")
        );
        setCandidateChatMessages(filtered);
      } else {
        setCandidateChatMessages([]);
      }
    };

    fetchCandidateChat();
  }, [selectedCandidate, userId]);

  const handleSendCandidateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateChatInput.trim() || !selectedCandidate) return;

    const messageText = candidateChatInput.trim();
    setCandidateChatInput("");

    const senderId = userId || "demo-recruiter-uid";
    const newMsgObj = {
      id: "msg-" + Date.now(),
      sender_id: senderId,
      receiver_id: selectedCandidate.id,
      message: messageText,
      sender_type: "employer" as const,
      created_at: new Date().toISOString(),
      sender_name: hrName,
      company_name: companyName
    };

    if (userId) {
      try {
        const { error } = await supabase.from("private_messages").insert([{
          sender_id: userId,
          receiver_id: selectedCandidate.id,
          message: messageText,
          sender_type: "employer"
        }]);
        if (!error) {
          setCandidateChatMessages(prev => [...prev, newMsgObj]);
          return;
        }
      } catch (err) {}
    }

    const mockStr = localStorage.getItem("rs_candidate_mock_messages");
    const msgs = mockStr ? JSON.parse(mockStr) : [];
    const updatedMessages = [...msgs, newMsgObj];
    localStorage.setItem("rs_candidate_mock_messages", JSON.stringify(updatedMessages));
    setCandidateChatMessages(prev => [...prev, newMsgObj]);

    setTimeout(() => {
      let replyText = `Hello ${hrName}! Thank you so much for reaching out from ${companyName}. I am definitely interested in discussing this opportunity. I am available for a video call anytime tomorrow after 2 PM.`;
      
      if (messageText.toLowerCase().includes("skills") || messageText.toLowerCase().includes("resume")) {
        replyText = `Thank you! I have updated my professional candidate workspace with my latest projects. Let's arrange a call to discuss further details.`;
      }

      const simReply = {
        id: "msg-sim-cand-reply-" + Date.now(),
        sender_id: selectedCandidate.id,
        receiver_id: senderId,
        message: replyText,
        sender_type: "candidate" as const,
        created_at: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, simReply];
      localStorage.setItem("rs_candidate_mock_messages", JSON.stringify(finalMessages));
      
      setCandidateChatMessages(prev => [...prev, simReply]);
    }, 2500);
  };

  useEffect(() => {
    // 1. Get logged-in user profile details
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      
      // Load fallback mock names if registered locally
      const mockComp = localStorage.getItem("rs_employer_mock_company") || "Aspirants Adda Partner";
      const mockHr = localStorage.getItem("rs_employer_mock_hr") || "Recruitment Manager";
      
      if (sessionUser) {
        setUserId(sessionUser.id);
        const { data: profile } = await supabase
          .from("employer_profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .single();
        
        if (profile) {
          setCompanyName(profile.company_name);
          setHrName(profile.hr_name);
          setIsVerified(profile.is_verified || false);
          setGstNumber(profile.gst_number || "");
          setPhone(profile.phone || "");
          if (profile.gst_number || profile.phone) {
            setVerificationSubmitted(true);
          }
        } else {
          setCompanyName(mockComp);
          setHrName(mockHr);
          const localVerified = localStorage.getItem("rs_employer_mock_verified") === "true";
          setIsVerified(localVerified);
          setGstNumber(localStorage.getItem("rs_employer_mock_gst") || "");
          setPhone(localStorage.getItem("rs_employer_mock_phone") || "");
          if (localStorage.getItem("rs_employer_mock_gst")) {
            setVerificationSubmitted(true);
          }
        }
      } else {
        // Safe check for demo authentication
        if (mockComp && mockHr) {
          setCompanyName(mockComp);
          setHrName(mockHr);
          const localVerified = localStorage.getItem("rs_employer_mock_verified") === "true";
          setIsVerified(localVerified);
          setGstNumber(localStorage.getItem("rs_employer_mock_gst") || "");
          setPhone(localStorage.getItem("rs_employer_mock_phone") || "");
          if (localStorage.getItem("rs_employer_mock_gst")) {
            setVerificationSubmitted(true);
          }
        } else {
          // Send to login if no auth details
          router.push("/employer/login");
        }
      }
    };

    initSession();
  }, []);

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyingLoading(true);
    
    if (!gstNumber.trim() || !phone.trim()) {
      alert("Please fill in both GSTIN/CIN and official Recruiter Mobile Number.");
      setVerifyingLoading(false);
      return;
    }
    
    try {
      if (userId) {
        const { error } = await supabase
          .from("employer_profiles")
          .update({
            gst_number: gstNumber.trim(),
            phone: phone.trim()
          })
          .eq("id", userId);
        
        if (error) throw error;
      }
      
      localStorage.setItem("rs_employer_mock_gst", gstNumber.trim());
      localStorage.setItem("rs_employer_mock_phone", phone.trim());
      setVerificationSubmitted(true);
      alert("Business verification details submitted successfully! The admin will review and verify your company shortly.");
    } catch (err: any) {
      console.warn("Could not save verification to Supabase, fallback to simulation mode:", err);
      localStorage.setItem("rs_employer_mock_gst", gstNumber.trim());
      localStorage.setItem("rs_employer_mock_phone", phone.trim());
      setVerificationSubmitted(true);
      alert("Business verification details submitted successfully (Simulation Mode)!");
    } finally {
      setVerifyingLoading(false);
    }
  };

  // Fetch employer jobs
  useEffect(() => {
    fetchEmployerJobs();
  }, [userId]);

  const fetchEmployerJobs = async () => {
    if (!userId) {
      // Fallback from localStorage
      loadLocalMockJobs();
      return;
    }

    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("employer_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Map database format to internal job format
        const mappedJobs: JobPosting[] = data.map((j: any) => {
          let lastDate = "";
          let applyLink = "";
          if (j.links && j.links.length > 0) {
            applyLink = j.links[0]?.url || "";
          }

          // Extract highlights from descriptions or structure if saved in SQL
          return {
            id: j.id,
            title: j.title,
            category: j.category,
            location: j.state_code || "Remote/WFH",
            salary: "₹20,000 - ₹35,000 / month", // Standard default
            education: "Graduate",
            experience: "Freshers",
            apply_url: applyLink,
            description: j.short_info || "",
            status: j.status as any,
            created_at: j.created_at,
            slug: j.slug
          };
        });
        setJobs(mappedJobs);
      }
    } catch (e) {
      console.warn("Table jobs doesn't contain employer_id or isn't fully migrated. Using dynamic local jobs dashboard for simulation.", e);
      loadLocalMockJobs();
    }
  };

  const loadLocalMockJobs = () => {
    const local = localStorage.getItem("rs_employer_mock_jobs");
    if (local) {
      setJobs(JSON.parse(local));
    } else {
      // Set basic default postings for demo
      const initialMocks: JobPosting[] = [
        {
          id: "mock-job-1",
          title: "Remote Customer Success Representative",
          category: "private-jobs",
          location: "Remote/WFH",
          salary: "₹18,000 - ₹26,000 / month",
          education: "12th Pass / Graduate",
          experience: "Freshers Welcome",
          apply_url: "https://wipro.com/careers",
          description: "We are hiring telecallers to support users with account logins, profile creation, and documentation sync entirely online. Solid training will be provided.",
          status: "pending_approval",
          created_at: new Date().toISOString(),
          slug: "remote-customer-success-representative"
        }
      ];
      localStorage.setItem("rs_employer_mock_jobs", JSON.stringify(initialMocks));
      setJobs(initialMocks);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);
    setPostSuccess(null);
    setLoading(true);

    if (!title.trim() || !salary.trim() || !description.trim()) {
      setPostError("Please fill in Job Title, Salary Package and Job Description.");
      setLoading(false);
      return;
    }

    const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const dateStr = new Date().toISOString();

    const newJob: JobPosting = {
      id: "job-" + Date.now(),
      title: title.trim(),
      category: jobCategory,
      location,
      salary: salary.trim(),
      education: education.trim() || "Graduate",
      experience: experience.trim() || "Freshers",
      apply_url: applyUrl.trim() || "https://www.rojgarsuvidha.com",
      description: description.trim(),
      status: "pending_approval",
      created_at: dateStr,
      slug
    };

    try {
      // 1. Attempt Supabase insert
      if (userId) {
        const payload = {
          title: title.trim(),
          slug,
          category: "private-jobs",
          status: "pending_approval",
          state_code: location,
          short_info: `${companyName} (${location}) is hiring for ${title}. ${description.slice(0, 100)}...`,
          blog_content: `
            <h2>${title} Job Opening at ${companyName}</h2>
            <p>${description}</p>
            <h3>Job Details:</h3>
            <ul>
              <li><strong>Salary:</strong> ${salary}</li>
              <li><strong>Location:</strong> ${location}</li>
              <li><strong>Required Education:</strong> ${education || 'Graduate'}</li>
              <li><strong>Required Experience:</strong> ${experience || 'Freshers'}</li>
            </ul>
          `,
          links: [{ label: "Apply Online", url: applyUrl.trim() || "https://rojgarsuvidha.com" }],
          employer_id: userId
        };

        const { error: insertErr } = await supabase.from("jobs").insert([payload]);
        if (insertErr) throw insertErr;
      } else {
        throw new Error("No database session active");
      }

      // Add to local state
      const updated = [newJob, ...jobs];
      setJobs(updated);
      setPostSuccess("Job posted successfully! It has been submitted to the Admin for safety vetting and will go live within 24 hours.");
      
      // Reset form
      setTitle("");
      setSalary("");
      setDescription("");
      setApplyUrl("");
      setIsPostingFormOpen(false);

    } catch (err: any) {
      console.warn("Could not insert job to Supabase. Using localStorage mock fallback for verification.", err);
      
      // Save locally
      const updatedMock = [newJob, ...jobs];
      setJobs(updatedMock);
      localStorage.setItem("rs_employer_mock_jobs", JSON.stringify(updatedMock));
      
      setPostSuccess("Job posted successfully (Simulation Mode)! The job is under vetting. It will go live once verified.");
      setTitle("");
      setSalary("");
      setDescription("");
      setApplyUrl("");
      setIsPostingFormOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateJob = (id: string) => {
    if (confirm("Are you sure you want to close this job opening? Candidates won't be able to apply anymore.")) {
      const updated = jobs.map(j => {
        if (j.id === id) return { ...j, status: "closed" as const };
        return j;
      });
      setJobs(updated);
      localStorage.setItem("rs_employer_mock_jobs", JSON.stringify(updated));
      
      // Attempt backend update if possible
      if (userId && !id.startsWith("mock-")) {
        supabase.from("jobs").update({ status: "closed" }).eq("id", id).then();
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("rs_employer_mock_company");
    localStorage.removeItem("rs_employer_mock_hr");
    router.push("/employer/login");
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-8 px-4 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Block */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                {companyName}{" "}
                {isVerified ? (
                  <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-bold px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800/40 tracking-wide uppercase">
                    Verified Employer 🟢
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40 tracking-wide uppercase">
                    Verification Pending ⏳
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-500 font-medium">Logged in: {hrName} (HR Recruiter)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isVerified && (
              <button 
                onClick={() => setIsPostingFormOpen(!isPostingFormOpen)}
                className="inline-flex items-center gap-2 text-white font-bold bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 text-sm"
              >
                <PlusCircle className="w-4 h-4" /> Post a New Job
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-850 font-bold px-4 py-2.5 rounded-xl transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        </div>

        {isVerified && (
          <div className="flex bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-1.5 rounded-2xl shadow-sm">
            <button
              onClick={() => setActiveTab("jobs")}
              className={`flex-1 py-3 px-6 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === "jobs"
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-white shadow-sm font-extrabold"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Briefcase className="w-4 h-4" /> Vacancy Openings ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab("talent")}
              className={`flex-1 py-3 px-6 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === "talent"
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-white shadow-sm font-extrabold"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" /> Talent Scout (LinkedIn Sourcing) 🎯
            </button>
            {activeTab === "applications" && selectedJobForApps && (
              <button
                className="flex-1 py-3 px-6 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-white shadow-sm"
              >
                <FileText className="w-4 h-4 text-emerald-500" /> Applicants: {selectedJobForApps.title}
              </button>
            )}
          </div>
        )}

        {/* If recruiter is NOT verified, lock the dashboard behind a premium vetting block */}
        {!isVerified ? (
          <div className="bg-gradient-to-br from-slate-900 via-gray-950 to-indigo-950 border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-white relative overflow-hidden">
            
            {/* Background glowing aura */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 shrink-0 self-start">
                <ShieldCheck className="w-10 h-10 animate-pulse" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] tracking-widest font-extrabold uppercase bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full border border-amber-500/30">
                  Account Verification Pending ⏳
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">🔒 Business Vetting Workspace Locked</h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-3xl">
                  Rojgar Suvidha operates a secure, zero-spam candidate ecosystem. Your corporate profile registration is currently under review by our Admin Desk. Recruiters are blocked from posting active openings until their business details are successfully vetted.
                </p>
              </div>
            </div>

            {/* Verification Status timeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs">✓</div>
                <div>
                  <span className="text-xs font-bold block text-white">Profile Registered</span>
                  <span className="text-[10px] text-gray-400">GSTIN and Mobile Sync</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs animate-pulse">⏳</div>
                <div>
                  <span className="text-xs font-bold block text-amber-400">Admin Review Desk</span>
                  <span className="text-[10px] text-gray-400">Verifying GSTIN/PAN Registry</span>
                </div>
              </div>
              <div className="flex items-center gap-3 opacity-40">
                <div className="w-7 h-7 rounded-full bg-gray-600 text-white flex items-center justify-center font-bold text-xs">3</div>
                <div>
                  <span className="text-xs font-bold block text-white">Active Posting Unlocked</span>
                  <span className="text-[10px] text-gray-400">Publish live MNC vacancies</span>
                </div>
              </div>
            </div>

            {/* Submitted Information card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                Submitted Verification Credentials
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-bold text-gray-500 block">Registered Company Name</span>
                  <span className="font-extrabold text-white">{companyName}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 block">GSTIN / CIN / PAN Code</span>
                  <span className="font-mono font-extrabold text-indigo-400 uppercase tracking-wider">{gstNumber || "Not Submitted"}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 block">Official Mobile Number</span>
                  <span className="font-bold text-white">{phone || "Not Submitted"}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 block">HR Recruiter Details</span>
                  <span className="font-bold text-white">{hrName}</span>
                </div>
              </div>

              {/* Dynamic correction block */}
              {verificationSubmitted ? (
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-gray-400">
                    ℹ️ Vetting typically takes <b>2-4 hours</b>. If you entered incorrect information, you can request an update.
                  </span>
                  <button
                    onClick={() => setVerificationSubmitted(false)}
                    className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-wider shrink-0 underline"
                  >
                    Edit Vetting Info
                  </button>
                </div>
              ) : null}
            </div>

            {/* Editable Profile Form */}
            {!verificationSubmitted && (
              <form onSubmit={handleSubmitVerification} className="bg-white text-gray-900 border border-gray-200 p-5 rounded-2xl space-y-4 shadow-inner">
                <span className="font-bold text-xs text-gray-400 uppercase tracking-wider block">Update Business Vetting Profile</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Company GSTIN / CIN / PAN</label>
                    <input
                      type="text"
                      required
                      value={gstNumber}
                      onChange={e => setGstNumber(e.target.value)}
                      placeholder="e.g. 27AADCS4120F1ZX (15-digit GSTIN)"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all text-gray-950 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Official Recruiter Mobile Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-all text-gray-950"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={verifyingLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-500/10 disabled:opacity-50 text-sm transition-colors"
                >
                  {verifyingLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Submit Profile for Verification
                </button>
              </form>
            )}
          </div>
        ) : (
          /* UNLOCKED DASHBOARD WORKSPACE */
          <>
            {activeTab === "jobs" ? (
              <>
                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Posted</span>
                <span className="block text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{jobs.length}</span>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Openings</span>
                <span className="block text-xl sm:text-2xl font-extrabold text-green-600 mt-1">
                  {jobs.filter(j => j.status === "active").length}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Under Vetting</span>
                <span className="block text-xl sm:text-2xl font-extrabold text-amber-500 mt-1">
                  {jobs.filter(j => j.status === "pending_approval").length}
                </span>
              </div>
            </div>

        {/* Job Posting Form Section (Toggleable Card) */}
        {isPostingFormOpen && (
          <form onSubmit={handlePostJob} className="bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-900/50 rounded-3xl p-6 shadow-md space-y-4 animate-in slide-in-from-top-3 duration-300">
            <div className="border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> Create & Submit Vacancy
              </h3>
              <button 
                type="button" 
                onClick={() => setIsPostingFormOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-600 font-bold"
              >
                Cancel
              </button>
            </div>

            {postError && (
              <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 p-2.5 rounded-xl border border-red-200">
                ⚠️ {postError}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Job Title</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. WFH Customer Support Associate" 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Workplace Location</label>
                <select 
                  value={location} 
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-gray-900 dark:text-white"
                >
                  <option value="Remote/WFH">🏡 Remote / Work From Home</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Estimated Salary Package</label>
                <input 
                  type="text" 
                  required
                  value={salary}
                  onChange={e => setSalary(e.target.value)}
                  placeholder="e.g. ₹20,000 - ₹30,000 / month" 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Minimum Education</label>
                <input 
                  type="text" 
                  value={education}
                  onChange={e => setEducation(e.target.value)}
                  placeholder="e.g. 12th Pass or Graduate" 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Experience Required</label>
                <input 
                  type="text" 
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  placeholder="e.g. Freshers / 1-3 Years" 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Direct HR Application Link / Email</label>
              <input 
                type="text" 
                value={applyUrl}
                onChange={e => setApplyUrl(e.target.value)}
                placeholder="e.g. https://company.com/careers or hr@company.com" 
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-gray-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Detailed Job Description & Skill Requirements</label>
              <textarea 
                rows={4}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe key responsibilities, daily work, timing, and pre-requisite skills..." 
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-gray-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 disabled:opacity-50 text-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
              Publish Job & Send for Verification
            </button>
          </form>
        )}

        {/* Success Alert */}
        {postSuccess && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{postSuccess}</span>
          </div>
        )}

        {/* Active Jobs Listings Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-500" /> Manage Posted Vacancies
            </h3>
            <span className="text-xs font-bold text-gray-400">Total: {jobs.length} jobs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/30 dark:bg-gray-850/20 border-b border-gray-100 dark:border-gray-800">
                <tr className="text-xs font-bold text-gray-400 uppercase">
                  <th className="px-6 py-3">Job Details</th>
                  <th className="px-6 py-3">Location & Salary</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white block hover:text-indigo-600 transition-colors">{job.title}</span>
                        <span className="text-[10px] text-gray-400 font-bold block mt-0.5">Submitted: {new Date(job.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">🏡 {job.location}</span>
                        <span className="text-xs font-bold text-emerald-600 block">{job.salary}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {job.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 uppercase tracking-wide">
                          Live 🟢
                        </span>
                      ) : job.status === "pending_approval" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wide">
                          Vetting ⏳
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 uppercase tracking-wide">
                          Closed ❌
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedJobForApps(job);
                            setActiveTab("applications");
                          }}
                          className="text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 px-3.5 py-1.5 rounded-lg border border-indigo-200/50 dark:border-indigo-800 transition-colors"
                        >
                          View Applicants
                        </button>
                        {job.status !== "closed" ? (
                          <button
                            onClick={() => handleDeactivateJob(job.id)}
                            className="text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 px-3.5 py-1.5 rounded-lg border border-red-200/50 dark:border-red-800 transition-colors"
                          >
                            Close
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-gray-400">Archived</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-semibold">
                      Aapne abhi tak koi job post nahi kiya hai. "Post a New Job" button par click karein!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
              </>
            ) : activeTab === "applications" && selectedJobForApps ? (
              /* APPLICATIONS & ATS TAB CONTENT */
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" /> Applicants for: {selectedJobForApps.title}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">Review profiles and shortlist or reject candidates.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("jobs")}
                      className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-800 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
                    >
                      ← Back to Jobs
                    </button>
                  </div>
                  
                  {loadingApps ? (
                    <div className="p-12 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50/30 dark:bg-gray-850/20 border-b border-gray-100 dark:border-gray-800">
                          <tr className="text-xs font-bold text-gray-400 uppercase">
                            <th className="px-6 py-3">Candidate</th>
                            <th className="px-6 py-3">Experience & College</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
                          {jobApplications.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-xs">
                                    {app.candidate?.full_name?.slice(0, 2).toUpperCase() || "CN"}
                                  </div>
                                  <div>
                                    <span className="font-bold text-gray-900 dark:text-white block">{app.candidate?.full_name || "Unknown Candidate"}</span>
                                    <span className="text-[10px] text-gray-500 font-bold block">{app.candidate?.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">{app.candidate?.experience || "Fresher"}</span>
                                <span className="text-[10px] text-gray-400 font-bold">{app.candidate?.college}</span>
                              </td>
                              <td className="px-6 py-4">
                                {app.status === 'applied' && <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 uppercase">Applied</span>}
                                {app.status === 'shortlisted' && <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:border-green-800 uppercase">Shortlisted 🟢</span>}
                                {app.status === 'rejected' && <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-800 uppercase">Rejected ❌</span>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {app.status === 'applied' && (
                                    <>
                                      <button 
                                        onClick={() => handleUpdateApplicationStatus(app.id, 'shortlisted')}
                                        className="text-[10px] font-bold bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 px-2 py-1.5 rounded-lg border border-green-200/50"
                                      >
                                        Shortlist
                                      </button>
                                      <button 
                                        onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                        className="text-[10px] font-bold bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 px-2 py-1.5 rounded-lg border border-red-200/50"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleCandidateSelect(app.candidate)}
                                    className="text-[10px] font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1.5 rounded-lg border border-indigo-200/50"
                                  >
                                    Chat
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {jobApplications.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-semibold">
                                No applications received for this job yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* TALENT SCOUT TAB CONTENT */
              <div className="space-y-6">
                
                {/* Search Sourcing bar */}
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center gap-4 animate-in fade-in duration-200">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search candidates by skills (e.g. React, Java), university, or name..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-400 shrink-0">
                    Sourced Candidates: {candidates.filter(c => 
                      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
                    ).length} profiles
                  </span>
                </div>

                {/* Sourced Candidates Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {candidates
                    .filter(c => 
                      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((cand) => (
                      <div 
                        key={cand.id}
                        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-extrabold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                {cand.full_name}
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white dark:border-gray-950 inline-block animate-pulse" title="Online now"></span>
                              </h4>
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-extrabold px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-850 text-center uppercase tracking-wide">
                                🎓 {cand.college || "Self-Taught"}
                              </span>
                            </div>
                            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                              💼 {cand.experience || "Fresher"}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500 leading-relaxed font-medium">
                            {cand.bio || "No professional summary provided."}
                          </p>

                          {/* Skill Tags */}
                          <div className="flex flex-wrap gap-1">
                            {cand.skills && cand.skills.map((s: string, idx: number) => (
                              <span key={idx} className="text-[9px] font-extrabold px-2.5 py-0.5 bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300 rounded border border-gray-100 dark:border-gray-700 font-mono">
                                {s.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleCandidateSelect(cand)}
                          className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-indigo-600/10"
                        >
                          <MessageSquare className="w-4 h-4" /> Direct Message Candidate
                        </button>
                      </div>
                    ))}

                  {candidates.length === 0 && (
                    <div className="col-span-2 text-center py-16 text-gray-400 font-medium italic text-sm">
                      Searching candidate directory...
                    </div>
                  )}
                </div>

                {/* Sliding DM chat window drawer overlay */}
                {selectedCandidate && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end animate-in fade-in duration-300">
                    <div className="w-full max-w-md h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
                      
                      {/* DM Header */}
                      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/40 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold">
                            {selectedCandidate.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-sm text-gray-900 dark:text-white block">{selectedCandidate.full_name}</span>
                            <span className="text-[10px] text-gray-400 block font-medium">Outreach to: {selectedCandidate.email}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedCandidate(null)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-white font-extrabold text-sm border border-gray-100 dark:border-gray-800 p-1.5 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* DM Conversation Streams */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[75vh]">
                        {candidateChatMessages.map((m) => (
                          <div
                            key={m.id}
                            className={`flex flex-col max-w-[85%] ${
                              m.sender_type === "employer" ? "ml-auto items-end" : "mr-auto items-start"
                            }`}
                          >
                            <div
                              className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                                m.sender_type === "employer"
                                  ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10"
                                  : "bg-gray-100 dark:bg-gray-850 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/50 dark:border-gray-700/50"
                              }`}
                            >
                              {m.message}
                            </div>
                            <span className="text-[9px] text-gray-400 mt-1 font-medium">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}

                        {candidateChatMessages.length === 0 && (
                          <div className="text-center py-12 text-gray-400 text-xs italic font-medium space-y-2 animate-in zoom-in duration-300">
                            <Sparkles className="w-8 h-8 mx-auto text-amber-500 animate-bounce" />
                            <p>Send a direct recruiter message to {selectedCandidate.full_name.split(" ")[0]} regarding job openings!</p>
                          </div>
                        )}
                      </div>

                      {/* DM Chat input form */}
                      <form onSubmit={handleSendCandidateMessage} className="p-4 bg-gray-50/50 dark:bg-gray-850/40 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                        <input
                          type="text"
                          value={candidateChatInput}
                          onChange={e => setCandidateChatInput(e.target.value)}
                          placeholder={`Message ${selectedCandidate.full_name.split(" ")[0]}...`}
                          className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs text-gray-950 dark:text-white"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-colors shadow-sm shadow-indigo-600/10 shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>

                    </div>
                  </div>
                )}

              </div>
            )}
          </>
        )}

        {/* Database instructions for admin */}
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/40 rounded-3xl p-6 flex gap-3 text-xs sm:text-sm text-indigo-700 dark:text-indigo-400">
          <Info className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <span className="font-bold block text-sm">recruiter Portal Database Vetting Info</span>
            <span>Website organic mode aur live mode dono support karti hai. Supabase database sync karne ke liye [Supabase Setup SQL] panel mein <b>employer_profiles</b> script ko run kar sakte hain. Jab tak aap migrations nahi karenge, system automatically pre-integrated localStorage sandbox mod mein switch ho jayega taki UI bina error ke immediate test kiya ja sake.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
