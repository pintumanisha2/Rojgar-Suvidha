"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { usePathname } from "next/navigation";
import { Clock, Send, Phone, Play, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

// Target launch date: July 2, 2026 at 11:11 AM IST (GMT+05:30)
const LAUNCH_DATE = new Date("2026-07-02T11:11:00+05:30");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLive, setIsLive] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [showCelebration, setShowCelebration] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Check if we are on a bypassed path (Admin portal, Recruiter/Employer portal, API)
  const isBypassed =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/employer") ||
    pathname.startsWith("/api");

  // Calculate remaining time
  const calculateTimeLeft = (): TimeLeft => {
    const difference = LAUNCH_DATE.getTime() - Date.now();
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  // Launch celebration effect
  const triggerLaunchCelebration = () => {
    setShowCelebration(true);
    
    // 1. Confetti bursts
    const duration = 6 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#6366f1", "#a855f7", "#ec4899", "#3b82f6", "#eab308"],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#6366f1", "#a855f7", "#ec4899", "#3b82f6", "#eab308"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // 2. Start Fireworks Canvas
    initFireworks();

    // 3. Set live after celebration
    setTimeout(() => {
      setIsLive(true);
      setShowCelebration(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }, duration);
  };

  // Firecracker Canvas Animation Engine
  const initFireworks = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const fireworks: any[] = [];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
      gravity: number;
      decay: number;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.alpha = 1;
        this.color = color;
        this.gravity = 0.08;
        this.decay = Math.random() * 0.015 + 0.01;
      }

      draw() {
        ctx!.save();
        ctx!.globalAlpha = this.alpha;
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, Math.random() * 2 + 1, 0, Math.PI * 2);
        ctx!.fillStyle = this.color;
        ctx!.shadowBlur = 10;
        ctx!.shadowColor = this.color;
        ctx!.fill();
        ctx!.restore();
      }

      update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
      }
    }

    class Firework {
      x: number;
      y: number;
      ty: number;
      vy: number;
      color: string;
      exploded: boolean;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = canvas!.height;
        this.ty = Math.random() * (canvas!.height * 0.5) + 50;
        this.vy = -(Math.random() * 6 + 8);
        const colors = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93", "#ff007f", "#00ffff"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.exploded = false;
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx!.fillStyle = this.color;
        ctx!.shadowBlur = 8;
        ctx!.shadowColor = this.color;
        ctx!.fill();
      }

      update() {
        this.y += this.vy;
        if (this.y <= this.ty) {
          this.exploded = true;
          for (let i = 0; i < 60; i++) {
            particles.push(new Particle(this.x, this.y, this.color));
          }
        }
      }
    }

    const loop = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.08) {
        fireworks.push(new Firework());
      }

      for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].draw();
        fireworks[i].update();
        if (fireworks[i].exploded) {
          fireworks.splice(i, 1);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].draw();
        particles[i].update();
        if (particles[i].alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    loop();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  };

  useEffect(() => {
    // Check if test mode is enabled via URL search parameter (?test=true)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("test") === "true") {
        setIsTestMode(true);
      }
    }

    if (isBypassed) {
      setIsLive(true);
      return;
    }

    // Set initial states
    const initialTimeLeft = calculateTimeLeft();
    const isPast = LAUNCH_DATE.getTime() - Date.now() <= 0;
    
    if (isPast) {
      setIsLive(true);
      return;
    }

    setIsLive(false);
    setTimeLeft(initialTimeLeft);

    // Start timer interval
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      // Check if launch occurs during session
      if (remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
        clearInterval(interval);
        triggerLaunchCelebration();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [pathname, isBypassed]);

  // Handle window resizing safely on browser
  useEffect(() => {
    if (showCelebration && canvasRef.current) {
      const handleResize = () => {
        if (canvasRef.current) {
          canvasRef.current.width = window.innerWidth;
          canvasRef.current.height = window.innerHeight;
        }
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [showCelebration]);

  // Prevent flash by keeping layout empty until live state is evaluated
  if (isLive === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render original website if live
  if (isLive) {
    return <>{children}</>;
  }

  // Render Launching Soon Countdown Screen
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-gray-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden select-none">
      
      {/* Background Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Logo */}
      <header className="max-w-7xl mx-auto px-6 py-8 w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="font-black text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            Rojgar<span className="text-indigo-400">Suvidha</span>
          </span>
        </div>
        <span className="text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-full bg-white/5 border border-white/10 tracking-widest text-indigo-300">
          India's #1 Job Portal
        </span>
      </header>

      {/* Main Countdown Card */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center relative z-10 w-full">
        
        {/* Glow Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-widest mb-6">
          <Clock className="w-4 h-4" /> Coming Soon | जल्द ही लाइव हो रहा है
        </div>

        {/* Catchy Headings */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-6">
          We are launching on <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Thursday, 2nd July @ 11:11 AM IST
          </span>
        </h1>
        
        <p className="text-base sm:text-lg font-medium text-slate-300 max-w-2xl leading-relaxed mb-12">
          सारे सरकारी नौकरियों, रिजल्ट और एडमिट कार्ड्स की अपडेट सबसे तेज़! <br />
          साथ ही घर बैठे फ़ॉर्म भरने की हमारी खास <strong>"Apply For Me"</strong> सर्विस जल्द लाइव होगी।
        </p>

        {/* Glassmorphic Countdown Timer */}
        <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-2xl w-full mb-12">
          {[
            { label: "DAYS", val: timeLeft.days },
            { label: "HOURS", val: timeLeft.hours },
            { label: "MINS", val: timeLeft.minutes },
            { label: "SECS", val: timeLeft.seconds },
          ].map((item, index) => (
            <div 
              key={index}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 sm:p-6 rounded-3xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-indigo-500/30 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight drop-shadow-md">
                {String(item.val).padStart(2, "0")}
              </span>
              <span className="text-[9px] sm:text-xs font-black tracking-widest text-slate-400 mt-2">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Launch Notification Links */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md relative z-10">
          <a
            href="https://whatsapp.com" 
            target="_blank" 
            className="flex-1 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Phone className="w-5 h-5" /> Join WhatsApp Group
          </a>
          <a
            href="https://t.me" 
            target="_blank" 
            className="flex-1 py-4 px-6 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-extrabold rounded-2xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Send className="w-5 h-5" /> Join Telegram Channel
          </a>
        </div>

        {/* Secret Test Button for checking the firecracker effect immediately */}
        {isTestMode && (
          <div className="mt-16 opacity-30 hover:opacity-100 transition-opacity">
            <button
              onClick={triggerLaunchCelebration}
              className="px-4 py-2 border border-white/20 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors flex items-center gap-1.5 mx-auto"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Test Live Launch Effect 🎆
            </button>
          </div>
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 w-full text-center text-xs font-bold text-slate-500 relative z-10">
        Rojgar Suvidha © {new Date().getFullYear()} | Independent Sarkari Jobs Resource Portal. Not affiliated with Government.
      </footer>

      {/* Celebration Overlay: Fireworks & Live Alert Screen */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-center animate-fade-in duration-300">
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
          
          <div className="relative z-50 max-w-lg px-6 flex flex-col items-center animate-scale-up">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-600/50 mb-6 animate-bounce">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 animate-pulse">
              WE ARE LIVE! 🎇
            </h2>
            
            <p className="text-lg font-bold text-indigo-200">
              Rojgar Suvidha is officially launched!
            </p>
            
            <p className="text-xs text-slate-400 mt-2">
              Preparing your dashboard. Launching layout in a moment...
            </p>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-up {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-scale-up {
          animation: scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
