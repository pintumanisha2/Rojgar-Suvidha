"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Briefcase, Lock, Mail, Loader2, ShieldCheck } from "lucide-react";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaInput, setCaptchaInput] = useState("");
  
  // Brute Force Protection State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  const router = useRouter();

  // Handle lockout timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLocked && lockoutTimeLeft > 0) {
      timer = setTimeout(() => setLockoutTimeLeft(prev => prev - 1), 1000);
    } else if (isLocked && lockoutTimeLeft <= 0) {
      setIsLocked(false);
      setFailedAttempts(0);
      setError(null);
    }
    return () => clearTimeout(timer);
  }, [isLocked, lockoutTimeLeft]);

  // Generate random numbers for CAPTCHA on mount
  useEffect(() => {
    setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (parseInt(captchaInput) !== captchaNum1 + captchaNum2) {
      handleFailedAttempt("Incorrect CAPTCHA answer.");
      setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
      setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
      setCaptchaInput("");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Double check if this user is actually an admin before letting them in
        const { data: roleData } = await supabase
          .from('admin_roles')
          .select('role, status')
          .eq('email', data.user.email)
          .single();

        const isSuperAdminFallback = data.user.email === "admin@rojgarsuvidha.com" || data.user.email === "superadmin@rojgarsuvidha.com";

        if ((!roleData || roleData.status === 'Inactive') && !isSuperAdminFallback) {
          // If not an admin, immediately log them out and throw error
          await supabase.auth.signOut();
          throw new Error("Access Denied: This portal is strictly for authorized personnel only.");
        }

        setFailedAttempts(0); // Reset on success
        
        // Force a hard redirect instead of relying on Next.js router or AdminLayout listeners
        // This completely fixes the "spinning forever" issue
        window.location.href = "/admin";
        return; 
      }
    } catch (err: any) {
      setLoading(false);
      handleFailedAttempt(err.message || "Invalid email or password.");
    }
  };

  const handleFailedAttempt = (msg: string) => {
    const newCount = failedAttempts + 1;
    setFailedAttempts(newCount);
    
    if (newCount >= 3) {
      setIsLocked(true);
      setLockoutTimeLeft(180); // 3 minutes lockout
      setError("Maximum login attempts reached. Your account is temporarily locked for security. Try again in 3 minutes.");
    } else {
      setError(`${msg} (${3 - newCount} attempts remaining)`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg mb-6">
          <ShieldCheck className="h-10 w-10 text-white" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Sign in to manage jobs, results, and applications.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow-xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="admin@rojgarsuvidha.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Math CAPTCHA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Security Verification
              </label>
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2.5 rounded-xl font-extrabold text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-700 tracking-wider">
                  {captchaNum1} + {captchaNum2} = ?
                </div>
                <input
                  type="number"
                  required
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Enter answer"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isLocked ? (
                `Locked (${Math.floor(lockoutTimeLeft / 60)}:${(lockoutTimeLeft % 60).toString().padStart(2, '0')})`
              ) : loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
