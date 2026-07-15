"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, AlertCircle, Camera, Award } from "lucide-react";

export default function ProfileStrengthMeter({ user, profile, avatarUrl }: { user: any, profile: any, avatarUrl: string | null }) {
  const [strength, setStrength] = useState(0);
  const [missing, setMissing] = useState<{label: string, action: string, link: string}[]>([]);

  useEffect(() => {
    let score = 0;
    const missingItems = [];

    // Base email (usually present)
    if (user?.email) {
      score += 20;
    }

    // Full name
    if (profile?.full_name) {
      score += 20;
    } else {
      missingItems.push({ label: "Add your full name", action: "Add", link: "/profile-setup" });
    }

    // Phone number (Critical for Apply For Me)
    if (profile?.mobile_number) {
      score += 30;
    } else {
      missingItems.push({ label: "Add your mobile number", action: "Verify", link: "/profile-setup" });
    }

    // Basic details
    if (profile?.date_of_birth || profile?.gender || profile?.category) {
      score += 15;
    } else {
      missingItems.push({ label: "Add basic details (DOB, Gender)", action: "Update", link: "/profile-setup" });
    }

    // Avatar
    if (avatarUrl) {
      score += 15;
    } else {
      missingItems.push({ label: "Upload profile picture", action: "Upload", link: "#avatar-upload" });
    }

    setStrength(score);
    setMissing(missingItems.slice(0, 2)); // Only show top 2 missing items
  }, [user, profile, avatarUrl]);

  if (strength >= 100) {
    return (
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-emerald-500/20 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-20 rotate-12 scale-150">
          <Award className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl shrink-0 backdrop-blur-md">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold mb-1">Superstar Profile! 🌟</h3>
            <p className="text-emerald-50 font-medium">Your profile is 100% complete. You are ready to apply for any government job in seconds.</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate SVG circle properties
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (strength / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6 md:items-center">
        
        {/* Circular Progress */}
        <div className="flex items-center gap-5 shrink-0">
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="transparent"
                strokeWidth="8"
                className="stroke-gray-100 dark:stroke-gray-800"
              />
              {/* Progress Circle */}
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="transparent"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="stroke-indigo-500 transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-lg font-extrabold text-gray-900 dark:text-white leading-none">{strength}%</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-1">Profile Strength</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight max-w-xs">
              Complete your profile to unlock 1-click apply and instant job matches.
            </p>
          </div>
        </div>

        {/* Action Items */}
        <div className="flex-1 space-y-2 w-full">
          {missing.map((item, i) => (
            <Link 
              key={i} 
              href={item.link}
              onClick={(e) => {
                if (item.link === "#avatar-upload") {
                  e.preventDefault();
                  document.getElementById("avatar-upload-btn")?.click();
                }
              }}
              className="group flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {item.link === "#avatar-upload" ? (
                  <Camera className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
                )}
                <span className="text-sm font-bold text-amber-900 dark:text-amber-500">{item.label}</span>
              </div>
              <span className="flex items-center text-xs font-bold text-amber-700 dark:text-amber-400">
                {item.action} <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
