"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2, Sparkles, Mic, MicOff, Check, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AIChatBot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string }[]>([
    { 
      role: "bot", 
      content: "Hello! 🙏 I am Rojgar AI — India's Most Trusted Career Assistant!\n\nAsk me about:\n• Latest Government Jobs 💼\n• Specific Eligibility / Salary Details 💵\n• Form Filling support (Apply For Me) 🚀\n• Digital Locker & Resume tools\n\nHow can I help you today? 😊" 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-IN";

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = () => setIsListening(false);
      }
    }

    // Show welcome toast after 4 seconds if chat is closed
    const toastTimer = setTimeout(() => {
      setShowToast(true);
    }, 4000);
    
    return () => clearTimeout(toastTimer);
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        alert("Your browser does not support voice input. Please use Google Chrome.");
        return;
      }
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/private-jobs") ||
    pathname?.startsWith("/employer") ||
    pathname === "/dashboard/study/hall"
  ) {
    return null;
  }

  const handleSend = async (customMessage?: string) => {
    const userMessage = (customMessage || input).trim();
    if (!userMessage || isLoading) return;

    if (!customMessage) setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-6),
          pathname: pathname || "",
        }),
      });

      const data = await response.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
      } else {
        throw new Error(data.details || data.error || "Failed to get reply");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: `Server Error: ${err.message || "Unable to reach assistant right now."}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Dynamic Quick Actions based on page context (U3) ───────────────────────
  const getQuickActions = () => {
    if (pathname?.startsWith("/job/")) {
      return [
        { label: "Eligibility? 🎓", query: "Is job ki eligibility criteria aur age limit kya hai?" },
        { label: "Salary Details? 💵", query: "Is recruitment me kitni salary milti hai?" },
        { label: "Form Apply (₹50) 🚀", query: "Mera form apply kar do. Apply For Me service kya hai?" },
      ];
    }
    if (pathname === "/apply-for-me") {
      return [
        { label: "How it works? 🤔", query: "Apply For Me service kaam kaise karti hai step-by-step?" },
        { label: "Charges & Fees? 💳", query: "Is service ka kitna charge hai aur form fee kaise pay hoti hai?" },
        { label: "Is it secure? 🔒", query: "Rojgar Suvidha locker me mere documents kitne safe hain?" },
      ];
    }
    return [
      { label: "Latest Jobs 🔥", query: "Abhi kaunsi nayi government jobs open hai?" },
      { label: "SSC Vacancies 📝", query: "SSC ki latest vacancies ke baare me batao?" },
      { label: "Results Out 📜", query: "Kaunse sarkari exams ke results out hue hain?" },
      { label: "Apply For Me 🚀", query: "Apply For Me service kya hai aur form kaise fill karwau?" },
    ];
  };

  // ── Parse Message Content (Converts MD links to premium buttons) ─────────────
  const parseMessageContent = (content: string) => {
    const parts = content.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, idx) => {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const text = linkMatch[1];
        const url = linkMatch[2];
        const isApplyForMe = url.includes("/apply-for-me");
        
        if (isApplyForMe) {
          return (
            <div key={idx} className="my-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-center shadow-sm">
              <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-extrabold uppercase tracking-wider mb-2">100% Secure Form Filling</p>
              <Link
                href={url}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-5 rounded-xl text-xs hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" /> {text}
              </Link>
            </div>
          );
        }

        // Generic job details link
        return (
          <Link
            key={idx}
            href={url}
            className="mt-2 block text-center bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 font-bold py-1.5 px-3 rounded-xl text-xs hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all shadow-sm"
          >
            Poori Jaankari Padhein →
          </Link>
        );
      }
      
      // Regular text formatting
      return (
        <span key={idx} className="whitespace-pre-wrap">
          {part.split("\n").map((line, lIdx) => {
            if (line.trim().startsWith("•")) {
              return (
                <span key={lIdx} className="block pl-3 my-0.5 relative">
                  <span className="absolute left-0 text-indigo-500">•</span>
                  {line.substring(1)}
                </span>
              );
            }
            return <span key={lIdx} className="block">{line}</span>;
          })}
        </span>
      );
    });
  };

  return (
    <>
      <style>{`
        @keyframes chatSlideUp {
          from { transform: translateY(30px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes botPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(99, 102, 241, 0); }
        }
        .chat-window-enter {
          animation: chatSlideUp 0.35s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }
        .bot-btn-pulse {
          animation: botPulse 2.5s ease-in-out infinite;
        }
        .msg-enter {
          animation: chatSlideUp 0.2s ease-out forwards;
        }
        .dot-bounce {
          animation: bounce 1.2s infinite;
        }
        .dot-bounce:nth-child(2) { animation-delay: 0.2s; }
        .dot-bounce:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
        @keyframes toastSlide {
          from { transform: translateY(15px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .toast-enter {
          animation: toastSlide 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .dark .glass-panel {
          background: rgba(15, 23, 42, 0.85);
        }
      `}</style>

      <div className="fixed bottom-24 md:bottom-5 right-5 z-[999] flex flex-col items-end gap-3">
        
        {/* ── Chat Window ── */}
        {isOpen && (
          <div
            className="chat-window-enter flex flex-col glass-panel rounded-3xl overflow-hidden border border-white/50 dark:border-gray-800/80 shadow-2xl w-[calc(100vw-2rem)] sm:w-[350px] max-w-[350px]"
            style={{
              height: "min(530px, calc(100dvh - 120px))",
              boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.25), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
          >
            {/* Header with gradient and trust badges */}
            <div className="flex flex-col bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between px-5 pt-4 pb-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                      <Sparkles className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-indigo-600 rounded-full" />
                  </div>
                  <div>
                    <p className="font-extrabold text-sm leading-tight tracking-wide">Rojgar AI</p>
                    <p className="text-[10px] text-indigo-100 font-semibold flex items-center gap-1">
                      <span>Pro Mentor</span> • <span className="text-green-300">Online</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/15 rounded-xl transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Trust Badge Bar (U4) */}
              <div className="bg-indigo-950/40 border-t border-white/10 py-1.5 px-4 flex items-center justify-between text-[9px] font-extrabold text-indigo-200 uppercase tracking-widest shrink-0">
                <span className="flex items-center gap-1 text-green-400">
                  <ShieldCheck className="w-3 h-3" /> 99.8% Form Acceptance
                </span>
                <span>50K+ Candidates Assisted</span>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/40 scrollbar-thin">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`msg-enter flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-2.5 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm border ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white border-indigo-400/20"
                          : "bg-white dark:bg-gray-800 text-indigo-600 border-gray-100 dark:border-gray-700"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User style={{ width: "13px", height: "13px" }} />
                      ) : (
                        <Sparkles style={{ width: "13px", height: "13px" }} />
                      )}
                    </div>

                    {/* Chat Bubble */}
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-[12.5px] font-medium leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-sm"
                          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100/80 dark:border-gray-700/60 rounded-tl-sm"
                      }`}
                    >
                      {parseMessageContent(msg.content)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Dynamic Quick Actions (U3) */}
              {!isLoading && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {getQuickActions().map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(action.query)}
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-indigo-100/80 dark:border-indigo-950/40 rounded-full text-[10.5px] font-black text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all shadow-sm"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 items-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-2.5 rounded-xl rounded-tl-sm shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full dot-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full dot-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full dot-bounce" />
                    </div>
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Counselor is typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3.5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={isListening ? "Listening closely..." : "Ask eligibility, syllabus, form steps..."}
                  className={`flex-1 text-[12.5px] font-semibold px-4 py-2.5 rounded-2xl outline-none transition-all dark:text-white ${
                    isListening
                      ? "bg-indigo-50 dark:bg-indigo-900/10 ring-2 ring-indigo-500"
                      : "bg-slate-100 dark:bg-gray-800 placeholder-gray-400 focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-indigo-500/20"
                  }`}
                />
                <button
                  onClick={toggleListening}
                  className={`p-2.5 rounded-2xl transition-all ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-slate-100 dark:bg-gray-800 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                  }`}
                  title="Voice Command"
                >
                  {isListening ? <MicOff style={{ width: "16px", height: "16px" }} /> : <Mic style={{ width: "16px", height: "16px" }} />}
                </button>
                <button
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl transition-all shadow-md shadow-indigo-200 dark:shadow-none"
                >
                  <Send style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
              <div className="flex items-center justify-between text-[9px] text-gray-400 dark:text-gray-500 mt-2.5 px-1 font-bold">
                <span className="uppercase tracking-wider">Trusted AI Counsel</span>
                <span className="flex items-center gap-0.5 text-indigo-500">
                  Rojgar Suvidha <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Welcome Toast Popup (U4) ── */}
        {!isOpen && showToast && (
          <div className="toast-enter relative mr-2 mb-1">
            <div 
              onClick={() => { setIsOpen(true); setShowToast(false); }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl p-4 pr-10 flex items-center gap-3 cursor-pointer hover:-translate-y-0.5 transition-all max-w-[280px]"
            >
              <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900">
                <Sparkles className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  Need Help? 🤖
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5 leading-snug">Ask about eligibility, salary, or let us file your form!</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowToast(false); }}
                className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {/* Small triangle pointer */}
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white dark:bg-gray-900 border-b border-r border-gray-200 dark:border-gray-800 rotate-45 shadow-sm" />
          </div>
        )}

        {/* ── Floating Button with Live Indicator and Gradient Glow ── */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setShowToast(false);
          }}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen
              ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              : "bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white bot-btn-pulse border border-white/20"
          }`}
          title="Rojgar AI Assistant"
        >
          {isOpen ? (
            <X style={{ width: "24px", height: "24px" }} />
          ) : (
            <>
              <Sparkles style={{ width: "26px", height: "26px" }} className="animate-pulse" />
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-green-400 border-[3px] border-indigo-600 rounded-full" />
            </>
          )}
        </button>
      </div>
    </>
  );
}
