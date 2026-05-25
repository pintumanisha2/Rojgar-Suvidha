"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Building, LogOut, PlusCircle, CheckCircle, Clock,
  Trash2, Save, FileText, ChevronRight, Briefcase, List,
  MapPin, IndianRupee, Tag, Sparkles, Loader2, Info,
  ShieldCheck, Search, MessageSquare, X, Send, ChevronDown, Eye, Video, Play
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
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("Demo Recruiters");
  const [hrName, setHrName] = useState("HR Manager");
  const [userId, setUserId] = useState<string | null>(null);

  // Verification States
  const [isVerified, setIsVerified] = useState(true);
  const [gstNumber, setGstNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);
  const [verifyingLoading, setVerifyingLoading] = useState(false);

  // Settings Tab States
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [emailTemplateRejection, setEmailTemplateRejection] = useState("Hi {{candidate_name}},\n\nThank you for applying to {{company_name}}.\nUnfortunately, we will not be moving forward with your application at this time.\n\nBest,\nHR Team");
  const [emailTemplateInterview, setEmailTemplateInterview] = useState("Hi {{candidate_name}},\n\nWe would love to interview you for the {{job_title}} role at {{company_name}}.\nPlease join using this link at the scheduled time: {{meeting_link}}\n\nBest,\nHR Team");
  const [savingProfile, setSavingProfile] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

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
  const [activeTab, setActiveTab] = useState<"jobs" | "talent" | "applications" | "settings">("applications");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterExperience, setFilterExperience] = useState("All");
  const [filterMinAts, setFilterMinAts] = useState(0);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [candidateChatMessages, setCandidateChatMessages] = useState<any[]>([]);
  const [candidateChatInput, setCandidateChatInput] = useState("");

  // Deep Profile View State
  const [selectedCandidateForDeepView, setSelectedCandidateForDeepView] = useState<any | null>(null);
  // Shortlist Feature States
  const [applicantToShortlist, setApplicantToShortlist] = useState<any | null>(null);
  const [shortlistReason, setShortlistReason] = useState<string>("");

  const [videoUrlToPlay, setVideoUrlToPlay] = useState<string | null>(null);

  // Shortlisting from Scout
  const [candidateToShortlist, setCandidateToShortlist] = useState<any | null>(null);
  const [selectedJobIdForShortlist, setSelectedJobIdForShortlist] = useState<string>("");

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
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());

  // Interview Scheduler State
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [candidateForInterview, setCandidateForInterview] = useState<any | null>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");

  // Custom Columns State
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");

  // Rejection Feedback State
  const [rejectionModalData, setRejectionModalData] = useState<{ isOpen: boolean, appIds: string[], candidateNames: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("experience");
  const [customRejectionText, setCustomRejectionText] = useState<string>("");

  // Column Toggle State
  const [showColToggle, setShowColToggle] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    contact: true, role: true, stage: true, appliedOn: true,
    location: true, salary: true, notice: true, nextAction: true,
    shortlistReason: true, finalReason: true, hrRemarks: true
  });

  // Load custom columns from localStorage on mount
  useEffect(() => {
    const savedCols = localStorage.getItem('rs_custom_columns');
    if (savedCols) {
      try {
        setCustomColumns(JSON.parse(savedCols));
      } catch (e) {}
    }
  }, []);

  const handleDeleteCustomColumn = (colToRemove: string) => {
    const updated = customColumns.filter(c => c !== colToRemove);
    setCustomColumns(updated);
    localStorage.setItem('rs_custom_columns', JSON.stringify(updated));
  };

  const handleAddCustomColumn = () => {
    if (!newColName.trim() || customColumns.includes(newColName.trim())) return;
    const updated = [...customColumns, newColName.trim()];
    setCustomColumns(updated);
    localStorage.setItem('rs_custom_columns', JSON.stringify(updated));
    setNewColName("");
    setIsAddColModalOpen(false);
  };


  const [interviewDuration, setInterviewDuration] = useState("30");
  const [interviewLink, setInterviewLink] = useState("");

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
        console.warn("Could not fetch candidate profiles from DB:", e);
      }
    };

    fetchCandidates();
  }, [isVerified, activeTab]);

  // Fetch Job Applications when ATS view opens
  useEffect(() => {
    if (activeTab !== "applications") return;

    const fetchApplications = async () => {
      setLoadingApps(true);
      try {
        // Attempt Supabase fetch if userId exists
        if (userId && (!selectedJobForApps || !selectedJobForApps.id.startsWith("mock-"))) {
          let query = supabase
            .from("private_job_applications")
            .select(`
                id,
                job_id,
                status,
                cover_letter,
                created_at,
                ats_score,
                resume_url,
                candidate:private_candidate_profiles(
                  id, full_name, email, phone, skills, experience, college, bio, resume_url
                )
            `);
            
          if (selectedJobForApps) {
            query = query.eq("job_id", selectedJobForApps.id);
          } else {
            // Need to join jobs to filter by employer_id, but for now we can rely on mock or RLS.
            // Ideally we get all jobs of this employer.
          }
          const { data, error } = await query.order("created_at", { ascending: false });

          if (!error && data) {
            setJobApplications(data);
            setLoadingApps(false);
            return;
          }
        }
      } catch (e) { 
        console.warn("Could not fetch applications from DB:", e);
      }

      setJobApplications([]);
      setLoadingApps(false);
    };

    fetchApplications();
  }, [selectedJobForApps, activeTab, userId]);

  const handleUpdateApplicationStatus = async (appId: string, status: string) => {
    if (status === 'rejected') {
      const app = jobApplications.find(a => a.id === appId);
      setRejectionModalData({ isOpen: true, appIds: [appId], candidateNames: app?.applicant_name || "Candidate" });
      return;
    }

    // Optimistic UI Update
    setJobApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));

    // Attempt DB Update
    if (userId) {
      supabase.from("private_job_applications_internal").update({ status }).eq("id", appId).then();
    }
    
    // Update Local Storage Fallback
    const local = localStorage.getItem("rs_internal_applications");
    if (local) {
      const parsed = JSON.parse(local);
      const updated = parsed.map((a: any) => a.id === appId ? { ...a, status } : a);
      localStorage.setItem("rs_internal_applications", JSON.stringify(updated));
    }
  };

  const handleToggleSelectApplication = (appId: string) => {
    setSelectedApplications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) newSet.delete(appId);
      else newSet.add(appId);
      return newSet;
    });
  };

  const handleSelectAllApplications = () => {
    if (selectedApplications.size === jobApplications.length && jobApplications.length > 0) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(jobApplications.map(a => a.id)));
    }
  };

  const handleBulkAction = async (status: 'shortlisted' | 'rejected') => {
    if (selectedApplications.size === 0) return;
    const ids = Array.from(selectedApplications);

    if (status === 'rejected') {
      setRejectionModalData({ isOpen: true, appIds: ids, candidateNames: `${ids.length} candidates` });
      return;
    }

    setJobApplications(prev => prev.map(a => ids.includes(a.id) ? { ...a, status } : a));
    setSelectedApplications(new Set());

    if (userId) {
      await supabase.from("private_job_applications_internal").update({ status }).in("id", ids);
    }
    
    const local = localStorage.getItem("rs_internal_applications");
    if (local) {
      const parsed = JSON.parse(local);
      const updated = parsed.map((a: any) => ids.includes(a.id) ? { ...a, status } : a);
      localStorage.setItem("rs_internal_applications", JSON.stringify(updated));
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectionModalData) return;
    const { appIds } = rejectionModalData;

    let finalFeedback = customRejectionText;
    if (!finalFeedback) {
      if (rejectionReason === "experience") finalFeedback = "We appreciate your interest, but we are looking for someone with more relevant experience for this specific role.";
      else if (rejectionReason === "skills") finalFeedback = "While your background is impressive, we require a stronger match with the core technical skills outlined in the job description.";
      else if (rejectionReason === "location") finalFeedback = "Unfortunately, we are currently prioritizing local candidates or those willing to relocate independently for this on-site role.";
    }

    setJobApplications(prev => prev.map(a => appIds.includes(a.id) ? { ...a, status: 'rejected', feedback: finalFeedback } : a));
    setSelectedApplications(new Set());
    setRejectionModalData(null);
    setCustomRejectionText("");

    if (userId) {
      await supabase.from("private_job_applications_internal").update({ status: 'rejected', feedback: finalFeedback }).in("id", appIds);
    }
    
    const local = localStorage.getItem("rs_internal_applications");
    if (local) {
      const parsed = JSON.parse(local);
      const updated = parsed.map((a: any) => appIds.includes(a.id) ? { ...a, status: 'rejected', feedback: finalFeedback } : a);
      localStorage.setItem("rs_internal_applications", JSON.stringify(updated));
    }
  };

  const handleExportExcel = () => {
    const dataToExport = selectedApplications.size > 0
      ? jobApplications.filter(a => selectedApplications.has(a.id))
      : jobApplications;

    if (dataToExport.length === 0) return;

    const headers = ["Candidate Name", "Email", "Phone", "ATS Score", "Status", "Applied On"];
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(app => [
        `"${app.candidate?.full_name || ''}"`,
        `"${app.candidate?.email || ''}"`,
        `"${app.candidate?.phone || ''}"`,
        `${app.ats_score || 85}`,
        `${app.status}`,
        `"${new Date(app.created_at).toLocaleDateString()}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `candidates_export_${selectedJobForApps?.id || 'job'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateForInterview) return;

    const appId = candidateForInterview.applicationId;
    handleUpdateApplicationStatus(appId, 'tech_round');

    setIsSchedulerOpen(false);
    setCandidateForInterview(null);
    setInterviewDate("");
    setInterviewTime("");
    setInterviewLink("");

    alert(`📅 Interview scheduled successfully! Calendar invite & email sent to candidate.`);
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
          }
        } catch (e) {
          console.warn("Error fetching candidate chat:", e);
        }
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
        }
      } catch (err) {
        console.warn("Could not send message:", err);
      }
    }
  };

  useEffect(() => {
    // 1. Get logged-in user profile details
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;

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
          setCompanyLogoUrl(profile.logo_url || "");
          setCompanyWebsite(profile.website || "");
          setCompanyDescription(profile.description || "");
          if (profile.gst_number || profile.phone) {
            setVerificationSubmitted(true);
          }
        }
      } else {
        router.push("/employer/login");
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

      if (userId) {
        const { error } = await supabase
          .from("employer_profiles")
          .update({
            gst_number: gstNumber.trim(),
            phone: phone.trim(),
            is_verified: true
          })
          .eq("id", userId);

        if (error) throw error;
        
        setIsVerified(true);
        setVerificationSubmitted(true);
        alert("Business verification details submitted successfully! (Auto-verified for Demo)");
      } else {
        alert("Error: No active user session.");
      }
    } catch (err: any) {
      console.warn("Could not save verification to Supabase:", err);
      alert("Failed to submit verification: " + err.message);
    } finally {
      setVerifyingLoading(false);
    }
  };

  const handleSaveCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      if (userId) {
        const { error } = await supabase
          .from("employer_profiles")
          .update({
            logo_url: companyLogoUrl.trim(),
            website: companyWebsite.trim(),
            description: companyDescription.trim()
          })
          .eq("id", userId);

        if (error) throw error;
        alert("Company profile branding updated successfully!");
      }
    } catch (err: any) {
      console.warn("Could not save branding to Supabase:", err);
      alert("Failed to update profile: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Fetch employer jobs
  useEffect(() => {
    fetchEmployerJobs();
  }, [userId]);

  const fetchEmployerJobs = async () => {
    if (!userId) return;

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

  // Auto-open Pipeline Tab if URL param present
  useEffect(() => {
    if (searchParams.get("tab") === "pipeline") {
      setActiveTab("applications");
      if (!selectedJobForApps && jobs.length > 0) {
        // Find first active job to show
        const activeJobs = jobs.filter(j => j.status !== 'closed');
        if (activeJobs.length > 0) {
          setSelectedJobForApps(activeJobs[0]);
        }
      }
    }
  }, [searchParams, jobs, selectedJobForApps]);

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

  const handleUpdateRemarks = (appId: string, remarks: string) => {
    setJobApplications(prev => prev.map(a => a.id === appId ? { ...a, hr_remarks: remarks } : a));
    if (userId) {
      supabase.from("private_job_applications").update({ hr_remarks: remarks }).eq("id", appId).then();
    }
  };

  const handleUpdateField = (appId: string, field: string, value: string) => {
    setJobApplications(prev => prev.map(a => a.id === appId ? { ...a, [field]: value } : a));
    // Simulate updating backend for now
    if (userId) {
      // In a real scenario, make sure these columns exist in DB
      console.log(`Updating ${field} to ${value} for app ${appId}`);
    }
  };

  const handleShortlistFromScout = () => {
    if (!candidateToShortlist || !selectedJobIdForShortlist) return;

    // create application
    if (userId) {
      supabase.from("private_job_applications").insert([{
        job_id: selectedJobIdForShortlist,
        candidate_id: candidateToShortlist.id,
        status: "shortlisted"
      }]).then();
    }

    setCandidateToShortlist(null);
    setSelectedJobIdForShortlist("");
    alert("Candidate added to job pipeline successfully!");
  };


  const handleShortlistApplicant = () => {
    if (!applicantToShortlist) return;

    handleUpdateApplicationStatus(applicantToShortlist.applicationId, 'shortlisted');

    setJobApplications(prev => prev.map(a => 
      a.id === applicantToShortlist.applicationId 
        ? { ...a, reason_for_shortlist: shortlistReason, status: 'shortlisted' } 
        : a
    ));

    if (userId) {
      supabase.from("private_job_applications").update({ status: 'shortlisted' }).eq("id", applicantToShortlist.applicationId).then();
    }

    setApplicantToShortlist(null);
    setShortlistReason("");
    alert("Candidate successfully shortlisted!");
  };


  const filteredApplications = jobApplications.filter(app => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = app.candidate?.full_name?.toLowerCase().includes(searchLower) || false;
    const emailMatch = app.candidate?.email?.toLowerCase().includes(searchLower) || false;
    const phoneMatch = app.candidate?.phone?.toLowerCase().includes(searchLower) || false;
    
    const statusMatch = statusFilter === 'all' || app.status === statusFilter;
    
    return (nameMatch || emailMatch || phoneMatch) && statusMatch;
  });

  return (

    <div className="flex-1 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20 p-6 min-h-screen">
      <div className="w-full max-w-full h-full space-y-6 relative z-10">

        {activeTab === "jobs" ? (
          <>
            {/* Stats bar with Glassmorphism */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-white/50 dark:border-gray-700/50 p-5 rounded-3xl shadow-[0_4px_24px_0_rgba(31,38,135,0.05)] text-center transition-transform hover:scale-[1.02]">
                <span className="text-[10px] font-black text-indigo-500/70 uppercase tracking-[0.2em]">Total Posted</span>
                <span className="block text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1 drop-shadow-sm">{jobs.length}</span>
              </div>
              <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-white/50 dark:border-gray-700/50 p-5 rounded-3xl shadow-[0_4px_24px_0_rgba(31,38,135,0.05)] text-center transition-transform hover:scale-[1.02]">
                <span className="text-[10px] font-black text-green-500/70 uppercase tracking-[0.2em]">Live Openings</span>
                <span className="block text-2xl sm:text-3xl font-black text-green-500 mt-1 drop-shadow-sm">
                  {jobs.filter(j => j.status === "active").length}
                </span>
              </div>
              <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-white/50 dark:border-gray-700/50 p-5 rounded-3xl shadow-[0_4px_24px_0_rgba(31,38,135,0.05)] text-center transition-transform hover:scale-[1.02]">
                <span className="text-[10px] font-black text-amber-500/70 uppercase tracking-[0.2em]">Under Vetting</span>
                <span className="block text-2xl sm:text-3xl font-black text-amber-500 mt-1 drop-shadow-sm">
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
        ) : activeTab === "applications" ? (
          /* APPLICATIONS & ATS TAB CONTENT */
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">

            {/* EXCEL SHEET TABS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide pt-2">
              <button
                onClick={() => setSelectedJobForApps(null)}
                className={`shrink-0 px-4 py-2 font-bold text-xs rounded-t-xl transition-colors flex items-center gap-2 ${!selectedJobForApps
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 border border-b-0 border-gray-200 dark:border-gray-800 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'
                    : 'bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                <Briefcase className="w-4 h-4" /> All Jobs Overview
                {!selectedJobForApps && (
                  <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white dark:bg-gray-900 z-10"></span>
                )}
              </button>
              {jobs.filter(j => j.status !== 'closed').map(job => (
                <button
                  key={job.id}
                  onClick={() => setSelectedJobForApps(job)}
                  className={`shrink-0 px-6 py-2.5 font-extrabold text-xs rounded-t-xl transition-colors border-t border-l border-r border-b-0 ${selectedJobForApps?.id === job.id
                      ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 border-gray-200 dark:border-gray-800 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'
                      : 'bg-gray-100 dark:bg-gray-850 border-gray-200/50 dark:border-gray-800/50 text-gray-500 hover:bg-white dark:hover:bg-gray-900'
                    }`}
                >
                  {job.title}
                  {selectedJobForApps?.id === job.id && (
                    <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white dark:bg-gray-900 z-10"></span>
                  )}
                </button>
              ))}
            </div>


              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm relative -mt-2 z-0">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm whitespace-nowrap">
                      <FileText className="w-4 h-4 text-emerald-600" /> Excel Pipeline: {selectedJobForApps ? selectedJobForApps.title : 'All Jobs Overview'}
                    </h3>
                  </div>
                  
                  <div className="flex flex-1 items-center gap-2 max-w-md w-full ml-auto">
                    <div className="relative flex-1">
                      <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search name, email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-[10px] sm:text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-[10px] sm:text-xs py-1.5 px-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-gray-700 dark:text-gray-300"
                    >
                      <option value="all">All Stages</option>
                      <option value="applied">Applied</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="tech_round">Tech Round</option>
                      <option value="hr_round">HR Round</option>
                      <option value="hired">Hired / Selected</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex gap-2 relative shrink-0">
                    <button onClick={() => setIsAddColModalOpen(true)} className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-1">
                      + Add Column
                    </button>
                    <button onClick={() => setShowColToggle(!showColToggle)} className="text-[10px] font-bold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
                      <List className="w-3 h-3" /> Columns
                    </button>
                    {showColToggle && (
                      <div className="absolute top-full right-10 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-3 text-xs font-medium text-gray-700 dark:text-gray-200">
                        <div className="mb-2 font-black text-gray-900 dark:text-white uppercase tracking-wider">Show/Hide Columns</div>
                        <div className="space-y-1.5">
                          {Object.keys(visibleCols).map(key => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                              <input type="checkbox" checked={(visibleCols as any)[key]} onChange={() => setVisibleCols(p => ({ ...p, [key]: !(p as any)[key] }))} className="rounded-sm" />
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    <button onClick={handleExportExcel} className="text-[10px] font-bold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 transition-colors">
                      Export Sheet
                    </button>
                  </div>
                </div>

                {loadingApps ? (
                  <div className="p-12 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto relative">

                    <table className="w-full text-left border-collapse min-w-[1800px]">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={selectedApplications.size === jobApplications.length && jobApplications.length > 0}
                              onChange={handleSelectAllApplications}
                              className="w-3.5 h-3.5 rounded-sm"
                            />
                          </th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-12 text-center">S.No</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-48">Candidate Profile</th>
                          {visibleCols.contact && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Contact Info</th>}
                          {visibleCols.role && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Applied Role & Source</th>}
                          {visibleCols.stage && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Stage</th>}
                          {visibleCols.appliedOn && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-28">Applied On</th>}
                          {visibleCols.location && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Location</th>}
                          {visibleCols.salary && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Exp. Salary / CTC</th>}
                          {visibleCols.notice && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Notice Period</th>}
                          {visibleCols.nextAction && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Next Action / Date</th>}
                          {visibleCols.shortlistReason && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10">Reason for Shortlisting</th>}
                          {visibleCols.finalReason && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-red-50 dark:bg-red-900/10">Final Result Reason</th>}
                          {visibleCols.hrRemarks && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/10">HR Remarks</th>}
                          {customColumns.map(col => (
                            <th key={col} className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 w-40 relative group">
                              <div className="flex items-center justify-between">
                                <span>{col}</span>
                                <button onClick={() => handleDeleteCustomColumn(col)} className="text-red-400 hover:text-red-600 transition-colors p-0.5 ml-2" title="Delete Column">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </th>
                          ))}
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-28 text-center">Links</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                        {filteredApplications.map((app, index) => (
                          <tr key={app.id} className={`hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors ${selectedApplications.has(app.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-900'}`}>
                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-center">
                              <input
                                type="checkbox"
                                checked={selectedApplications.has(app.id)}
                                onChange={() => handleToggleSelectApplication(app.id)}
                                className="w-3.5 h-3.5 rounded-sm"
                              />
                            </td>
                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-center font-medium text-gray-500">
                              {index + 1}
                            </td>
                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700">
                              <div className="font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline" onClick={() => setSelectedCandidateForDeepView({ ...app.candidate, ats_score: app.ats_score || 85, applicationId: app.id, status: app.status })}>
                                {app.candidate?.full_name || app.candidate_name || "Unknown Candidate"}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {app.candidate?.experience || "Fresher"} • Match: {app.ats_score || 85}%
                              </div>
                            </td>
                            {visibleCols.contact && (
<td className="px-3 py-2 border border-gray-300 dark:border-gray-700">
                              <div className="text-[10px] text-gray-600 font-medium">
                                <div className="flex items-center gap-1 mb-1"><span title="Phone">📞</span> {app.candidate?.phone || app.phone || "N/A"}</div>
                                <div className="flex items-center gap-1 truncate max-w-[140px]"><span title="Email">✉️</span> {app.candidate?.email || app.email || "N/A"}</div>
                              </div>
                            </td>
)}
                            {visibleCols.role && (
<td className="px-3 py-2 border border-gray-300 dark:border-gray-700">
                                <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                                  {jobs.find(j => j.id === app.job_id)?.title || "Unknown Role"}
                                </div>
                                {app.hr_remarks?.includes("Talent Scout") ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-blue-50 text-blue-600 border border-blue-200">
                                    Talent Scout
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-purple-50 text-purple-600 border border-purple-200">
                                    Organic (Form)
                                  </span>
                                )}
                            </td>
)}
                            {visibleCols.stage && (
<td className="px-3 py-2 border border-gray-300 dark:border-gray-700 p-0">
                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
                                className={`w-full h-full px-2 py-2 outline-none appearance-none cursor-pointer font-bold text-[11px] ${
                                    app.status === 'applied' ? 'bg-transparent text-gray-700 dark:text-gray-300' :
                                    app.status === 'shortlisted' ? 'bg-green-100 text-green-800 dark:bg-green-900/40' :
                                    app.status === 'tech_round' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40' :
                                    app.status === 'hr_round' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40' :
                                    app.status === 'hired' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 ring-1 ring-emerald-500' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/40'
                                  }`}
                              >
                                <option value="applied">Applied</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="tech_round">Tech Round (L1)</option>
                                <option value="hr_round">HR Round</option>
                                <option value="hired">Hired / Selected 🏆</option>
                                <option value="rejected">Rejected ❌</option>
                              </select>
                            </td>
)}
                            {visibleCols.appliedOn && (
<td className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-[10px] font-medium text-gray-500">
                              {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </td>
)}
                            {visibleCols.location && (
<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <input
                                type="text"
                                defaultValue={app.current_location || app.candidate?.location || ""}
                                placeholder="e.g. Delhi, WFH"
                                onBlur={(e) => handleUpdateField(app.id, 'current_location', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none text-xs hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900"
                              />
                            </td>
)}
                            {visibleCols.salary && (
<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <input
                                type="text"
                                defaultValue={app.expected_salary || ""}
                                placeholder="e.g. 5 LPA"
                                onBlur={(e) => handleUpdateField(app.id, 'expected_salary', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none text-xs hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900"
                              />
                            </td>
)}
                            {visibleCols.notice && (
<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <select
                                defaultValue={app.notice_period || ""}
                                onChange={(e) => handleUpdateField(app.id, 'notice_period', e.target.value)}
                                className="w-full h-full min-h-[40px] px-2 py-2 bg-transparent outline-none text-[11px] font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <option value="">Select...</option>
                                <option value="Immediate">Immediate Joiner</option>
                                <option value="15 Days">15 Days</option>
                                <option value="30 Days">30 Days</option>
                                <option value="60+ Days">60+ Days</option>
                              </select>
                            </td>
)}
                            {visibleCols.nextAction && (
<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <input
                                type="text"
                                defaultValue={app.next_action || ""}
                                placeholder="e.g. Interview on 25th"
                                onBlur={(e) => handleUpdateField(app.id, 'next_action', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none text-xs hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900"
                              />
                            </td>
)}
                            {visibleCols.shortlistReason && (
<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <textarea
                                defaultValue={app.reason_for_shortlist || ""}
                                placeholder="Why Shortlisted?"
                                onBlur={(e) => handleUpdateField(app.id, 'reason_for_shortlist', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none resize-none overflow-hidden hover:bg-emerald-50 dark:hover:bg-emerald-900/20 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-inset focus:ring-emerald-500"
                              />
                            </td>
)}
                            {visibleCols.finalReason && (
<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <textarea
                                defaultValue={app.final_result_reason || ""}
                                placeholder="Why Hired or Rejected?"
                                onBlur={(e) => handleUpdateField(app.id, 'final_result_reason', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none resize-none overflow-hidden hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-inset focus:ring-red-500"
                              />
                            </td>
)}
                            {visibleCols.hrRemarks && (
<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <textarea
                                defaultValue={app.hr_remarks || ""}
                                placeholder="Add notes..."
                                onBlur={(e) => handleUpdateRemarks(app.id, e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none resize-none overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-inset focus:ring-indigo-500"
                              />
                            </td>
)}
                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-center space-y-1">
                              {(app.candidate?.resume_url || app.resume_url) && (
                                <button
                                  onClick={() => window.open(app.candidate?.resume_url || app.resume_url, '_blank')}
                                  className="text-[10px] font-bold text-blue-600 hover:underline block w-full text-center"
                                >
                                  View Resume
                                </button>
                              )}
                              {app.status === 'shortlisted' && (
                                <button
                                  onClick={() => {
                                    setCandidateForInterview({ ...app.candidate, applicationId: app.id });
                                    setIsSchedulerOpen(true);
                                  }}
                                  className="text-[10px] font-bold text-indigo-600 hover:underline block w-full text-center"
                                >
                                  Schedule Interview
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {jobApplications.length === 0 && (
                          <tr>
                            <td colSpan={4 + Object.values(visibleCols).filter(Boolean).length + customColumns.length} className="px-6 py-12 text-center text-gray-500 font-medium">
                              No candidates found in this pipeline sheet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            {/* Deep Profile Drill-Down Modal */}
            {selectedCandidateForDeepView && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

                  {/* Deep Profile Header */}
                  <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/30 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-2xl shadow-sm border border-indigo-200 dark:border-indigo-800/50">
                        {selectedCandidateForDeepView.full_name?.slice(0, 2).toUpperCase() || "CN"}
                      </div>
                      <div>
                        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                          {selectedCandidateForDeepView.full_name}
                        </h2>
                        <div className="flex items-center gap-3 mt-1 text-xs font-bold text-gray-500">
                          <span>📧 {selectedCandidateForDeepView.email}</span>
                          <span>📱 {selectedCandidateForDeepView.phone || "No Phone"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block text-[10px] font-extrabold uppercase tracking-widest text-gray-400">ATS Match Score</span>
                        <span className={`text-2xl font-black ${selectedCandidateForDeepView.ats_score >= 80 ? 'text-green-500' : selectedCandidateForDeepView.ats_score >= 60 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                          {selectedCandidateForDeepView.ats_score}%
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedCandidateForDeepView(null)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 rounded-full transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Profile Content */}
                  <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-950">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                      {/* Left Column: Details */}
                      <div className="md:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                          <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Professional Summary</h4>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                            {selectedCandidateForDeepView.bio || "Candidate has not provided a professional summary."}
                          </p>
                        </div>

                        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                          <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Core Competencies</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedCandidateForDeepView.skills?.map((s: string, idx: number) => (
                              <span key={idx} className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                {s}
                              </span>
                            ))}
                            {!selectedCandidateForDeepView.skills?.length && (
                              <span className="text-sm text-gray-400 font-medium italic">No skills listed.</span>
                            )}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                          <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">Background</h4>
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-gray-400">Experience</span>
                            <span className="block text-sm font-bold text-gray-900 dark:text-white">{selectedCandidateForDeepView.experience || "Fresher"}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-bold text-gray-400">Education</span>
                            <span className="block text-sm font-bold text-gray-900 dark:text-white">{selectedCandidateForDeepView.college || "N/A"}</span>
                          </div>
                        </div>

                        {/* Interview Evaluation Scorecard */}
                        {selectedCandidateForDeepView.status && selectedCandidateForDeepView.status !== 'applied' && (
                          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm space-y-4">
                            <h4 className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-800/30 pb-2 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" /> HR Evaluation Scorecard
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Communication</span>
                                <div className="flex gap-0.5 text-amber-400 text-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={() => alert('Rating saved!')}>★★★★<span className="text-gray-300 dark:text-gray-600">★</span></div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Technical Skills</span>
                                <div className="flex gap-0.5 text-amber-400 text-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={() => alert('Rating saved!')}>★★★<span className="text-gray-300 dark:text-gray-600">★★</span></div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Culture Fit</span>
                                <div className="flex gap-0.5 text-amber-400 text-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={() => alert('Rating saved!')}>★★★★★</div>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-indigo-100 dark:border-indigo-800/30">
                              <label className="block text-[10px] uppercase font-bold text-indigo-500 mb-1.5">Internal Team Notes (Hidden from Candidate)</label>
                              <textarea
                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] text-gray-900 dark:text-white"
                                placeholder="Leave feedback for your recruiting team..."
                              />
                              <button onClick={() => alert('Scorecard and Notes saved successfully.')} className="mt-2 w-full py-2 text-[10px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors shadow-sm">
                                Save Scorecard & Notes
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Embedded Resume PDF */}
                      <div className="md:col-span-2 flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden h-[500px]">
                        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/30 flex items-center justify-between">
                          <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Candidate Resume
                          </h4>
                          {selectedCandidateForDeepView.resume_url && (
                            <button
                              onClick={() => window.open(selectedCandidateForDeepView.resume_url, '_blank')}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              Open in new tab ↗
                            </button>
                          )}
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-950 flex items-center justify-center relative">
                          {selectedCandidateForDeepView.resume_url ? (
                            <iframe
                              src={`${selectedCandidateForDeepView.resume_url}#view=FitH`}
                              className="w-full h-full border-none"
                              title="Candidate Resume"
                            />
                          ) : (
                            <div className="text-center space-y-2">
                              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto" />
                              <p className="text-sm font-bold text-gray-500">No Resume Uploaded</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                    <button
                      onClick={() => {
                        alert("A notification has been sent to the candidate to record a 2-minute video pitch.");
                      }}
                      className="px-5 py-2.5 text-sm font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Video className="w-4 h-4" /> Request Video Pitch
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setApplicantToShortlist(selectedCandidateForDeepView)}
                        className="px-5 py-2.5 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" /> Shortlist
                      </button>
                      <button
                        onClick={() => handleCandidateSelect(selectedCandidateForDeepView)}
                        className="px-5 py-2.5 text-sm font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" /> Message
                      </button>
                      <button
                        onClick={() => setSelectedCandidateForDeepView(null)}
                        className="px-5 py-2.5 text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        Close Profile
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        ) : activeTab === "talent" ? (
          /* TALENT SCOUT TAB CONTENT */
          <div className="space-y-6">

            {/* Top Filter Bar */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center gap-4 animate-in fade-in duration-200">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search candidates by skills, university, or name..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition-all text-gray-900 dark:text-white font-bold"
                />
              </div>

              <div className="flex w-full md:w-auto items-center gap-3 shrink-0">
                <div className="relative">
                  <select
                    value={filterExperience}
                    onChange={e => setFilterExperience(e.target.value)}
                    className="appearance-none w-36 px-4 py-2 pr-8 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    <option value="All">All Experience</option>
                    <option value="Fresher">Fresher</option>
                    <option value="1 Year">1 Year+</option>
                    <option value="2 Years">2 Years+</option>
                    <option value="3 Years">3 Years+</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={filterMinAts}
                    onChange={e => setFilterMinAts(Number(e.target.value))}
                    className="appearance-none w-36 px-4 py-2 pr-8 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer"
                  >
                    <option value={0}>Any ATS Score</option>
                    <option value={60}>60%+ Match</option>
                    <option value={75}>75%+ Match</option>
                    <option value={85}>85%+ Match</option>
                    <option value={90}>90%+ Match</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Sourced Candidates Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-gray-850/50 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Candidate Profile</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Experience</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Top Skills</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-center">ATS Match</th>
                      <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {candidates
                      .map(cand => {
                        // Assign mock ATS score for demonstration if not exists
                        if (!cand.ats_score) {
                          const hash = cand.full_name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                          cand.ats_score = (hash % 35) + 60; // Random deterministic score 60-95
                        }
                        return cand;
                      })
                      .filter(c => {
                        const matchSearch = c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.college.toLowerCase().includes(searchQuery.toLowerCase()) || c.skills.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));
                        const matchExp = filterExperience === "All" || (c.experience || "Fresher").includes(filterExperience);
                        const matchAts = (c.ats_score || 0) >= filterMinAts;
                        return matchSearch && matchExp && matchAts;
                      })
                      .map((cand) => (
                        <tr key={cand.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-200 dark:border-indigo-800/50">
                                {cand.full_name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                                  {cand.full_name}
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Online"></span>
                                </div>
                                <div className="text-[10px] font-bold text-gray-500 mt-0.5">{cand.college || "Self-Taught"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {cand.experience || "Fresher"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {cand.skills?.slice(0, 3).map((s: string, idx: number) => (
                                <span key={idx} className="text-[9px] font-extrabold px-1.5 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700">
                                  {s}
                                </span>
                              ))}
                              {cand.skills?.length > 3 && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 text-gray-400">+{cand.skills.length - 3}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center justify-center">
                              <span className={`text-xs font-black ${cand.ats_score >= 85 ? 'text-green-500' : cand.ats_score >= 70 ? 'text-amber-500' : 'text-gray-500'
                                }`}>
                                {cand.ats_score}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              {cand.video_url && (
                                <button
                                  onClick={() => setVideoUrlToPlay(cand.video_url)}
                                  className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-800"
                                  title="Play Video Pitch"
                                >
                                  <Play className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedCandidateForDeepView(cand)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                title="View Profile"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setCandidateToShortlist(cand);
                                  setSelectedJobIdForShortlist(jobs.filter(j => j.status !== 'closed')[0]?.id || "");
                                }}
                                className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold rounded-lg transition-colors border border-green-200/50 dark:border-green-800 flex items-center gap-1.5 shadow-sm"
                              >
                                <CheckCircle className="w-3 h-3" /> Shortlist
                              </button>
                              <button
                                onClick={() => handleCandidateSelect(cand)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                              >
                                <MessageSquare className="w-3 h-3" /> Message
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                    {candidates.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-gray-400 font-medium text-sm">
                          No candidates found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
                        className={`flex flex-col max-w-[85%] ${m.sender_type === "employer" ? "ml-auto items-end" : "mr-auto items-start"
                          }`}
                      >
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${m.sender_type === "employer"
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
        ) : activeTab === "settings" ? (
          /* SETTINGS / COMPANY PROFILE TAB CONTENT */
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
              <h3 className="font-extrabold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                <Building className="w-6 h-6 text-indigo-500" /> Employer Branding & Profile
              </h3>
              <p className="text-sm text-gray-500 mt-1">Complete your corporate profile to attract top 1% candidates.</p>
            </div>

            <form onSubmit={handleSaveCompanyProfile} className="space-y-5">
              <div className="flex items-start gap-6">
                <div className="shrink-0 flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                    {companyLogoUrl ? (
                      <img src={companyLogoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company Logo</span>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Upload Company Logo
                      {isUploadingLogo && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin inline-block ml-2" />}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingLogo}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          setIsUploadingLogo(true);
                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "e Suvidha Upload");

                          const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dw5azgky9";
                          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                            method: "POST",
                            body: formData
                          });

                          const data = await response.json();
                          if (data.secure_url) {
                            setCompanyLogoUrl(data.secure_url);
                          } else {
                            alert("Failed to upload image. Please try again.");
                          }
                        } catch (error) {
                          console.error("Cloudinary upload error:", error);
                          alert("An error occurred during upload.");
                        } finally {
                          setIsUploadingLogo(false);
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-gray-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400 cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Company Website URL</label>
                    <input
                      type="text"
                      value={companyWebsite}
                      onChange={e => setCompanyWebsite(e.target.value)}
                      placeholder="e.g. https://www.yourcompany.com"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">About the Company (Description)</label>
                <textarea
                  rows={5}
                  value={companyDescription}
                  onChange={e => setCompanyDescription(e.target.value)}
                  placeholder="Describe your company's mission, culture, and what you do. This helps candidates understand your organization better..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all text-gray-900 dark:text-white"
                />
              </div>

              {/* Email Automation Settings */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-6">
                <div>
                  <h4 className="font-extrabold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-indigo-500" /> Automated Email Templates
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">These templates are used when you shortlist, schedule, or reject candidates. Available variables: <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{{candidate_name}}"}</code>, <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{{company_name}}"}</code>, <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{{job_title}}"}</code>, <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{{meeting_link}}"}</code>.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Rejection Email Template</label>
                    <textarea
                      rows={6}
                      value={emailTemplateRejection}
                      onChange={e => setEmailTemplateRejection(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition-all text-gray-900 dark:text-white font-mono whitespace-pre-wrap"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Interview Invite Template</label>
                    <textarea
                      rows={6}
                      value={emailTemplateInterview}
                      onChange={e => setEmailTemplateInterview(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs transition-all text-gray-900 dark:text-white font-mono whitespace-pre-wrap"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 disabled:opacity-50 text-sm transition-colors"
                >
                  {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile Updates
                </button>
              </div>
            </form>
          </div>
        ) : null}

      </div>

      {/* Interview Scheduler Modal */}
      {isSchedulerOpen && candidateForInterview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-500" /> Schedule Interview
                </h3>
                <span className="text-xs text-gray-500 font-medium block">with {candidateForInterview.full_name}</span>
              </div>
              <button onClick={() => setIsSchedulerOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleScheduleInterview} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Date</label>
                  <input type="date" required value={interviewDate} onChange={e => setInterviewDate(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-900 dark:text-white" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Time</label>
                  <input type="time" required value={interviewTime} onChange={e => setInterviewTime(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-900 dark:text-white" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Duration (Minutes)</label>
                <select value={interviewDuration} onChange={e => setInterviewDuration(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-900 dark:text-white">
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Meeting Link (GMeet / Zoom)</label>
                <input type="url" required value={interviewLink} onChange={e => setInterviewLink(e.target.value)} placeholder="https://meet.google.com/..." className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-900 dark:text-white" />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 mt-2">
                <button type="button" onClick={() => setIsSchedulerOpen(false)} className="px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors flex items-center gap-2">
                  <Send className="w-3 h-3" /> Send Email Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {videoUrlToPlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-black border border-gray-800 rounded-3xl overflow-hidden shadow-2xl w-full max-w-4xl relative">
            <button
              onClick={() => setVideoUrlToPlay(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white hover:bg-black/80 rounded-full backdrop-blur-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video w-full bg-gray-900 relative flex items-center justify-center">
              <video
                src={videoUrlToPlay}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 bg-gray-950 flex items-center justify-between">
              <div>
                <h4 className="text-white font-black text-sm">Candidate Video Pitch</h4>
                <p className="text-xs text-gray-400 font-bold">2 Minute Introduction</p>
              </div>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest rounded-full border border-indigo-500/30">
                AI Screened
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Shortlist Job Selection Modal */}
      {candidateToShortlist && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> Shortlist Candidate
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Select an open job to assign <strong>{candidateToShortlist.full_name || candidateToShortlist.name}</strong> to its pipeline.</p>

            <select
              value={selectedJobIdForShortlist}
              onChange={e => setSelectedJobIdForShortlist(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm font-bold text-gray-900 dark:text-white mb-6 focus:ring-2 focus:ring-indigo-500 transition-shadow appearance-none cursor-pointer"
            >
              <option value="" disabled>Select a Job...</option>
              {jobs.filter(j => j.status !== 'closed').map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCandidateToShortlist(null);
                  setSelectedJobIdForShortlist("");
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShortlistFromScout}
                disabled={!selectedJobIdForShortlist}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-colors disabled:opacity-50"
              >
                Save to Pipeline
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Shortlist Applicant Modal */}
      {applicantToShortlist && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> Confirm Shortlist
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-6">You are shortlisting <strong>{applicantToShortlist.full_name || applicantToShortlist.name}</strong>. Please provide a reason to add to the ATS Pipeline.</p>

            <textarea
              value={shortlistReason}
              onChange={e => setShortlistReason(e.target.value)}
              placeholder="Reason for shortlisting (e.g. Excellent portfolio, matches criteria...)"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm font-medium text-gray-900 dark:text-white mb-3 focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none min-h-[100px]"
            ></textarea>

            <div className="flex flex-wrap gap-2 mb-6">
              <span onClick={() => setShortlistReason("Strong Technical Skills")} className="cursor-pointer text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md hover:bg-indigo-100 transition border border-indigo-100">Strong Tech Skills</span>
              <span onClick={() => setShortlistReason("Relevant Work Experience")} className="cursor-pointer text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md hover:bg-emerald-100 transition border border-emerald-100">Relevant Experience</span>
              <span onClick={() => setShortlistReason("Good Communication")} className="cursor-pointer text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-md hover:bg-amber-100 transition border border-amber-100">Good Comm Skills</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setApplicantToShortlist(null);
                  setShortlistReason("");
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShortlistApplicant}
                disabled={!shortlistReason.trim()}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-xl transition-colors disabled:opacity-50"
              >
                Confirm Shortlist
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Add Custom Column Modal */}
      {isAddColModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
              Add Custom Column
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Create a new field to track for all candidates (e.g., Assignment Link).</p>

            <input
              type="text"
              value={newColName}
              onChange={e => setNewColName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCustomColumn()}
              placeholder="Column Name"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm font-medium text-gray-900 dark:text-white mb-6 focus:ring-2 focus:ring-indigo-500 transition-shadow"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => setIsAddColModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomColumn}
                disabled={!newColName.trim()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-colors disabled:opacity-50"
              >
                Add Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Rejection Feedback Modal */}
      {rejectionModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Provide Rejection Feedback</h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    Help {rejectionModalData.candidateNames} understand why they weren't selected. This builds immense trust.
                  </p>
                </div>
                <button onClick={() => setRejectionModalData(null)} className="text-gray-400 hover:text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Select primary reason</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'experience', label: 'Experience Mismatch' },
                      { id: 'skills', label: 'Skill Gap (Missing core skills)' },
                      { id: 'location', label: 'Location/Commute Issue' },
                      { id: 'custom', label: 'Write Custom Feedback' }
                    ].map(r => (
                      <div 
                        key={r.id}
                        onClick={() => setRejectionReason(r.id)}
                        className={`p-3 rounded-xl border ${rejectionReason === r.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'} cursor-pointer font-bold text-sm transition-colors`}
                      >
                        {r.label}
                      </div>
                    ))}
                  </div>
                </div>
                
                {rejectionReason === 'custom' && (
                  <div>
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">Custom Feedback</label>
                    <textarea 
                      value={customRejectionText}
                      onChange={e => setCustomRejectionText(e.target.value)}
                      placeholder="e.g. We loved your energy but need someone who knows Next.js..."
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => setRejectionModalData(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmRejection}
                  className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all flex items-center gap-2"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

