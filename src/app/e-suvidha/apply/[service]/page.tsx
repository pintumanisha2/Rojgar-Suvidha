"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase, getStoredSession } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, ShieldCheck, AlertCircle, FileText, UploadCloud, AlertTriangle, Smartphone, Clock, Copy, QrCode, Camera, X, CheckCircle } from "lucide-react";
import imageCompression from "browser-image-compression";
import { SERVICE_INFO_DB } from "@/lib/eSuvidhaContent";
import { useToast } from "@/components/ui/Toast";



// Database of Services
const SERVICE_DB: Record<string, { title: string; price: number; docsRequired: string[]; docsOptional?: string[]; extraFields: string[] }> = {
  "pan-new": {
    title: "New PAN Card",
    price: 150,
    docsRequired: ["Aadhaar Card (Front / Full PDF)", "Passport Size Photo", "Signature (On white paper)"],
    docsOptional: ["Aadhaar Card (Back)"],
    extraFields: ["Father's Full Name (MANDATORY for PAN)"]
  },
  "pan-correction": {
    title: "PAN Card Correction",
    price: 150,
    docsRequired: ["Aadhaar Card (Front / Full PDF)", "Old PAN Card Copy", "Proof of Correction (e.g., 10th Marksheet)"],
    docsOptional: ["Aadhaar Card (Back)"],
    extraFields: ["Father's Name", "Exactly what needs correction? (e.g., DOB to 12/05/2000)"]
  },
  "voter-new": {
    title: "New Voter ID",
    price: 100,
    docsRequired: ["Aadhaar Card (Front / Full PDF)", "Passport Size Photo", "Age Proof (10th Marksheet / Birth Cert)"],
    docsOptional: ["Aadhaar Card (Back)"],
    extraFields: ["Father/Husband Name", "Exact Village/City Name"]
  },
  "eshram": {
    title: "E-Shram Card",
    price: 80,
    docsRequired: ["Aadhaar Card (Front / Full PDF)", "Bank Passbook"],
    docsOptional: ["Aadhaar Card (Back)"],
    extraFields: ["Aadhaar Linked Mobile Number", "Occupation (e.g., Farmer, Labour, Tailor)"]
  },
  "ayushman": {
    title: "Ayushman Bharat Card",
    price: 100,
    docsRequired: ["Aadhaar Card (Front / Full PDF)"],
    docsOptional: ["Aadhaar Card (Back)", "Ration Card (If available)"],
    extraFields: ["Aadhaar Linked Mobile Number"]
  },
  "passport": {
    title: "Passport Appointment",
    price: 300,
    docsRequired: ["Aadhaar Card (Front / Full PDF)", "10th Marksheet", "PAN Card / Voter ID"],
    docsOptional: ["Aadhaar Card (Back)"],
    extraFields: ["Nearest Passport Office (City)", "Marital Status"]
  },
  "pcc": {
    title: "Police Clearance (Character Cert)",
    price: 200,
    docsRequired: ["Aadhaar Card (Front / Full PDF)", "Passport Size Photo"],
    docsOptional: ["Aadhaar Card (Back)"],
    extraFields: ["Father's Name", "Purpose of PCC (e.g., Job, Visa, Zomato)"]
  },
  "udyam": {
    title: "Udyam Aadhaar (MSME)",
    price: 200,
    docsRequired: ["Aadhaar Card (Front / Full PDF)", "PAN Card", "Bank Passbook"],
    docsOptional: ["Aadhaar Card (Back)"],
    extraFields: ["Business / Shop Name", "Business Start Date", "Type of Business (e.g., Kirana, Clothing, IT)"]
  },
  "itr-nil": {
    title: "ITR Filing (Nil Return)",
    price: 300,
    docsRequired: ["Aadhaar Card (Front / Full PDF)", "PAN Card", "Bank Passbook Front Page"],
    docsOptional: ["Aadhaar Card (Back)"],
    extraFields: ["Father's Name", "Income Source (e.g., Student, Small shop)", "Mobile linked to Aadhaar"]
  },
  "resume-cv": {
    title: "Professional Resume / CV Making",
    price: 99,
    docsRequired: ["Passport Size Photo"],
    extraFields: ["Highest Qualification (e.g., B.Tech, 12th Pass)", "Total Experience (or Fresher)", "Skills (e.g., Typing, Tally, Java)"]
  },
  "admit-card": {
    title: "Admit Card / Result Download",
    price: 30,
    docsRequired: [],
    extraFields: ["Exam Name (e.g., SSC CGL, Bihar Police)", "Registration No. / Roll No.", "Date of Birth (DOB) or Password"]
  },
  // ── NEWLY ADDED SERVICES ──────────────────────────────────────
  "aadhaar-pvc": {
    title: "Order Aadhaar PVC Card",
    price: 100,
    docsRequired: ["Aadhaar Card (Front / Full PDF)"],
    docsOptional: ["Aadhaar Card (Back)"],
    extraFields: ["Aadhaar Linked Mobile Number", "Aadhaar Number (12 digits)"]
  },
  "income-cert": {
    title: "Income Certificate (Aay Praman Patra)",
    price: 100,
    docsRequired: ["Aadhaar Card (Front / Full PDF)", "Ration Card / Family ID", "Bank Passbook Front Page"],
    docsOptional: ["Aadhaar Card (Back)"],
    extraFields: ["Father's Full Name", "Annual Income (Approx. in Rs)", "Village / City / District Name"]
  },
  "caste-cert": {
    title: "Caste Certificate (Jati Praman Patra)",
    price: 150,
    docsRequired: ["Aadhaar Card (Front / Full PDF)", "Ration Card / Family ID"],
    docsOptional: ["Aadhaar Card (Back)", "Father's Caste Certificate (If available)"],
    extraFields: ["Father's Full Name", "Caste Name (e.g., OBC, SC, ST)", "Village / City / District Name"]
  },
  "domicile-cert": {
    title: "Domicile Certificate (Niwas Praman Patra)",
    price: 100,
    docsRequired: ["Aadhaar Card (Front / Full PDF)", "Ration Card / Family ID"],
    docsOptional: ["Aadhaar Card (Back)"],
    extraFields: ["Father's Full Name", "How many years living in this state?", "Village / City / District Name"]
  },
  "pf-withdrawal": {
    title: "PF Withdrawal Form (EPFO)",
    price: 200,
    docsRequired: ["Aadhaar Card (Front / Full PDF)", "Bank Passbook Front Page", "PAN Card"],
    docsOptional: ["Cancelled Cheque"],
    extraFields: ["UAN Number (Universal Account Number)", "Company Name (Last Employer)", "Reason for Withdrawal (e.g., Resignation, Retirement)"]
  },
  "driving-learner": {
    title: "Learner Driving License Apply",
    price: 250,
    docsRequired: ["Aadhaar Card (Front / Full PDF)", "Passport Size Photo", "Signature (On white paper)"],
    docsOptional: ["Aadhaar Card (Back)"],
    extraFields: ["Date of Birth", "Vehicle Type (e.g., Motorcycle, Car, Both)", "Nearest RTO City"]
  },
};

function ESuvidhaApplyContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rawServiceId = params.service as string;

  // SEO friendly slug mapping
  const SERVICE_SLUG_MAP: Record<string, string> = {
    "apply-new-pan-card-online": "pan-new",
    "pan-card-correction-online": "pan-correction",
    "apply-new-voter-id-card": "voter-new",
    "order-aadhaar-pvc-card": "aadhaar-pvc",
    "apply-income-certificate-online": "income-cert",
    "apply-caste-certificate-online": "caste-cert",
    "apply-domicile-certificate-online": "domicile-cert",
    "apply-police-clearance-certificate-pcc": "pcc",
    "eshram-card-registration-online": "eshram",
    "ayushman-bharat-card-apply": "ayushman",
    "pf-withdrawal-claim-online": "pf-withdrawal",
    "msme-udyam-registration-online": "udyam",
    "itr-filing-nil-return": "itr-nil",
    "download-admit-card-result": "admit-card",
    "professional-resume-cv-maker": "resume-cv",
    "apply-passport-appointment-online": "passport",
    "learner-driving-license-apply": "driving-learner",
  };

  const serviceId = SERVICE_SLUG_MAP[rawServiceId] || rawServiceId;

  const serviceDetails = SERVICE_DB[serviceId] || {
    title: "Cyber Cafe Service",
    price: 100,
    docsRequired: ["Aadhaar Card", "Passport Size Photo"],
    extraFields: ["Special Instructions / Any specific detail"]
  };

  const infoContent = SERVICE_INFO_DB[serviceId] || {
    title: serviceDetails.title,
    hindiTitle: "ऑनलाइन सुविधा केंद्र",
    description: "Ghar baithe apni application submit karein. 100% secure aur expert verification.",
    benefits: [
      "Secured, rapid and expert-reviewed online application submissions.",
      "Get complete guidance on required documents.",
      "100% data confidentiality and privacy guarantee."
    ],
    steps: [
      "Submit applicant name and contact details in the form.",
      "Upload the required document scans or attachments.",
      "Complete the nominal processing fee payment.",
      "Our team reviews the files and completes the official portal submission."
    ],
    faqs: [
      { q: "Is my data protected?", a: "Yes, all uploaded documents are automatically purged from our servers within 72 hours of completion." }
    ]
  };

  // Fast synchronous check on initial render — zero delay & zero flash for logged in users
  const initialSession = typeof window !== "undefined" ? getStoredSession() : null;

  const [user, setUser] = useState<any>(initialSession?.user || null);
  const [token, setToken] = useState<string>(initialSession?.access_token || "");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!initialSession?.user);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingDocs, setMissingDocs] = useState<Set<string>>(new Set());
  const toast = useToast();
  
  const [extraData, setExtraData] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [lockerDocs, setLockerDocs] = useState<Record<string, string>>({}); // From digital locker
  const [overriddenDocs, setOverriddenDocs] = useState<Set<string>>(new Set()); // User dismissed locker
  const [trackingId, setTrackingId] = useState("");
  
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  
  // Security & Legal
  const [captchaQ, setCaptchaQ] = useState({ a: 0, b: 0 });
  const [captchaA, setCaptchaA] = useState("");
  const [agreed, setAgreed] = useState(false);

  // UPI Manual Payment State
  const [showUpiScreen, setShowUpiScreen] = useState(false);
  const [upiSettings, setUpiSettings] = useState<{ upi_id: string; account_name: string; qr_image_url?: string }>({
    upi_id: "rojgarsuvidha@ybl",
    account_name: "Pintu Kumar",
    qr_image_url: "/phonepay-qr.png"
  });
  const [utrInput, setUtrInput] = useState("");
  const [utrCopied, setUtrCopied] = useState(false);
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [utrError, setUtrError] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(15 * 60);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const [esuvidhaTrackingCode, setEsuvidhaTrackingCode] = useState("");

  useEffect(() => {
    setCaptchaQ({ a: Math.floor(Math.random() * 10) + 1, b: Math.floor(Math.random() * 10) + 1 });

    const fetchUser = async () => {
      try {
        let sessionUser = user || getStoredSession()?.user || null;
        let sessionToken = token || getStoredSession()?.access_token || "";

        // If still no session in localStorage, attempt short async fallback check
        if (!sessionUser) {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Auth check timed out")), 2000)
          );
          const res = await Promise.race([sessionPromise, timeoutPromise]).catch(() => null) as any;
          if (res?.data?.session) {
            sessionUser = res.data.session.user;
            sessionToken = res.data.session.access_token;
          }
        }

        // If user is truly not logged in, redirect smoothly to login
        if (!sessionUser) {
          setLoading(false);
          const fullUrl = window.location.pathname + window.location.search;
          router.replace(`/login?redirect=${encodeURIComponent(fullUrl)}`);
          return;
        }

        setUser(sessionUser);
        setToken(sessionToken);
        setLoading(false);

        // Parallel fetch for profile & locker documents (non-blocking)
        const [profileRes, lockerRes] = await Promise.allSettled([
          supabase.from("profiles").select("*").eq("id", sessionUser.id).maybeSingle(),
          supabase.from("user_locker").select("documents").eq("user_id", sessionUser.id).maybeSingle()
        ]);

        if (profileRes.status === "fulfilled" && profileRes.value?.data) {
          const pData = profileRes.value.data;
          setProfile(pData);
          if (pData?.full_name) setApplicantName(pData.full_name);
          if (pData?.mobile_number) setApplicantPhone(pData.mobile_number);
        }

        if (lockerRes.status === "fulfilled" && lockerRes.value?.data?.documents) {
          setLockerDocs(lockerRes.value.data.documents);
        }

      } catch (err) {
        console.error("Auth fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router, serviceId]);


  useEffect(() => {
    const checkPaymentRedirect = async () => {
      const orderIdParam = searchParams.get("order_id");
      if (!orderIdParam || !user) return;

      setLoading(true);
      try {
        // 1. Check if we already have this request marked as paid
        const { data: request, error: reqErr } = await supabase
          .from("apply_for_me_requests")
          .select("*")
          .eq("tracking_id", orderIdParam)
          .single();

        if (!reqErr && request && request.status === "paid") {
          setTrackingId(orderIdParam);
          setSubmitted(true);
          return;
        }

        // 2. Call backend track API to verify payment with Cashfree
        const res = await fetch(`/api/track?order_id=${orderIdParam}`);
        const statusData = await res.json();

        if (statusData.order_status === "PAID" || statusData.order_status === "ACTIVE") {
          // Update status to paid in database
          const { error: updateErr } = await supabase
            .from("apply_for_me_requests")
            .update({ status: "paid" })
            .eq("tracking_id", orderIdParam);

          if (!updateErr) {
            setTrackingId(orderIdParam);
            setSubmitted(true);
          } else {
            setError("Payment verified but failed to update status. Please contact support.");
          }
        } else {
          setError(`Payment verification pending: status is ${statusData.order_status}`);
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Payment verification failed.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      checkPaymentRedirect();
    }
  }, [user, searchParams]);

  // Fetch UPI settings
  useEffect(() => {
    fetch("/api/admin/upi-settings")
      .then(r => r.json())
      .then(d => { if (d.settings) setUpiSettings(d.settings); })
      .catch(() => {});
  }, []);

  // Payment countdown timer
  useEffect(() => {
    if (!showUpiScreen) return;
    if (paymentTimeLeft <= 0) { setPaymentExpired(true); return; }
    const t = setTimeout(() => setPaymentTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [showUpiScreen, paymentTimeLeft]);

  const copyUpiId = (text: string) => {
    navigator.clipboard.writeText(text);
    setUtrCopied(true);
    setTimeout(() => setUtrCopied(false), 2000);
  };

  const uploadScreenshot = async (file: File): Promise<string> => {
    setUploadingScreenshot(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true });
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `payment-screenshots/esuvidha-${esuvidhaTrackingCode}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documents").upload(fileName, compressed, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(fileName);
      setScreenshotUrl(publicUrl);
      return publicUrl;
    } catch (e) { return ""; }
    finally { setUploadingScreenshot(false); }
  };

  const handleUtrSubmit = async () => {
    setUtrError("");
    if (paymentExpired) { setUtrError("Order expire ho gaya. Kripya dobara apply karein."); return; }
    if (!utrInput.trim()) { setUtrError("UTR number daalna zaroori hai."); return; }
    if (!/^\d{12}$/.test(utrInput.trim())) { setUtrError("UTR number 12 digit ka hona chahiye."); return; }
    setSubmittingUtr(true);
    try {
      const res = await fetch("/api/utr-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_id: esuvidhaTrackingCode,
          utr_number: utrInput.trim(),
          screenshot_url: screenshotUrl || null,
          declared_amount: serviceDetails.price,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setUtrError(data.error || "UTR submit karne mein dikkat aayi."); return; }
      setTrackingId(esuvidhaTrackingCode);
      setSubmitted(true);
      setShowUpiScreen(false);
    } catch (err: any) {
      setUtrError(err.message || "Unexpected error.");
    } finally { setSubmittingUtr(false); }
  };

  const handleFileChange = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [docName]: e.target.files![0] }));
    }
  };

  // Smart Fuzzy Locker Match — handles spelling mistakes, case differences
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  const findLockerMatch = (docName: string): string | null => {
    if (overriddenDocs.has(docName)) return null; // User dismissed this match
    const target = normalize(docName);
    if (lockerDocs[docName]) return lockerDocs[docName];
    const exactCI = Object.keys(lockerDocs).find(k => normalize(k) === target);
    if (exactCI) return lockerDocs[exactCI];
    const fuzzy = Object.keys(lockerDocs).find(k => {
      const kn = normalize(k);
      return kn.includes(target) || target.includes(kn) ||
        (target.length > 4 && kn.length > 4 &&
          target.split("").filter(c => kn.includes(c)).length / Math.max(target.length, kn.length) > 0.8
        );
    });
    return fuzzy ? lockerDocs[fuzzy] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate applicant name
    if (!applicantName.trim() || applicantName.trim().length < 2) {
      const msg = "Please enter the applicant's full name (at least 2 characters).";
      setError(msg); toast.error("Missing Information", msg); return;
    }
    // Validate phone number
    const phoneDigits = applicantPhone.replace(/\D/g, "");
    if (!phoneDigits || phoneDigits.length !== 10) {
      const msg = "Please enter a valid 10-digit mobile number for the applicant.";
      setError(msg); toast.error("Invalid Phone Number", msg); return;
    }

    if (parseInt(captchaA) !== captchaQ.a + captchaQ.b) {
      const msg = "Incorrect answer to the security question. Please try again.";
      setError(msg); toast.warning("Captcha Failed", msg);
      setCaptchaQ({ a: Math.floor(Math.random() * 10) + 1, b: Math.floor(Math.random() * 10) + 1 });
      setCaptchaA("");
      return;
    }

    if (!agreed) {
      const msg = "Please read and agree to the Terms & Conditions and Refund Policy before proceeding.";
      setError(msg); toast.warning("Agreement Required", msg); return;
    }

    // Validate all required documents (highlight missing ones)
    const missing = new Set<string>();
    for (const doc of serviceDetails.docsRequired) {
      if (!files[doc] && !findLockerMatch(doc)) missing.add(doc);
    }
    if (missing.size > 0) {
      setMissingDocs(missing);
      const msg = missing.size === 1
        ? `Required document missing: "${Array.from(missing)[0]}". Please upload it to continue.`
        : `${missing.size} required documents are missing. Please upload all highlighted documents.`;
      setError(msg); toast.error("Documents Required", msg); return;
    }
    setMissingDocs(new Set());

    setSubmitting(true);
    setError(null);

    try {
      // 1. Upload Files
      const uploadedUrls: Record<string, string> = {};
      const allDocs = [...serviceDetails.docsRequired, ...(serviceDetails.docsOptional || [])];
      for (const doc of allDocs) {
        const match = findLockerMatch(doc);
        if (match) uploadedUrls[doc] = match;
      }

      for (const [docName, file] of Object.entries(files)) {
        let fileToUpload = file;
        if (file.type.startsWith("image/")) {
          try {
            fileToUpload = await imageCompression(file, { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true });
          } catch (err) { console.error("Compression failed:", err); }
        }
        const formData = new FormData();
        formData.append("file", fileToUpload);
        const res = await fetch("/api/locker/upload-direct", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || `Failed to upload ${docName}`);
        uploadedUrls[docName] = `/api/locker/view?key=${encodeURIComponent(resData.key)}`;
      }

      let formattedNotes = Object.entries(extraData).map(([k, v]) => `${k}: ${v}`).join('\n');
      let esuvidhaData = `--- E-SUVIDHA DETAILS ---\n${formattedNotes}\n\n--- UPLOADED DOCUMENTS ---\n`;
      esuvidhaData += Object.entries(uploadedUrls).map(([k, v]) => `${k}: ${v}`).join('\n');

      // 2. Generate tracking code
      const trackCode = "ES" + Math.random().toString(36).substring(2, 8).toUpperCase();
      setEsuvidhaTrackingCode(trackCode);

      // 3. Save to DB as pending_verification
      const { error: insertError } = await supabase
        .from("apply_for_me_requests")
        .insert({
          user_id: user.id,
          applicant_name: applicantName,
          phone_number: applicantPhone,
          email: user.email || "",
          job_title: `[e-Suvidha] ${serviceDetails.title}`,
          status: "pending_verification",
          admin_notes: esuvidhaData,
          tracking_id: trackCode,
          amount_paid: serviceDetails.price,
        });

      if (insertError) throw new Error("Request save karne mein dikkat aayi. Dobara try karo.");

      // 4. Show UPI payment screen
      setShowUpiScreen(true);
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      toast.error("Submission Failed", err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  // ── Payment Expired Screen ──
  if (paymentExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-950 dark:to-red-950 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center bg-white dark:bg-gray-900 rounded-3xl border border-red-100 dark:border-red-900/40 p-8 shadow-xl">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-xl font-black text-red-600 dark:text-red-400 mb-2">Payment Time Out!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            15 minute mein payment nahi mili. Kripya dobara apply karein.
          </p>
          <button
            onClick={() => {
              setPaymentExpired(false); setShowUpiScreen(false);
              setPaymentTimeLeft(15 * 60); setUtrInput(""); setScreenshotUrl("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all"
          >🔄 Dobara Apply Karo</button>
          <p className="text-xs text-gray-400 mt-4">Tracking ID: <strong className="text-indigo-500">{esuvidhaTrackingCode}</strong></p>
        </div>
      </div>
    );
  }

  // ── UPI Payment Screen ──
  if (showUpiScreen) {
    const upiId = upiSettings.upi_id || "rojgarsuvidha@ybl";
    const accountName = upiSettings.account_name || "Rojgar Suvidha";
    const amount = serviceDetails.price;
    const txnNote = encodeURIComponent(`RojgarSuvidha-${esuvidhaTrackingCode}`);
    const txnName = encodeURIComponent(accountName);
    const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${txnName}&am=${amount}&cu=INR&tn=${txnNote}`;
    
    // Reliable 100% working QR API (qrserver)
    const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiDeepLink)}`;
    const phonePeLink = `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${txnName}&am=${amount}&cu=INR&tn=${txnNote}`;
    const googlePayLink = `tez://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${txnName}&am=${amount}&cu=INR&tn=${txnNote}`;
    const paytmLink = `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${txnName}&am=${amount}&cu=INR&tn=${txnNote}`;
    const mins = Math.floor(paymentTimeLeft / 60).toString().padStart(2, "0");
    const secs = (paymentTimeLeft % 60).toString().padStart(2, "0");
    const isUrgent = paymentTimeLeft < 180;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-4 px-3 flex items-center justify-center">
        <div className="max-w-sm w-full bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 shadow-2xl space-y-4">
          
          {/* Header: Title + Timer + Amount in 1 compact bar */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">Service Payment</span>
              <h2 className="text-base font-black text-gray-900 dark:text-white leading-tight">{serviceDetails.title}</h2>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">₹{amount}</div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${isUrgent ? "bg-red-100 text-red-700 animate-pulse" : "bg-amber-100 text-amber-800"}`}>
                ⏱️ {mins}:{secs}
              </span>
            </div>
          </div>

          {/* QR Code Section — Compact 150px */}
          <div className="flex flex-col items-center bg-indigo-50/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-indigo-100 dark:border-gray-800">
            <div className="bg-white p-2 rounded-xl shadow-md border border-gray-200">
              <img 
                src={dynamicQrUrl} 
                alt={`Scan ₹${amount}`} 
                width={150} 
                height={150}
                className="w-36 h-36 object-contain rounded-lg"
                onError={(e) => {
                  if (upiSettings.qr_image_url) (e.target as HTMLImageElement).src = upiSettings.qr_image_url;
                }}
              />
            </div>
            <p className="text-[11px] font-extrabold text-indigo-900 dark:text-indigo-300 mt-2">Scan &amp; Pay Exact ₹{amount}</p>
            <p className="text-[10px] text-gray-500">🔒 Amount is locked — cannot be changed</p>
          </div>

          {/* Direct App Pay Buttons */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center mb-1.5">Direct Pay App</p>
            <div className="grid grid-cols-3 gap-2">
              <a href={phonePeLink} className="py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl text-center font-bold text-xs transition-all active:scale-95">📱 PhonePe</a>
              <a href={googlePayLink} className="py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-center font-bold text-xs transition-all active:scale-95">💙 GPay</a>
              <a href={paytmLink} className="py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-xl text-center font-bold text-xs transition-all active:scale-95">💸 Paytm</a>
            </div>
          </div>

          {/* Copyable UPI ID */}
          <div className="bg-gray-50 dark:bg-gray-800/80 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="text-[9px] font-bold text-gray-400 block uppercase">UPI ID</span>
              <span className="text-xs font-black text-gray-900 dark:text-white font-mono truncate block">{upiId}</span>
            </div>
            <button onClick={() => copyUpiId(upiId)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shrink-0 transition-all flex items-center gap-1">
              {utrCopied ? <CheckCircle2 className="w-3 h-3 text-green-300" /> : <Copy className="w-3 h-3" />}
              {utrCopied ? "Copied" : "Copy"}
            </button>
          </div>

          {/* UTR Input + Submit */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <div>
              <label className="text-xs font-black text-gray-800 dark:text-gray-200 block mb-1">
                Enter 12-Digit UTR / Ref No. <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel" 
                inputMode="numeric" 
                maxLength={12} 
                value={utrInput}
                onChange={e => { setUtrInput(e.target.value.replace(/\D/g, "")); setUtrError(""); }}
                placeholder="12-digit UTR number"
                className="w-full px-3 py-2.5 border-2 border-gray-300 dark:border-gray-700 focus:border-indigo-600 rounded-xl text-center text-lg font-black text-gray-900 dark:text-white bg-white dark:bg-gray-800 outline-none tracking-widest"
              />
              {utrError && <p className="text-[11px] font-bold text-red-500 mt-1">{utrError}</p>}
            </div>

            {/* Optional Screenshot Upload */}
            {!screenshotUrl ? (
              <label className="flex items-center justify-center gap-2 border border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 rounded-xl py-2 px-3 cursor-pointer bg-gray-50 dark:bg-gray-800/40 text-xs text-gray-600 dark:text-gray-300 font-semibold">
                {uploadingScreenshot ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Camera className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{uploadingScreenshot ? "Uploading..." : "+ Add Screenshot (Faster Verify)"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await uploadScreenshot(f); }} />
              </label>
            ) : (
              <div className="flex items-center justify-between text-xs text-green-600 font-bold bg-green-50 dark:bg-green-950/20 p-2 rounded-xl border border-green-200">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Screenshot attached</span>
                <button onClick={() => setScreenshotUrl("")} className="text-red-500 hover:underline text-[10px]">Remove</button>
              </div>
            )}

            <button 
              onClick={handleUtrSubmit} 
              disabled={submittingUtr || utrInput.length !== 12 || paymentExpired}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-sm transition-all shadow-md shadow-green-600/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {submittingUtr ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {submittingUtr ? "Verifying..." : "Submit UTR & Confirm Order"}
            </button>
          </div>

          <p className="text-[10px] text-gray-400 text-center">Tracking ID: <strong className="text-indigo-600 font-mono">{esuvidhaTrackingCode}</strong></p>
        </div>
      </div>
    );
  }

  if (submitted) {

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold mb-2 text-gray-900">Request Successful!</h2>
          <p className="text-gray-500 mb-6">Aapki {serviceDetails.title} ki request aur documents hamari team ke paas pahuch gaye hain.</p>
          <div className="bg-indigo-50 p-4 rounded-xl mb-6 text-left border border-indigo-100">
            <p className="text-xs font-bold text-indigo-500 uppercase">Tracking ID</p>
            <p className="font-mono text-lg font-bold text-indigo-900">{trackingId}</p>
          </div>
          <Link href="/dashboard?tab=requests" className="block w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <>

    {/* FAQPage Structured Data (JSON-LD Schema) for Google Search Rich Snippets */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": infoContent.faqs.map((faq) => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.a,
            },
          })),
        }),
      }}
    />

    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/e-suvidha" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Wapas Jaao
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Rich SEO Content */}
          <div className="lg:col-span-7 space-y-6">
             {/* Header */}
             <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-violet-900 rounded-2xl p-6 text-white shadow-lg animate-fade-in">
               <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">{infoContent.hindiTitle}</span>
               <h1 className="text-2xl md:text-3xl font-extrabold mt-3 mb-2">{serviceDetails.title}</h1>
               <p className="text-blue-100 text-sm leading-relaxed">{infoContent.description}</p>
             </div>

             {/* Work Process / Delivery Promise Banner */}
             <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-5 md:p-6 shadow-sm">
               <h2 className="text-sm md:text-base font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 mb-4">
                 <span>⏱️</span> हमारा काम करने का तरीका और रसीद (Receiving) की गारंटी
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                 <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between">
                   <div>
                     <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center font-bold text-[10px] mb-2">1</span>
                     <p className="font-extrabold text-gray-900 dark:text-white mb-1">Apply & Upload</p>
                     <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                       Apne documents (Aadhaar Card, etc.) right side me upload karein aur form details fill karein.
                     </p>
                   </div>
                 </div>
                 
                 <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800/80 flex flex-col justify-between">
                   <div>
                     <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center font-bold text-[10px] mb-2">2</span>
                     <p className="font-extrabold text-gray-900 dark:text-white mb-1">Secure Payment</p>
                     <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                       Nominal service charges pay karein. Hum details double check karenge taaki form cancel na ho.
                     </p>
                   </div>
                 </div>

                 <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/80 flex flex-col justify-between relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 rounded-bl-full flex items-center justify-center font-bold text-emerald-600">✓</div>
                   <div>
                     <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center font-bold text-[10px] mb-2">3</span>
                     <p className="font-extrabold text-emerald-900 dark:text-emerald-300 mb-1">Receiving in 24 Hrs</p>
                     <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                       Form submit hote hi official government portal ka **acknowledgement receipt (Receiving PDF)** aapke dashboard aur WhatsApp par **24 ghante ke andar** bhej di jayegi.
                     </p>
                   </div>
                 </div>
               </div>
             </div>

             {/* Benefits */}
             <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
               <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4">Key Benefits & Features (प्रमुख लाभ)</h2>
               <ul className="space-y-3">
                 {infoContent.benefits.map((benefit, i) => (
                   <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
                     <span className="text-green-500 font-bold">✔</span>
                     <span>{benefit}</span>
                   </li>
                 ))}
               </ul>
             </div>

             {/* How it Works */}
             <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
               <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4">Application Process (आवेदन प्रक्रिया)</h2>
               <ol className="space-y-4">
                 {infoContent.steps.map((step, i) => (
                   <li key={i} className="flex gap-4 items-start text-sm text-gray-600 dark:text-gray-400">
                     <span className="w-6 h-6 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full flex items-center justify-center shrink-0 font-bold text-xs">
                       {i + 1}
                     </span>
                     <span className="leading-relaxed">{step}</span>
                   </li>
                 ))}
               </ol>
             </div>

             {/* FAQs */}
             <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
               <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4">Frequently Asked Questions (FAQs)</h2>
               <div className="space-y-4">
                 {infoContent.faqs.map((faq, i) => (
                   <div key={i} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                     <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1">Q: {faq.q}</h3>
                     <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">A: {faq.a}</p>
                   </div>
                 ))}
               </div>
             </div>
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-5 space-y-6">
             {/* Data Privacy Trust Banner */}
             <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 items-start shadow-sm">
               <ShieldCheck className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
               <div>
                 <p className="text-sm font-extrabold text-green-800">100% Data Privacy & Security</p>
                 <p className="text-xs text-green-700 mt-1 leading-relaxed">
                   Hum aapka koi bhi personal data ya document save nahi karte hain. Aapke dwara upload kiye gaye sabhi documents kaam poora hone ke baad <strong className="font-bold text-green-900">72 ghante (3 days) ke andar automatically permanently delete</strong> ho jate hain.
                 </p>
               </div>
             </div>

             {/* Form */}
             <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
               <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Applicant Details (Editable) */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Applicant Name (Jiska kaam karna hai) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  required 
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-900 dark:text-white"
                  placeholder="e.g. Rahul Kumar"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Applicant Phone Number <span className="text-red-500">*</span></label>
                <input 
                  type="tel" 
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  required 
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-gray-900 dark:text-white"
                  placeholder="e.g. 9876543210"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-medium italic">💡 Note: Aap kisi aur ka (jaise mata, pita, dost) form bhi bharwa sakte hain, bas unka naam aur number upar likhein.</p>
            </div>

            {/* Document Uploads (Only if required) */}
            {(serviceDetails.docsRequired.length > 0 || (serviceDetails.docsOptional && serviceDetails.docsOptional.length > 0)) && (
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  <UploadCloud className="w-5 h-5 text-indigo-500" /> Upload Documents
                </h3>
                <div className="space-y-4">
                  {serviceDetails.docsRequired.map((doc, idx) => {
                    const lockerMatch = findLockerMatch(doc);
                    const hasFile = !!files[doc];
                    const hasLocker = !!lockerMatch && !hasFile;
                    return (
                    <div key={`req-${idx}`} className={`relative bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border flex flex-col transition-all ${hasFile ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10' : hasLocker ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                      
                      {/* Top Badges and Clear buttons */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{doc} <span className="text-red-500">*</span></span>
                        {hasLocker && (
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              From Locker 🔒
                            </span>
                            <button
                              type="button"
                              onClick={() => setOverriddenDocs(prev => { const n = new Set(prev); n.add(doc); return n; })}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline"
                            >
                              ✕ Use different file
                            </button>
                          </div>
                        )}
                        {hasFile && (
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              📎 New File
                            </span>
                            <button
                              type="button"
                              onClick={() => setFiles(prev => { const n = { ...prev }; delete n[doc]; return n; })}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                        <div>
                          {hasFile ? (
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded: {files[doc].name}
                            </p>
                          ) : hasLocker ? (
                            <p className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> ✅ Auto-filled from your locker
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">Max size 5MB (JPG, PNG, PDF)</p>
                          )}
                          {overriddenDocs.has(doc) && !hasFile && (
                            <button
                              type="button"
                              onClick={() => setOverriddenDocs(prev => { const n = new Set(prev); n.delete(doc); return n; })}
                              className="mt-1 text-[10px] font-bold text-indigo-500 hover:underline block text-left"
                            >
                              ↩ Use locker file instead
                            </button>
                          )}
                        </div>
                        <label className="relative cursor-pointer bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 hover:border-indigo-500 rounded-lg px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 transition-colors text-center shrink-0">
                          {hasFile ? "Change File" : hasLocker ? "Replace File" : "Select File"}
                          <input 
                            type="file" 
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => handleFileChange(doc, e)}
                          />
                        </label>
                      </div>
                    </div>
                    );
                  })}

                  {/* Optional Documents */}
                  {serviceDetails.docsOptional?.map((doc, idx) => {
                    const lockerMatch = findLockerMatch(doc);
                    const hasFile = !!files[doc];
                    const hasLocker = !!lockerMatch && !hasFile;
                    return (
                    <div key={`opt-${idx}`} className={`relative bg-white dark:bg-gray-800/10 p-4 rounded-xl border border-dashed flex flex-col transition-all ${hasFile ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10' : hasLocker ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 dark:border-gray-700 opacity-80 hover:opacity-100'}`}>
                      
                      {/* Top Badges and Clear buttons */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{doc} <span className="text-gray-400 text-xs font-normal">(Optional)</span></span>
                        {hasLocker && (
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              From Locker 🔒
                            </span>
                            <button
                              type="button"
                              onClick={() => setOverriddenDocs(prev => { const n = new Set(prev); n.add(doc); return n; })}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline"
                            >
                              ✕ Use different file
                            </button>
                          </div>
                        )}
                        {hasFile && (
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              📎 New File
                            </span>
                            <button
                              type="button"
                              onClick={() => setFiles(prev => { const n = { ...prev }; delete n[doc]; return n; })}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
                        <div>
                          {hasFile ? (
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded: {files[doc].name}
                            </p>
                          ) : hasLocker ? (
                            <p className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> ✅ Auto-filled from your locker
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400">Max size 5MB (JPG, PNG, PDF)</p>
                          )}
                          {overriddenDocs.has(doc) && !hasFile && (
                            <button
                              type="button"
                              onClick={() => setOverriddenDocs(prev => { const n = new Set(prev); n.delete(doc); return n; })}
                              className="mt-1 text-[10px] font-bold text-indigo-500 hover:underline block text-left"
                            >
                              ↩ Use locker file instead
                            </button>
                          )}
                        </div>
                        <label className="relative cursor-pointer bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 hover:border-indigo-500 rounded-lg px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 transition-colors text-center shrink-0">
                          {hasFile ? "Change File" : hasLocker ? "Replace File" : "Select File"}
                          <input 
                            type="file" 
                            accept=".jpg,.jpeg,.png,.pdf"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => handleFileChange(doc, e)}
                          />
                        </label>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dynamic Extra Fields */}
            {serviceDetails.extraFields.map((fieldLabel, idx) => (
              <div key={idx}>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{fieldLabel} <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required 
                  onChange={(e) => setExtraData({...extraData, [fieldLabel]: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="Enter details here..."
                />
              </div>
            ))}

            {/* Payment Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Service Fees</p>
                  <p className="text-xs text-gray-500">🔒 Instant UPI &amp; QR Payment</p>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-blue-600">₹{serviceDetails.price} INR</p>
            </div>

            {/* Security & Agreement */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              {/* Captcha */}
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Human Verification <span className="text-red-500">*</span></label>
                  <p className="text-lg font-black text-gray-900 dark:text-white tracking-widest">{captchaQ.a} + {captchaQ.b} = ?</p>
                </div>
                <input 
                  type="text" 
                  inputMode="numeric"
                  required
                  value={captchaA}
                  onChange={(e) => setCaptchaA(e.target.value.replace(/\D/g, ""))}
                  className="w-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-center text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ans"
                />
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-start mt-0.5">
                  <input 
                    type="checkbox" 
                    required
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded flex items-center justify-center peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100" />
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed flex-1">
                  I agree to the <Link href="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline">Terms & Conditions</Link>, <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</Link>, and <Link href="/refund-policy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Refund Policy</Link>. I confirm that all the details provided by me are true and accurate. I understand that government fees (if any) are separate and non-refundable.
                </p>
              </label>
            </div>

            {error && <p className="text-sm font-bold text-red-500 text-center bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

            <button type="submit" disabled={submitting || !applicantName.trim() || !applicantPhone.trim() || !agreed || !captchaA}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-base shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pay & Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </div>

      </div>
    </div>
    </>
  );
}

export default function ESuvidhaApply() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <ESuvidhaApplyContent />
    </Suspense>
  );
}
