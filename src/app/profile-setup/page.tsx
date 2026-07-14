"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, User, Phone, Calendar, CheckCircle2 } from "lucide-react";

function ProfileSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [gender, setGender] = useState("male");
  const [category, setCategory] = useState("gen");
  const [address, setAddress] = useState("");
  const [phoneLinked, setPhoneLinked] = useState(false);

  // Per-field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          router.push("/login");
          return;
        }
        if (active) {
          setUser(session.user);
        }

        // Check if profile already exists with try-catch resilience
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.full_name) {
          router.push(redirectUrl);
          return;
        }

        if (active) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Profile check failed:", err);
        if (active) setLoading(false);
      }
    };
    checkUser();
    return () => { active = false; };
  }, [router, redirectUrl]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const errors: Record<string, string> = {};

    if (!fullName.trim()) errors.fullName = "Full name is required.";
    if (!dob) {
      errors.dob = "Date of birth is required.";
    } else {
      // Minimum age validation: must be at least 10 years old
      const birthDate = new Date(dob);
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 10);
      if (birthDate > minAgeDate) {
        errors.dob = "You must be at least 10 years old to register.";
      }
    }
    if (!mobile.trim()) {
      errors.mobile = "Mobile number is required.";
    } else if (mobile.length < 10) {
      errors.mobile = "Please enter a valid 10-digit mobile number.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaving(false);
      return;
    }
    setFieldErrors({});

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName.trim(),
      date_of_birth: dob,
      mobile_number: mobile.trim(),
      father_name: fatherName.trim(),
      mother_name: motherName.trim(),
      gender,
      category,
      address: address.trim(),
    });

    if (upsertError) {
      setError(upsertError.message);
      setSaving(false);
    } else {
      // Show phone-linked confirmation before redirect
      if (mobile.trim()) setPhoneLinked(true);
      // Clear sessionStorage avatar cache so Navbar re-fetches updated profile
      try { sessionStorage.removeItem("rs_avatar_url"); } catch {}
      setTimeout(() => { window.location.href = redirectUrl; }, phoneLinked || !mobile.trim() ? 0 : 1800);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Phone linked success screen (shown briefly before redirect)
  if (phoneLinked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-950 dark:to-green-950">
        <div className="text-center px-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 shadow-xl shadow-green-500/30 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
            Profile Saved! 🎉
          </h2>
          <p className="text-green-700 dark:text-green-400 font-semibold text-base mb-1">
            ✅ Phone number link ho gaya!
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Ab aap phone OTP se bhi login kar sakte hain
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Redirecting...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex flex-col justify-center py-12 px-4">
      
      {/* Progress Bar */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-2 bg-indigo-500 rounded-full" />
          <div className="flex-1 h-2 bg-indigo-500 rounded-full" />
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
            Sirf ek baar bharo, hamesha ke liye save rahega 🎯
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-6 shadow-2xl rounded-3xl border border-gray-100 dark:border-gray-800">

          {/* Why we need this */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 mb-6 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
              Ye details aapke <strong>"Apply For Me"</strong> feature mein use hogi taaki hum aapki jagah forms bhar sakein. Aapka data 100% safe hai.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Aapka Poora Naam <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setFieldErrors(p => ({ ...p, fullName: "" })); }}
                  className={`appearance-none block w-full pl-11 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm ${
                    fieldErrors.fullName ? "border-red-400 dark:border-red-600" : "border-gray-200 dark:border-gray-700"
                  }`}
                  placeholder="e.g. Rajesh Kumar Sharma"
                />
                {fieldErrors.fullName && <p className="text-xs text-red-500 font-semibold mt-1">{fieldErrors.fullName}</p>}
              </div>
              <p className="text-xs text-gray-400 mt-1">As per your documents (Aadhar/10th Certificate)</p>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => { setDob(e.target.value); setFieldErrors(p => ({ ...p, dob: "" })); }}
                  max={new Date().toISOString().split("T")[0]}
                  className={`appearance-none block w-full pl-11 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm ${
                    fieldErrors.dob ? "border-red-400 dark:border-red-600" : "border-gray-200 dark:border-gray-700"
                  }`}
                />
                {fieldErrors.dob && <p className="text-xs text-red-500 font-semibold mt-1">{fieldErrors.dob}</p>}
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-bold border-r border-gray-300 dark:border-gray-600 pr-2">+91</span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => { setMobile(e.target.value.replace(/\D/g, "")); setFieldErrors(p => ({ ...p, mobile: "" })); }}
                  className={`appearance-none block w-full pl-20 pr-4 py-3 border rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm tracking-widest ${
                    fieldErrors.mobile ? "border-red-400 dark:border-red-600" : "border-gray-200 dark:border-gray-700"
                  }`}
                  placeholder="9876543210"
                />
                {fieldErrors.mobile && <p className="text-xs text-red-500 font-semibold mt-1">{fieldErrors.mobile}</p>}
              </div>
            </div>

            {/* Father Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Father's Name</label>
              <input type="text" value={fatherName} onChange={(e) => setFatherName(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                placeholder="e.g. Ramesh Kumar" />
            </div>

            {/* Mother Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Mother's Name</label>
              <input type="text" value={motherName} onChange={(e) => setMotherName(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                placeholder="e.g. Sunita Devi" />
            </div>

            {/* Gender & Category - side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Gender <span className="text-red-500">*</span></label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} required
                  className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Category <span className="text-red-500">*</span></label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} required
                  className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm">
                  <option value="gen">General</option>
                  <option value="obc">OBC</option>
                  <option value="sc_st">SC/ST</option>
                  <option value="ews">EWS</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Full Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
                className="appearance-none block w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm resize-none"
                placeholder="Ghar no., Mohalla, Tehsil, Jila, State, PIN" />
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-center">
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl shadow-lg shadow-indigo-500/30 text-base font-extrabold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-70"
              >
                {saving ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Saving Profile...</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Save & Continue</>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ProfileSetupContent />
    </Suspense>
  );
}
