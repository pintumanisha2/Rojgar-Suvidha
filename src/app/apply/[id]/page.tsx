"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, getStoredSession } from "@/lib/supabase";
import { Loader2, UploadCloud, CheckCircle2, ShieldCheck, Briefcase, Ticket, X, CheckCircle, ArrowLeft, Copy, ExternalLink, Smartphone, QrCode, Clock, AlertCircle, Camera } from "lucide-react";
import imageCompression from "browser-image-compression";
import dynamic from "next/dynamic";
const ApplyFomoBar = dynamic(() => import("@/components/ui/ApplyFomoBar"), { ssr: false });



function ApplyContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSession = typeof window !== "undefined" ? getStoredSession() : null;

  const [formConfig, setFormConfig] = useState<any>(null);
  const [loading, setLoading] = useState(!initialSession?.user);
  
  // User Inputs
  const [formData, setFormData] = useState({
    fullName: "",
    fatherName: "",
    motherName: "",
    phone: "",
    email: initialSession?.user?.email || "",
    altPhone: "",
    aadhar: "",
    dob: "",
    gender: "male",
    category: "gen",
    isPwd: "no"
  });

  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  
  // Document Files State: { "Passport Size Photo": FileObject }
  const [documentFiles, setDocumentFiles] = useState<{[key: string]: File | null}>({});
  const [lockerDocs, setLockerDocs] = useState<{[key: string]: string}>({}); // URLs from locker
  const [overriddenDocs, setOverriddenDocs] = useState<Set<string>>(new Set()); // User dismissed locker match
  const [token, setToken] = useState(initialSession?.access_token || "");
  const [userId, setUserId] = useState(initialSession?.user?.id || "");



  // Fee States
  const [baseFee, setBaseFee] = useState(0); 
  const [serviceCharge, setServiceCharge] = useState(0); 
  
  // Coupon States
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successTrackingId, setSuccessTrackingId] = useState("");
  const [copied, setCopied] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // UPI Manual Payment State
  const [showUpiScreen, setShowUpiScreen] = useState(false);
  const [pendingTrackingCode, setPendingTrackingCode] = useState("");
  const [upiSettings, setUpiSettings] = useState<{ upi_id: string; account_name: string; qr_image_url?: string } | null>(null);
  const [utrInput, setUtrInput] = useState("");
  const [utrCopied, setUtrCopied] = useState(false);
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [utrError, setUtrError] = useState("");
  const [uploadedUrlsForUpi, setUploadedUrlsForUpi] = useState<Record<string,string>>({});
  const [finalAmountForUpi, setFinalAmountForUpi] = useState(0);

  // Payment Timer State (15 min = 900 seconds)
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(15 * 60);
  const [paymentExpired, setPaymentExpired] = useState(false);

  // Screenshot Upload State
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  const handleCopy = () => {
    if (successTrackingId) {
      navigator.clipboard.writeText(successTrackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyUpiId = (text: string) => {
    navigator.clipboard.writeText(text);
    setUtrCopied(true);
    setTimeout(() => setUtrCopied(false), 2000);
  };

  // ── Payment Timer: countdown 15 min, then expire ──
  useEffect(() => {
    if (!showUpiScreen) return;
    if (paymentTimeLeft <= 0) {
      setPaymentExpired(true);
      return;
    }
    const t = setTimeout(() => setPaymentTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [showUpiScreen, paymentTimeLeft]);

  // ── Screenshot Upload via Supabase Storage ──
  const uploadScreenshot = async (file: File): Promise<string> => {
    setUploadingScreenshot(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true });
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `payment-screenshots/${pendingTrackingCode}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(fileName, compressed, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(fileName);
      setScreenshotUrl(publicUrl);
      return publicUrl;
    } catch (e) {
      console.error("Screenshot upload error:", e);
      return "";
    } finally {
      setUploadingScreenshot(false);
    }
  };

  // Fetch UPI settings on mount
  useEffect(() => {
    fetch("/api/admin/upi-settings")
      .then(r => r.json())
      .then(d => { if (d.settings) setUpiSettings(d.settings); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fetchForm = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.from("custom_forms").select("*").eq("id", id).maybeSingle();
        if (data) {
          setFormConfig(data);
          
          // Initialize empty document states
          if (data.documents && data.documents.length > 0) {
            const docState: any = {};
            data.documents.forEach((doc: string) => docState[doc] = null);
            setDocumentFiles(docState);
          }
        }
        
        // Fast-path: Check stored session synchronously from localStorage
        const stored = getStoredSession();
        let sessionUser = stored?.user || null;
        let sessionToken = stored?.access_token || "";

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
        
        if (!sessionUser) {
          // Force login before applying, with exact redirect parameter
          const fullUrl = window.location.pathname + window.location.search;
          router.replace(`/login?redirect=${encodeURIComponent(fullUrl)}`);
          return;
        }

        setToken(sessionToken);
        setUserId(sessionUser.id);
        setLoading(false);

        // Fetch profile data & locker docs in parallel (uses maybeSingle)
        const [profileRes, lockerRes] = await Promise.allSettled([
          supabase.from("profiles").select("full_name, mobile_number, father_name, mother_name, date_of_birth, gender, category").eq("id", sessionUser.id).maybeSingle(),
          supabase.from("user_locker").select("documents").eq("user_id", sessionUser.id).maybeSingle()
        ]);

        if (profileRes.status === "fulfilled" && profileRes.value?.data) {
          const profileData = profileRes.value.data;
          setFormData(prev => ({
            ...prev,
            fullName: profileData.full_name || prev.fullName,
            fatherName: profileData.father_name || prev.fatherName,
            motherName: profileData.mother_name || prev.motherName,
            phone: profileData.mobile_number || prev.phone,
            email: sessionUser.email || prev.email,
            dob: profileData.date_of_birth || prev.dob,
            gender: profileData.gender || prev.gender,
            category: profileData.category || prev.category,
          }));

          // Fetch Aadhar securely
          try {
            const aadharRes = await fetch("/api/user/aadhar", {
              headers: { "Authorization": `Bearer ${sessionToken}` }
            });
            if (aadharRes.ok) {
              const aadharData = await aadharRes.json();
              if (aadharData.aadhar) {
                setFormData(prev => ({ ...prev, aadhar: aadharData.aadhar }));
              }
            }
          } catch (e) {
            console.error("Failed to auto-fill Aadhar:", e);
          }
        }

        if (lockerRes.status === "fulfilled" && lockerRes.value?.data?.documents) {
          setLockerDocs(lockerRes.value.data.documents);
        }

        // Check for saved draft in sessionStorage
        try {
          const draft = sessionStorage.getItem(`form_draft_${id}`);
          if (draft) {
            const parsedDraft = JSON.parse(draft);
            setFormData(prev => ({ ...prev, ...parsedDraft }));
          }
        } catch (e) {
          console.error("Failed to parse form draft:", e);
        }

      } catch (error) {
        console.error("Error fetching form:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id, router]);

  // Save form draft to sessionStorage automatically on change
  useEffect(() => {
    if (formData.fullName || formData.phone || formData.aadhar) {
      try {
        sessionStorage.setItem(`form_draft_${id}`, JSON.stringify({
          fullName: formData.fullName,
          fatherName: formData.fatherName,
          motherName: formData.motherName,
          phone: formData.phone,
          email: formData.email,
          altPhone: formData.altPhone,
          aadhar: formData.aadhar,
          dob: formData.dob,
          gender: formData.gender,
          category: formData.category,
          isPwd: formData.isPwd,
        }));
      } catch (e) {}
    }
  }, [formData, id]);

  useEffect(() => {
    if (formConfig) {
      logCheckoutFunnel("checkout_start");
    }
  }, [formConfig]);

  useEffect(() => {
    const checkPaymentRedirect = async () => {
      const orderIdParam = searchParams.get("order_id");
      if (!orderIdParam) return;

      setLoading(true);
      try {
        // Extract the short trackingCode from the orderId prefix (order_RSG3E4_TIMESTAMP)
        const parts = orderIdParam.split("_");
        if (parts.length < 2) return;
        const trackingCode = parts[1];

        // 1. Check if we already have this request marked as paid
        const { data: app, error: appErr } = await supabase
          .from("user_applications")
          .select("*")
          .eq("tracking_id", trackingCode)
          .single();

        if (!appErr && app && app.payment_status === "paid") {
          setSuccessTrackingId(trackingCode);
          return;
        }

        // 2. Call backend track API to verify payment with Cashfree
        const res = await fetch(`/api/track?order_id=${orderIdParam}`);
        const statusData = await res.json();

        if (statusData.order_status === "PAID" || statusData.order_status === "ACTIVE") {
          // Update status to paid in database
          const { error: updateErr } = await supabase
            .from("user_applications")
            .update({ payment_status: "paid" })
            .eq("tracking_id", trackingCode);

          if (!updateErr) {
            // Update Coupon Usage if applied
            if (app && app.coupon_applied) {
              try {
                const { data: couponData } = await supabase
                  .from("coupons")
                  .select("id, used_count")
                  .eq("code", app.coupon_applied)
                  .single();
                if (couponData) {
                  const { error: rpcErr } = await supabase.rpc('increment_coupon_usage', { coupon_id: couponData.id });
                  if (rpcErr) {
                    await supabase.from("coupons").update({ used_count: couponData.used_count + 1 }).eq("id", couponData.id);
                  }
                }
              } catch (cErr) {
                console.error("Failed to update coupon usage:", cErr);
              }
            }
            setSuccessTrackingId(trackingCode);
          } else {
            setSubmitError("Payment verified but failed to update status. Please contact support.");
          }
        } else {
          setSubmitError(`Payment verification pending: status is ${statusData.order_status}`);
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setSubmitError(err.message || "Payment verification failed.");
      } finally {
        setLoading(false);
      }
    };

    checkPaymentRedirect();
  }, [searchParams]);

  useEffect(() => {
    if (!formConfig) return;

    let currentFeeStructure: any = {};
    if (!formConfig.fees_structure) {
      setBaseFee(0);
      setServiceCharge(50);
      return;
    }
    if (Array.isArray(formConfig.fees_structure)) {
      currentFeeStructure = formConfig.fees_structure[selectedPostIndex]?.fees || {};
    } else if (typeof formConfig.fees_structure === 'object') {
      currentFeeStructure = formConfig.fees_structure;
    }

    let calculatedBase = 0;
    
    if (formData.isPwd === "yes") {
      calculatedBase = Number(currentFeeStructure.pwd || 0);
    } else {
      const isMale = formData.gender === "male";
      switch(formData.category) {
        case "gen": calculatedBase = Number(isMale ? currentFeeStructure.genMale : currentFeeStructure.genFemale); break;
        case "obc": calculatedBase = Number(isMale ? currentFeeStructure.obcMale : currentFeeStructure.obcFemale); break;
        case "sc_st": calculatedBase = Number(isMale ? currentFeeStructure.scStMale : currentFeeStructure.scStFemale); break;
      }
    }

    const calculatedService = Number(currentFeeStructure.serviceCharge || 50);
    
    setBaseFee(calculatedBase);
    setServiceCharge(calculatedService);
  }, [formData, formConfig, selectedPostIndex]);

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");

    try {
      const res = await fetch("/api/verify-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCodeInput.trim() }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setCouponError(result.error || "Invalid coupon code");
        setValidatingCoupon(false);
        return;
      }

      setAppliedCoupon({
        code: couponCodeInput.trim().toUpperCase(),
        discount_type: "flat",
        discount_value: result.discount,
      });
      setCouponError("");
      setCouponCodeInput("");
    } catch {
      setCouponError("Failed to verify coupon code. Please try again.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const logCheckoutFunnel = async (action: string) => {
    try {
      await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || "anonymous",
          action,
          path: window.location.pathname,
          metadata: {
            formId: id,
            formTitle: formConfig?.title || "",
          }
        })
      });
    } catch (e) {
      console.warn("Failed to log checkout event:", e);
    }
  };

  const handleFileChange = (docName: string, file: File | null) => {
    if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
      alert("File size should be less than 5MB");
      return;
    }
    setDocumentFiles(prev => ({ ...prev, [docName]: file }));
  };

  // Smart Fuzzy Locker Match — handles spelling mistakes, case differences, extra spaces
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();

  const findLockerMatch = (docName: string): string | null => {
    if (overriddenDocs.has(docName)) return null; // User dismissed this match
    const target = normalize(docName);
    const isValidVal = (v: any) => typeof v === 'string' && v.trim().length > 0 && (v.startsWith('http') || v.startsWith('/api') || v.startsWith('/uploads'));

    // 1. Exact match first
    if (lockerDocs[docName] && isValidVal(lockerDocs[docName])) return lockerDocs[docName];
    // 2. Case-insensitive exact match
    const exactCI = Object.keys(lockerDocs).find(k => normalize(k) === target);
    if (exactCI && isValidVal(lockerDocs[exactCI])) return lockerDocs[exactCI];
    // 3. Fuzzy: locker key contains or is contained in doc name
    const fuzzy = Object.keys(lockerDocs).find(k => {
      const kn = normalize(k);
      return (kn.includes(target) || target.includes(kn) ||
        // Check if 80%+ characters match (handles 1-2 typos)
        (target.length > 4 && kn.length > 4 && (
          target.split("").filter(c => kn.includes(c)).length / Math.max(target.length, kn.length) > 0.8
        ))) && isValidVal(lockerDocs[k]);
    });
    return fuzzy ? lockerDocs[fuzzy] : null;
  };

  const getOfficialPortal = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes("ssc")) return "https://ssc.gov.in";
    if (t.includes("upsc")) return "https://upsc.gov.in";
    if (t.includes("railway") || t.includes("rrb")) return "https://indianrailways.gov.in";
    if (t.includes("banking") || t.includes("ibps")) return "https://ibps.in";
    if (t.includes("bpsc")) return "https://bpsc.bih.nic.in";
    if (t.includes("navy")) return "https://joinindiannavy.gov.in";
    if (t.includes("army")) return "https://joinindianarmy.nic.in";
    if (t.includes("airforce")) return "https://careerindianairforce.cdac.in";
    return "Official Recruitment Board Website";
  };

  // Calculate Discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      discountAmount = (serviceCharge * Number(appliedCoupon.discount_value)) / 100;
    } else {
      discountAmount = Number(appliedCoupon.discount_value);
    }
    if (discountAmount > serviceCharge) discountAmount = serviceCharge;
  }

  const finalPayable = baseFee + serviceCharge - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    // Validate Aadhar — must be exactly 12 digits
    if (formData.aadhar.replace(/\D/g, "").length !== 12) {
      setSubmitError("Please enter a valid 12-digit Aadhar number.");
      return;
    }
    
    // Validate Required Documents (Must have either File or Locker URL, using fuzzy match)
    if (formConfig.documents && formConfig.documents.length > 0) {
      const missingDocs = formConfig.documents.filter((doc: string) => !documentFiles[doc] && !findLockerMatch(doc));
      if (missingDocs.length > 0) {
        setSubmitError(`Please upload the following required documents: ${missingDocs.join(", ")}`);
        return;
      }
    }

    setIsSubmitting(true);
    logCheckoutFunnel("details_entered");

    try {
      // Secure Aadhar encryption via server-side API
      let secureAadhar = formData.aadhar;
      try {
        const encRes = await fetch("/api/crypto/encrypt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: formData.aadhar }),
        });
        if (encRes.ok) {
          const encData = await encRes.json();
          secureAadhar = encData.encrypted;
        } else {
          throw new Error("Unable to encrypt Aadhar.");
        }
      } catch (err: any) {
        throw new Error("Security verification failed: " + err.message);
      }

      // 1. Upload Documents to Backblaze B2 or use Locker URLs
      // Pre-fill with fuzzy-matched locker docs
      const uploadedUrls: {[key: string]: string} = {};
      if (formConfig.documents) {
        for (const doc of formConfig.documents) {
          const matched = findLockerMatch(doc);
          if (matched) uploadedUrls[doc] = matched;
        }
      }
      
      for (const [docName, file] of Object.entries(documentFiles)) {
        if (file) {
          let fileToUpload = file;
          if (file.type.startsWith("image/")) {
            try {
              const options = {
                maxSizeMB: 0.2, // 200 KB
                maxWidthOrHeight: 1200,
                useWebWorker: true,
              };
              fileToUpload = await imageCompression(file, options);
              console.log(`Compressed ${docName} from ${file.size/1024}KB to ${fileToUpload.size/1024}KB`);
            } catch (err) {
              console.error("Compression failed, using original file:", err);
            }
          }

          // Upload file via proxy backend endpoint to avoid browser CORS issues
          const formData = new FormData();
          formData.append("file", fileToUpload);

          const res = await fetch("/api/locker/upload-direct", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`
            },
            body: formData
          });

          const resData = await res.json();
          if (!res.ok) {
            throw new Error(resData.error || `Failed to upload ${docName}`);
          }

          const { key } = resData;

          // Construct the secure relative view URL
          uploadedUrls[docName] = `/api/locker/view?key=${encodeURIComponent(key)}`;
        }
      } // 2. Manual UPI Payment Flow
      if (finalPayable > 0) {
        const trackingCode = "RS" + Math.random().toString(36).substring(2, 8).toUpperCase();

        const postName = Array.isArray(formConfig.fees_structure)
          ? formConfig.fees_structure[selectedPostIndex]?.postName
          : "Default Post";

        // Save Application to Database as 'pending_verification' BEFORE showing payment screen
        const { error: dbError } = await supabase.from("user_applications").insert([{
          tracking_id: trackingCode,
          user_id: userId || null,
          form_id: id,
          full_name: formData.fullName,
          father_name: formData.fatherName,
          mother_name: formData.motherName,
          phone: formData.phone,
          email: formData.email,
          alt_phone: formData.altPhone,
          aadhar: secureAadhar,
          dob: formData.dob,
          gender: formData.gender,
          category: formData.category,
          is_pwd: formData.isPwd,
          selected_post_name: postName,
          documents_urls: uploadedUrls,
          total_paid: finalPayable,
          coupon_applied: appliedCoupon ? appliedCoupon.code : null,
          payment_method: "upi_manual",
          payment_status: "pending_verification",
          application_status: "Payment Pending"
        }]);

        if (dbError) throw dbError;
        try { sessionStorage.removeItem(`form_draft_${id}`); } catch (e) {}

        // Show UPI Payment Screen
        setPendingTrackingCode(trackingCode);
        setFinalAmountForUpi(finalPayable);
        setUploadedUrlsForUpi(uploadedUrls);
        setShowUpiScreen(true);
        setIsSubmitting(false);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Free application (finalPayable == 0)
        const trackingCode = "RS" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const postName = Array.isArray(formConfig.fees_structure) 
          ? formConfig.fees_structure[selectedPostIndex]?.postName 
          : "Default Post";

        const { error: dbError } = await supabase.from("user_applications").insert([{
          tracking_id: trackingCode,
          user_id: userId || null,
          form_id: id,
          full_name: formData.fullName,
          father_name: formData.fatherName,
          mother_name: formData.motherName,
          phone: formData.phone,
          email: formData.email,
          alt_phone: formData.altPhone,
          aadhar: secureAadhar,
          dob: formData.dob,
          gender: formData.gender,
          category: formData.category,
          is_pwd: formData.isPwd,
          selected_post_name: postName,
          documents_urls: uploadedUrls,
          total_paid: 0,
          coupon_applied: appliedCoupon ? appliedCoupon.code : null,
          payment_status: "free", 
          application_status: "Received"
        }]);

        if (dbError) throw dbError;
        try { sessionStorage.removeItem(`form_draft_${id}`); } catch (e) {}

        if (appliedCoupon) {
          const { error: rpcErr2 } = await supabase.rpc('increment_coupon_usage', { coupon_id: appliedCoupon.id });
          if (rpcErr2) {
            await supabase.from("coupons").update({ used_count: appliedCoupon.used_count + 1 }).eq("id", appliedCoupon.id);
          }
        }

        setSuccessTrackingId(trackingCode);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred during submission.");
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  if (!formConfig) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Form Not Found or Expired.</div>;

  // ── UPI Manual Payment Screen ────────────────────────────────────────────
  const handleUtrSubmit = async () => {
    setUtrError("");
    if (paymentExpired) { setUtrError("Order expire ho gaya. Kripya dobara apply karein."); return; }
    if (!utrInput.trim()) { setUtrError("UTR number daalna zaroori hai."); return; }
    if (!/^\d{12}$/.test(utrInput.trim())) { setUtrError("UTR number 12 digit ka hona chahiye (sirf numbers)."); return; }
    setSubmittingUtr(true);
    try {
      const res = await fetch("/api/utr-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_id: pendingTrackingCode,
          utr_number: utrInput.trim(),
          screenshot_url: screenshotUrl || null,
          declared_amount: finalAmountForUpi,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setUtrError(data.error || "UTR submit karne mein dikkat aayi."); return; }
      // Show success screen
      setSuccessTrackingId(pendingTrackingCode);
      setShowUpiScreen(false);
    } catch (err: any) {
      setUtrError(err.message || "Unexpected error. Please try again.");
    } finally {
      setSubmittingUtr(false);
    }
  };

  // ── Payment Expired Screen ────────────────────────────────────────────────
  if (paymentExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-950 dark:to-red-950 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center bg-white dark:bg-gray-900 rounded-3xl border border-red-100 dark:border-red-900/40 p-8 shadow-xl">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-xl font-black text-red-600 dark:text-red-400 mb-2">Payment Time Out!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            15 minute mein payment nahi mili. Aapka order expire ho gaya.
            <br /><span className="font-bold text-gray-700 dark:text-gray-300">Kripya dobara apply karein.</span>
          </p>
          <button
            onClick={() => {
              setPaymentExpired(false);
              setShowUpiScreen(false);
              setPaymentTimeLeft(15 * 60);
              setUtrInput("");
              setScreenshotUrl("");
              setScreenshotFile(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg"
          >
            🔄 Dobara Apply Karo
          </button>
          <p className="text-xs text-gray-400 mt-4">Tracking ID: <strong className="text-indigo-500">{pendingTrackingCode}</strong></p>
          <p className="text-xs text-gray-400 mt-1">Agar payment ho gayi thi toh WhatsApp karo — <a href="https://wa.me/91XXXXXXXXXX" target="_blank" className="text-indigo-500 underline">Help Line</a></p>
        </div>
      </div>
    );
  }

  if (showUpiScreen && upiSettings) {
    const upiId = upiSettings.upi_id || "";
    const accountName = upiSettings.account_name || "Rojgar Suvidha";
    const amount = finalAmountForUpi;
    const txnNote = encodeURIComponent(`RojgarSuvidha-${pendingTrackingCode}`);
    const txnName = encodeURIComponent(accountName);

    // ── Dynamic UPI Deep Link (amount locked, user cannot edit) ──
    const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${txnName}&am=${amount}&cu=INR&tn=${txnNote}`;

    // ── Dynamic QR via Google Charts API (free, no library needed) ──
    const dynamicQrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(upiDeepLink)}&choe=UTF-8`;

    // ── UPI App Deep Links (amount pre-filled, user cannot change) ──
    const phonePeLink = `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${txnName}&am=${amount}&cu=INR&tn=${txnNote}`;
    const googlePayLink = `tez://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${txnName}&am=${amount}&cu=INR&tn=${txnNote}`;
    const paytmLink = `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${txnName}&am=${amount}&cu=INR&tn=${txnNote}`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 py-8 px-4 flex items-start justify-center">
        <div className="max-w-md w-full space-y-4">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex w-16 h-16 bg-indigo-600 rounded-2xl items-center justify-center mb-3 shadow-lg shadow-indigo-500/30">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">UPI Se Pay Karo</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Payment karo aur UTR number submit karo — 30 min mein verify ho jayega
            </p>
          </div>

          {/* Live Countdown Timer */}
          {(() => {
            const mins = Math.floor(paymentTimeLeft / 60).toString().padStart(2, "0");
            const secs = (paymentTimeLeft % 60).toString().padStart(2, "0");
            const isUrgent = paymentTimeLeft < 180; // last 3 min = red
            return (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border font-bold text-sm ${
                isUrgent
                  ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                  : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
              }`}>
                <Clock className={`w-5 h-5 shrink-0 ${isUrgent ? "animate-pulse" : ""}`} />
                <div className="flex-1">
                  <p className="font-black">⏱️ {mins}:{secs} mein pay karke UTR submit karo</p>
                  <p className="text-xs font-medium opacity-70">Time khatam hone ke baad order expire ho jayega</p>
                </div>
                <span className={`text-lg font-black tabular-nums ${isUrgent ? "text-red-600" : "text-amber-700 dark:text-amber-400"}`}>
                  {mins}:{secs}
                </span>
              </div>
            );
          })()}

          {/* Amount Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-center text-white shadow-2xl shadow-indigo-500/30">
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Total Amount</p>
            <div className="text-5xl font-black mb-1">₹{amount}</div>
            <p className="text-indigo-200 text-sm">{formConfig?.title || "Form Filling Service"}</p>
            <div className="mt-3 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-xs font-black text-white/90">Amount Locked — Edit Nahi Ho Sakta</span>
            </div>
          </div>

          {/* Dynamic QR + UPI ID */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            {/* Dynamic QR Code */}
            <div className="flex flex-col items-center mb-5">
              <div className="relative">
                {/* QR Border glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur opacity-20" />
                <img
                  src={dynamicQrUrl}
                  alt={`UPI QR - ₹${amount} to ${accountName}`}
                  width={200}
                  height={200}
                  className="relative w-48 h-48 object-contain rounded-2xl border-2 border-indigo-100 dark:border-indigo-900 bg-white p-2"
                  onError={(e) => {
                    // Fallback to static QR if dynamic fails
                    if (upiSettings.qr_image_url) {
                      (e.target as HTMLImageElement).src = upiSettings.qr_image_url;
                    }
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 font-semibold mt-3">Scan karke <strong className="text-indigo-600 dark:text-indigo-400">₹{amount}</strong> pay karo</p>
              <p className="text-[10px] text-gray-400 mt-1">⚡ Amount auto-fill hoga — change nahi hoga</p>
            </div>

            {/* UPI App Buttons */}
            <div className="mb-4">
              <p className="text-xs text-gray-400 font-bold text-center mb-2.5">YA APNI APP SE DIRECT PAY KARO</p>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={phonePeLink}
                  className="flex flex-col items-center gap-1 p-2.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-xl hover:bg-purple-100 active:scale-95 transition-all"
                >
                  <span className="text-xl">📱</span>
                  <span className="text-[10px] font-black text-purple-700 dark:text-purple-400">PhonePe</span>
                  <span className="text-[9px] text-purple-500 font-bold">₹{amount}</span>
                </a>
                <a
                  href={googlePayLink}
                  className="flex flex-col items-center gap-1 p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl hover:bg-blue-100 active:scale-95 transition-all"
                >
                  <span className="text-xl">💙</span>
                  <span className="text-[10px] font-black text-blue-700 dark:text-blue-400">GPay</span>
                  <span className="text-[9px] text-blue-500 font-bold">₹{amount}</span>
                </a>
                <a
                  href={paytmLink}
                  className="flex flex-col items-center gap-1 p-2.5 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 rounded-xl hover:bg-sky-100 active:scale-95 transition-all"
                >
                  <span className="text-xl">💸</span>
                  <span className="text-[10px] font-black text-sky-700 dark:text-sky-400">Paytm</span>
                  <span className="text-[9px] text-sky-500 font-bold">₹{amount}</span>
                </a>
              </div>
            </div>

            {/* UPI ID Manual Copy */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-xs text-gray-400 font-bold text-center mb-2">YA SEEDHA UPI ID PAR BHEJO</p>
              <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs text-gray-400">UPI ID</p>
                  <p className="font-black text-indigo-700 dark:text-indigo-300 text-sm">{upiId || "Loading..."}</p>
                </div>
                <button
                  onClick={() => copyUpiId(upiId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all"
                >
                  {utrCopied ? <CheckCircle2 className="w-3 h-3 text-green-300" /> : <Copy className="w-3 h-3" />}
                  {utrCopied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">Account: <strong className="text-gray-600 dark:text-gray-300">{accountName}</strong></p>
              <p className="text-center text-xs font-black text-red-500 mt-1">⚠️ EXACT ₹{amount} hi bhejo — kam/zyada mat karna</p>
            </div>
          </div>

          {/* UTR Input */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> Payment ke Baad UTR Daalo
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              GPay/PhonePe → Transaction History → 12-digit UTR number copy karo
            </p>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={12}
              value={utrInput}
              onChange={e => { setUtrInput(e.target.value.replace(/\D/g, "")); setUtrError(""); }}
              placeholder="123456789012 (12 digits)"
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 focus:border-indigo-500 rounded-xl text-center text-xl font-black text-gray-900 dark:text-white bg-white dark:bg-gray-800 outline-none tracking-widest placeholder:text-gray-300 placeholder:font-normal placeholder:text-base placeholder:tracking-normal"
            />
            {utrError && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {utrError}
              </div>
            )}

            {/* ── Screenshot Upload (Optional but recommended) ── */}
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="text-xs font-black text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Payment Screenshot Upload Karo
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[9px] font-black px-1.5 py-0.5 rounded-full ml-1">JALDI VERIFY</span>
              </label>
              <p className="text-[11px] text-gray-400 mb-2.5">Screenshot se admin ko manually PhonePe check nahi karna padta — faster approval!</p>

              {screenshotUrl ? (
                <div className="relative">
                  <img src={screenshotUrl} className="w-full max-h-48 object-contain rounded-xl border border-green-200 dark:border-green-900/40 bg-gray-50" alt="Payment screenshot" />
                  <button
                    onClick={() => { setScreenshotUrl(""); setScreenshotFile(null); }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="mt-1.5 text-xs text-green-600 dark:text-green-400 font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Screenshot upload ho gayi — jaldi verify hogi!
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-xl p-5 cursor-pointer transition-all bg-gray-50 dark:bg-gray-800/30">
                  {uploadingScreenshot
                    ? <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                    : <Camera className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                  }
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      {uploadingScreenshot ? "Upload ho rahi hai..." : "Tap karke screenshot select karo"}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">JPG / PNG — max 2MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) { setScreenshotFile(f); await uploadScreenshot(f); }
                    }}
                  />
                </label>
              )}
            </div>

            <button
              onClick={handleUtrSubmit}
              disabled={submittingUtr || utrInput.length !== 12 || paymentExpired}
              className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl transition-all text-sm shadow-lg shadow-green-500/20"
            >
              {submittingUtr ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {submittingUtr ? "Submit Ho Raha Hai..." : "UTR Submit Karo → Application Confirm"}
            </button>
          </div>

          {/* Help Text */}
          <div className="text-center text-xs text-gray-400 pb-4 space-y-1">
            <p>Tracking ID: <strong className="text-indigo-600 dark:text-indigo-400">{pendingTrackingCode}</strong></p>
            <p>Koi dikkat? WhatsApp karo: <a href="https://wa.me/91XXXXXXXXXX" className="text-indigo-500 underline" target="_blank">Help Line</a></p>
          </div>
        </div>
      </div>
    );
  }

  // ── Premium Confetti Success Screen (W4) ─────────────────────────────────

  if (successTrackingId) {
    const jobName = Array.isArray(formConfig?.fees_structure) && formConfig.fees_structure[selectedPostIndex]?.postName
      ? formConfig.fees_structure[selectedPostIndex].postName
      : formConfig?.title || "Government Job";
    const todayStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const trackLink = `/track/${successTrackingId}`;
    const waText = encodeURIComponent(`Mera Apply For Me order confirm hua! Tracking ID: ${successTrackingId}. Check karo: https://www.rojgarsuvidha.com${trackLink}`);

    return (
      <>
        <style>{`
          @keyframes confettiFall {
            0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
          @keyframes successPop {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.08); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes trackingSlide {
            from { transform: translateY(30px); opacity: 0; }
            to   { transform: translateY(0); opacity: 1; }
          }
          .confetti-piece {
            position: fixed;
            width: 10px;
            height: 10px;
            top: -20px;
            animation: confettiFall linear forwards;
          }
          .success-pop { animation: successPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
          .tracking-slide { animation: trackingSlide 0.5s 0.3s ease-out both; }
          .step-done { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; border-color: transparent; }
          .step-todo { background: #f1f5f9; color: #94a3b8; border-color: #e2e8f0; }
        `}</style>

        {/* Confetti Pieces */}
        {Array.from({ length: 60 }).map((_, i) => {
          const colors = ["#4f46e5", "#7c3aed", "#db2777", "#f59e0b", "#10b981", "#3b82f6", "#ec4899"];
          const color = colors[i % colors.length];
          const left = Math.random() * 100;
          const delay = Math.random() * 3;
          const dur = 3 + Math.random() * 4;
          const size = 6 + Math.random() * 10;
          const isCircle = Math.random() > 0.5;
          return (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${left}%`,
                background: color,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: isCircle ? "50%" : "2px",
                animationDelay: `${delay}s`,
                animationDuration: `${dur}s`,
              }}
            />
          );
        })}

        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 py-12 px-4 flex items-center justify-center overflow-hidden">
          <div className="max-w-lg w-full space-y-5 relative z-10">

            {/* Success Hero */}
            <div className="text-center success-pop">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
                  <span className="text-5xl">⏳</span>
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
                  UTR Submitted!
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                  Aapka UTR number receive hua! <strong>30 minutes</strong> mein payment verify hogi. Verify hone par WhatsApp notification milegi.
                </p>
              </div>
            </div>

            {/* Tracking ID Hero Card */}
            <div className="tracking-slide bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-center shadow-2xl shadow-indigo-500/30 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[3px] mb-2">Your Tracking ID</p>
              <div className="text-4xl font-black font-mono tracking-[5px] mb-1">{successTrackingId}</div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-black px-4 py-2 rounded-xl transition-all"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-300" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy ID"}
                </button>
                <a
                  href={trackLink}
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-black px-4 py-2 rounded-xl transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Track Order
                </a>
              </div>
            </div>

            {/* Order Receipt Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Receipt</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Invoice No: RS-{successTrackingId}</p>
                </div>
                <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full">⏳ Verification Pending</span>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { label: "Service", value: "Apply For Me — Form Filling" },
                  { label: "Applied For", value: jobName },
                  { label: "Applicant", value: formData.fullName },
                  { label: "Date", value: todayStr },
                  { label: "Amount", value: `₹${finalAmountForUpi || finalPayable || 0}` },
                  { label: "Payment Status", value: "⏳ Verification Pending (30 min)" },
                ].map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-3">
                    <span className="text-xs text-gray-400 font-semibold shrink-0">{row.label}</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Timeline */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Application Progress</p>
              <div className="flex items-center">
                {["Received", "Processing", "Submitted", "Done"].map((step, i) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-black text-xs ${i === 0 ? "step-done shadow-lg shadow-indigo-500/30" : "step-todo dark:bg-gray-800 dark:border-gray-700"}`}>
                        {i === 0 ? "✓" : i + 1}
                      </div>
                      <p className={`text-[9px] font-bold mt-1.5 ${i === 0 ? "text-indigo-600" : "text-gray-400"}`}>{step}</p>
                    </div>
                    {i < 3 && <div className={`flex-1 h-0.5 mx-1 rounded-full ${i === 0 ? "bg-indigo-200" : "bg-gray-100 dark:bg-gray-800"}`} />}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/dashboard?tab=applications")}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 text-sm"
              >
                📋 Full Dashboard & Tracking
              </button>
              <a
                href={`https://wa.me/?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-black rounded-2xl transition-all active:scale-95 text-sm text-center block"
              >
                💬 Share on WhatsApp
              </a>
              <button
                onClick={() => router.push("/latest-jobs")}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-all text-sm"
              >
                🔍 Browse More Jobs
              </button>
            </div>

          </div>
        </div>
      </>
    );
  }


  const isMultiPost = Array.isArray(formConfig.fees_structure) && formConfig.fees_structure.length > 1;

  return (
    <>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-4">
        
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors mb-2 self-start">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Apply For: <span className="text-indigo-600">{formConfig.title}</span>
          </h1>
          <p className="text-gray-500 mt-2">Documents upload karo — hamari expert team galti-free form submit karegi. <span className="text-indigo-600 font-bold">Form Hamara, Naukri Aapki</span> ✅</p>
        </div>

        {/* Compliance Official Link Banner */}
        {(() => {
          const portal = getOfficialPortal(formConfig.title);
          return (
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex items-start gap-2.5 text-left">
              <span className="text-sm shrink-0 mt-0.5">ℹ️</span>
              <div className="text-xs text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed font-semibold">
                This form filling assistance service is managed by Rojgar Suvidha (private agency). 
                The official recruitment application portal is:{" "}
                {portal.startsWith("http") ? (
                  <a href={portal} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline font-extrabold inline-flex items-center gap-0.5">
                    {portal.replace("https://", "")} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="font-extrabold text-indigo-800 dark:text-indigo-250">{portal}</span>
                )}
                . We charge a facilitation service fee of ₹50 to securely assist candidates in form submission.
              </div>
            </div>
          );
        })()}

        {submitError && (
          <div className="p-4 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-200 text-center">
            {submitError}
          </div>
        )}

        {/* 🔥 FOMO Bar — shows live Apply For Me count for this job */}
        <ApplyFomoBar
          identifier={String(id)}
          category={formConfig?.category || "default"}
          lastDate={formConfig?.last_date}
          compact
        />

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* Basic Details */}
          <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
              <CheckCircle2 className="h-6 w-6 text-indigo-500" /> Basic Details
            </h3>
            
            {isMultiPost && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 mb-6">
                <label className="block text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Select Post You Want to Apply For
                </label>
                <select 
                  value={selectedPostIndex} 
                  onChange={e => setSelectedPostIndex(Number(e.target.value))} 
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-900 dark:text-white text-lg"
                >
                  {formConfig.fees_structure.map((post: any, idx: number) => (
                    <option key={idx} value={idx}>{post.postName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Full Name (As per 10th)</label>
                <input type="text" value={formData.fullName} onChange={e=>setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Date of Birth</label>
                <input type="date" value={formData.dob} onChange={e=>setFormData({...formData, dob: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Phone Number (WhatsApp)</label>
                <input type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Father's Name</label>
                <input type="text" value={formData.fatherName} onChange={e=>setFormData({...formData, fatherName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Mother's Name</label>
                <input type="text" value={formData.motherName} onChange={e=>setFormData({...formData, motherName: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Email ID</label>
                <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Alternate Phone</label>
                <input type="tel" value={formData.altPhone} onChange={e=>setFormData({...formData, altPhone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Aadhar Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{12}"
                  maxLength={12}
                  placeholder="Enter 12-digit Aadhar number"
                  value={formData.aadhar}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                    setFormData({ ...formData, aadhar: val });
                  }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* These fields control the dynamic fee */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Gender</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="gen">General / UR</option>
                  <option value="obc">OBC / EWS</option>
                  <option value="sc_st">SC / ST</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">PH / Divyang?</label>
                <select value={formData.isPwd} onChange={e => setFormData({...formData, isPwd: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>

            </div>
          </div>

          {/* Dynamic Documents */}
          {formConfig.documents?.length > 0 && (
            <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
                <UploadCloud className="h-6 w-6 text-indigo-500" /> Required Documents
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formConfig.documents.map((doc: string, idx: number) => {
                  const lockerMatch = findLockerMatch(doc);
                  const hasLocker = !!lockerMatch;
                  const hasFile = !!documentFiles[doc];
                  
                  return (
                    <div key={idx} className={`relative p-4 border rounded-2xl transition-colors ${hasFile ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/10' : hasLocker ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                      
                      {/* Locker Badge + Clear Button */}
                      {hasLocker && !hasFile && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full">From Locker 🔒</span>
                          <button
                            type="button"
                            onClick={() => setOverriddenDocs(prev => new Set([...prev, doc]))}
                            className="text-[10px] font-bold text-red-400 hover:text-red-600 underline"
                          >
                            ✕ Use different file
                          </button>
                        </div>
                      )}

                      {/* File Badge + Clear Button */}
                      {hasFile && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">📎 New File</span>
                          <button
                            type="button"
                            onClick={() => setDocumentFiles(prev => { const n = {...prev}; delete n[doc]; return n; })}
                            className="text-[10px] font-bold text-red-400 hover:text-red-600 underline"
                          >
                            ✕ Remove
                          </button>
                        </div>
                      )}

                      <label className={`flex flex-col items-center justify-center cursor-pointer min-h-[4rem] text-center ${hasFile || hasLocker ? '' : ''}`}>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{doc}</span>
                        {hasFile ? (
                          <span className="text-xs text-blue-600 font-bold mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {documentFiles[doc]?.name}
                          </span>
                        ) : hasLocker ? (
                          <span className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Auto-filled from locker
                          </span>
                        ) : (
                          <span className="text-xs text-indigo-500 mt-1">Click to Upload (PDF/JPG)</span>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileChange(doc, e.target.files?.[0] || null)} 
                        />
                      </label>

                      {/* Restore locker match option */}
                      {overriddenDocs.has(doc) && !hasFile && (
                        <button
                          type="button"
                          onClick={() => setOverriddenDocs(prev => { const n = new Set(prev); n.delete(doc); return n; })}
                          className="mt-1 text-[10px] font-bold text-indigo-500 hover:underline"
                        >
                          ↩ Use locker file instead
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment & Coupon Section */}
          <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 space-y-6">
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              {!appliedCoupon ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Have a Coupon Code?" 
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wide font-bold"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={handleApplyCoupon}
                    disabled={validatingCoupon || !couponCodeInput.trim()}
                    className="px-6 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center"
                  >
                    {validatingCoupon ? <Loader2 className="h-5 w-5 animate-spin" /> : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-800/50 rounded-lg">
                      <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-bold text-green-800 dark:text-green-400">{appliedCoupon.code} Applied!</p>
                      <p className="text-xs text-green-600 dark:text-green-500 font-medium">
                        You saved ₹{discountAmount} on the Portal Service Charge.
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={removeCoupon} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              {couponError && <p className="text-sm text-red-500 font-medium mt-2">{couponError}</p>}
            </div>

            {/* Enhanced Pricing Breakdown Section */}
            <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 space-y-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-200/50 dark:border-zinc-800 pb-2">
                💰 Payment Summary & Breakdown
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-semibold text-gray-600 dark:text-gray-300">
                  <span>Official Form Fee</span>
                  <span className="font-extrabold text-gray-900 dark:text-white">₹{baseFee}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-gray-600 dark:text-gray-300">
                  <span>Portal Service Charge</span>
                  <span className="font-extrabold text-gray-900 dark:text-white">₹{serviceCharge}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm font-black text-emerald-600 dark:text-emerald-400">
                    <span>Coupon Discount</span>
                    <span>- ₹{discountAmount}</span>
                  </div>
                )}
              </div>

              {/* Informational routing banner */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-3.5 text-[11px] leading-relaxed text-indigo-700 dark:text-indigo-300 font-medium">
                ℹ️ <strong>Service Scope:</strong> Rojgar Suvidha collects the Official Exam Fee (₹{baseFee}) to submit it directly to the official government recruitment portal. Our processing/facilitation service charge is limited to ₹{serviceCharge} only.
              </div>
            </div>

            <div className="mt-4 p-6 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white flex items-center justify-between shadow-lg">
              <div>
                <p className="text-indigo-100 font-medium">Total Payable Amount</p>
                <p className="text-xs text-indigo-200 mt-1">Official Fee + Portal Charge</p>
              </div>
              <div className="text-4xl font-black">
                ₹{finalPayable}
              </div>
            </div>

            {/* Merchant billing information & policy agreement */}
            <div className="mt-4 space-y-3 px-1">
              {/* Mandatory Consent Checkbox */}
              <label className="flex items-start gap-3 p-3.5 border border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                <div className="flex items-center h-5 mt-0.5">
                  <input 
                    type="checkbox" 
                    checked={isAuthorized}
                    onChange={(e) => setIsAuthorized(e.target.checked)}
                    className="w-4.5 h-4.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
                <div className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 font-bold">
                  I authorize Rojgar Suvidha to fill the recruitment form and pay the official fee of ₹{baseFee} on my behalf. I agree to the <Link href="/refund-policy" className="text-indigo-500 hover:underline">Refund Policy</Link> and <Link href="/terms" className="text-indigo-500 hover:underline">Terms of Service</Link>.
                </div>
              </label>

              <div className="text-center space-y-1.5 pt-1">
                <p className="text-[11px] text-gray-400 leading-normal font-semibold">
                  Secure payments processed via Cashfree. Your billing statement will show charge under registered merchant: <strong className="text-gray-600 dark:text-gray-300">PINTU KUMAR</strong>.
                </p>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !isAuthorized} 
              className="w-full mt-2 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-lg rounded-2xl shadow-xl hover:scale-[1.01] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <><Loader2 className="h-6 w-6 animate-spin" /> Submitting securely...</>
              ) : finalPayable > 0 ? (
                `Proceed to Payment (₹${finalPayable}) →`
              ) : (
                "Submit Application"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
    </>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <ApplyContent />
    </Suspense>
  );
}
