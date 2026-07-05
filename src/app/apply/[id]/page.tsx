"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, UploadCloud, CheckCircle2, ShieldCheck, Briefcase, Ticket, X, CheckCircle } from "lucide-react";
import Script from "next/script";
import imageCompression from "browser-image-compression";

function ApplyContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formConfig, setFormConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // User Inputs
  const [formData, setFormData] = useState({
    fullName: "",
    fatherName: "",
    motherName: "",
    phone: "",
    email: "",
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
  const [token, setToken] = useState("");



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

  useEffect(() => {
    const fetchForm = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.from("custom_forms").select("*").eq("id", id).single();
        if (data) {
          setFormConfig(data);
          
          // Initialize empty document states
          if (data.documents && data.documents.length > 0) {
            const docState: any = {};
            data.documents.forEach((doc: string) => docState[doc] = null);
            setDocumentFiles(docState);
          }
        }
        
        // Check Session & Fetch Locker Documents
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Force login before applying, with exact redirect parameter
          const fullUrl = window.location.pathname + window.location.search;
          router.push(`/login?redirect=${encodeURIComponent(fullUrl)}`);
          return;
        }

        if (session) {
          setToken(session.access_token);
          // Auto-fill profile data
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, mobile_number, father_name, mother_name, date_of_birth, gender, category")
            .eq("id", session.user.id)
            .single();

          if (profileData) {
            setFormData(prev => ({
              ...prev,
              fullName: profileData.full_name || prev.fullName,
              fatherName: profileData.father_name || prev.fatherName,
              motherName: profileData.mother_name || prev.motherName,
              phone: profileData.mobile_number || prev.phone,
              email: session.user.email || prev.email,
              dob: profileData.date_of_birth || prev.dob,
              gender: profileData.gender || prev.gender,
              category: profileData.category || prev.category,
            }));
          }

          // Fetch Locker Documents
          const { data: lockerData } = await supabase
            .from("user_locker")
            .select("documents")
            .eq("user_id", session.user.id)
            .single();

          if (lockerData && lockerData.documents) {
            setLockerDocs(lockerData.documents);
          }
        }

      } catch (error) {
        console.error("Error fetching form:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

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
    if (!formConfig || !formConfig.fees_structure || formConfig.fees_structure.length === 0) return;
    
    let currentFeeStructure = formConfig.fees_structure;
    if (Array.isArray(formConfig.fees_structure)) {
      currentFeeStructure = formConfig.fees_structure[selectedPostIndex]?.fees || {};
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

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCodeInput.trim().toUpperCase())
      .single();

    if (error || !data) {
      setCouponError("Invalid coupon code");
      setValidatingCoupon(false);
      return;
    }

    if (data.status !== "active" || data.used_count >= data.max_uses) {
      setCouponError("This coupon has expired or reached its usage limit");
      setValidatingCoupon(false);
      return;
    }

    setAppliedCoupon(data);
    setCouponError("");
    setCouponCodeInput("");
    setValidatingCoupon(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
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
    // 1. Exact match first
    if (lockerDocs[docName]) return lockerDocs[docName];
    // 2. Case-insensitive exact match
    const exactCI = Object.keys(lockerDocs).find(k => normalize(k) === target);
    if (exactCI) return lockerDocs[exactCI];
    // 3. Fuzzy: locker key contains or is contained in doc name
    const fuzzy = Object.keys(lockerDocs).find(k => {
      const kn = normalize(k);
      return kn.includes(target) || target.includes(kn) ||
        // Check if 80%+ characters match (handles 1-2 typos)
        (target.length > 4 && kn.length > 4 && (
          target.split("").filter(c => kn.includes(c)).length / Math.max(target.length, kn.length) > 0.8
        ));
    });
    return fuzzy ? lockerDocs[fuzzy] : null;
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
    
    // Validate Required Documents (Must have either File or Locker URL, using fuzzy match)
    if (formConfig.documents && formConfig.documents.length > 0) {
      const missingDocs = formConfig.documents.filter((doc: string) => !documentFiles[doc] && !findLockerMatch(doc));
      if (missingDocs.length > 0) {
        setSubmitError(`Please upload the following required documents: ${missingDocs.join(", ")}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
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
      }      // 2. Cashfree Payment Flow
      if (finalPayable > 0) {
        const trackingCode = "RS" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const customOrderId = `order_${trackingCode}_${Date.now()}`;

        // Create Order on Backend with custom S3 access order ID
        const orderRes = await fetch("/api/submit-application", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            amount: finalPayable,
            customerName: formData.fullName,
            customerPhone: formData.phone,
            customerEmail: formData.email,
            formId: id,
            orderId: customOrderId
          }),
        });

        const order = await orderRes.json();

        if (!orderRes.ok) {
          throw new Error(order.error || "Payment system is currently unavailable.");
        }

        const postName = Array.isArray(formConfig.fees_structure) 
          ? formConfig.fees_structure[selectedPostIndex]?.postName 
          : "Default Post";

        // Save Application to Database as 'pending' to secure user input before payment redirect
        const { error: dbError } = await supabase.from("user_applications").insert([{
          tracking_id: trackingCode,
          form_id: id,
          full_name: formData.fullName,
          father_name: formData.fatherName,
          mother_name: formData.motherName,
          phone: formData.phone,
          email: formData.email,
          alt_phone: formData.altPhone,
          aadhar: formData.aadhar,
          dob: formData.dob,
          gender: formData.gender,
          category: formData.category,
          is_pwd: formData.isPwd,
          selected_post_name: postName,
          documents_urls: uploadedUrls,
          total_paid: finalPayable,
          coupon_applied: appliedCoupon ? appliedCoupon.code : null,
          payment_status: "pending", // Set as pending initially
          application_status: "Received"
        }]);

        if (dbError) throw dbError;

        // Open Cashfree Checkout Modal
        const cashfree = new (window as any).Cashfree({
             mode: process.env.NEXT_PUBLIC_CASHFREE_MODE || "sandbox",
        });

        const checkoutOptions = {
            paymentSessionId: order.payment_session_id,
            redirectTarget: "_modal",
        };

        cashfree.checkout(checkoutOptions).then(async (result: any) => {
            if (result.error) {
                setSubmitError(`Payment failed: ${result.error.message}`);
                setIsSubmitting(false);
                return;
            }
            if (result.paymentDetails) {
                try {
                  // Update payment_status to 'paid' in DB
                  const { error: updateErr } = await supabase
                    .from("user_applications")
                    .update({ payment_status: "paid" })
                    .eq("tracking_id", trackingCode);

                  if (updateErr) throw updateErr;

                  // Update Coupon Usage if applied
                  if (appliedCoupon) {
                    const { error: rpcErr } = await supabase.rpc('increment_coupon_usage', { coupon_id: appliedCoupon.id });
                    if (rpcErr) {
                      await supabase.from("coupons").update({ used_count: appliedCoupon.used_count + 1 }).eq("id", appliedCoupon.id);
                    }
                  }

                  setSuccessTrackingId(trackingCode);
                } catch (err: any) {
                  setSubmitError("Payment successful but failed to save request: " + err.message);
                } finally {
                  setIsSubmitting(false);
                }
            }
        });

      } else {
        // Free application (finalPayable == 0)
        const trackingCode = "RS" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const postName = Array.isArray(formConfig.fees_structure) 
          ? formConfig.fees_structure[selectedPostIndex]?.postName 
          : "Default Post";

        const { error: dbError } = await supabase.from("user_applications").insert([{
          tracking_id: trackingCode,
          form_id: id,
          full_name: formData.fullName,
          father_name: formData.fatherName,
          mother_name: formData.motherName,
          phone: formData.phone,
          email: formData.email,
          alt_phone: formData.altPhone,
          aadhar: formData.aadhar,
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

  // Success Screen
  if (successTrackingId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <CheckCircle className="h-10 w-10" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Application Received! 🎉</h2>
            <p className="text-gray-500 mt-2">Aapki application safely submit ho gayi hai. Ek confirmation email bhi bheja gaya hai.</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
            <p className="text-sm text-indigo-800 dark:text-indigo-300 font-bold mb-2">YOUR TRACKING ID</p>
            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-widest">{successTrackingId}</div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-3 font-medium">📸 Screenshot le lijiye — status check ke liye Dashboard mein dekh sakte hain.</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push("/dashboard?tab=applications")} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors">
              📋 Track My Application
            </button>
            <button onClick={() => router.push("/")} className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl transition-colors">
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isMultiPost = Array.isArray(formConfig.fees_structure) && formConfig.fees_structure.length > 1;

  return (
    <>
    <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Apply For: <span className="text-indigo-600">{formConfig.title}</span>
          </h1>
          <p className="text-gray-500 mt-2">Please fill in all details carefully. Our team will fill the official form on your behalf.</p>
        </div>

        {submitError && (
          <div className="p-4 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-200 text-center">
            {submitError}
          </div>
        )}

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
                <input type="text" value={formData.aadhar} onChange={e=>setFormData({...formData, aadhar: e.target.value})} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
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

            <div className="space-y-3 px-2">
              <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-400">
                <span>Official Form Fee</span>
                <span>₹{baseFee}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-400">
                <span>Portal Service Charge</span>
                <span>₹{serviceCharge}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm font-bold text-green-600 dark:text-green-400">
                  <span>Coupon Discount</span>
                  <span>- ₹{discountAmount}</span>
                </div>
              )}
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

            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-lg rounded-2xl shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100">
              {isSubmitting ? (
                <><Loader2 className="h-6 w-6 animate-spin" /> Submitting securely...</>
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
