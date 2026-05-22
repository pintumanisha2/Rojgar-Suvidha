"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2, Sparkles, Mic, MicOff } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AIChatBot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string }[]>([
    { role: "bot", content: "Namaste! Main Rojgar Assistant hoon. Main aapki career ya jobs se judi kya madad kar sakta hoon? 😊" }
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
        recognitionRef.current.lang = "hi-IN";

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onerror = () => setIsListening(false);
      }
    }

    // Show welcome toast after 3 seconds if chat is not opened
    const toastTimer = setTimeout(() => {
      setShowToast(true);
    }, 3000);
    
    return () => clearTimeout(toastTimer);
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        alert("Aapka browser voice input support nahi karta. Kripya Chrome use karein.");
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
    pathname?.startsWith("/employer")
  ) {
    return null;
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-6),
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
        { role: "bot", content: `Error: ${err.message || "Server me dikkat hai."}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Latest Jobs 🔥", query: "Kaunsi nayi naukri aayi hai?" },
    { label: "Admit Cards 🎫", query: "Admit card kaise download karein?" },
    { label: "Results 📜", query: "Results kab aayenge?" },
    { label: "Digital Locker 🛡️", query: "Locker mein document kaise upload karein?" },
  ];

  return (
    <>
      <style>{`
        @keyframes chatSlideUp {
          from { transform: translateY(20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes botPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
        }
        .chat-window-enter {
          animation: chatSlideUp 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .bot-btn-pulse {
          animation: botPulse 2.5s ease-in-out infinite;
        }
        .msg-enter {
          animation: chatSlideUp 0.25s ease forwards;
        }
        .dot-bounce {
          animation: bounce 1.2s infinite;
        }
        .dot-bounce:nth-child(2) { animation-delay: 0.2s; }
        .dot-bounce:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes toastSlide {
          from { transform: translateX(20px) scale(0.9); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        .toast-enter {
          animation: toastSlide 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .dark .glass-panel {
          background: rgba(17, 24, 39, 0.85);
        }
      `}</style>

      <div className="fixed bottom-24 md:bottom-5 right-5 z-[999] flex flex-col items-end gap-3">
        
        {/* ── Chat Window ── */}
        {isOpen && (
          <div
            className="chat-window-enter flex flex-col glass-panel rounded-3xl overflow-hidden border border-white/40 dark:border-gray-700/50"
            style={{
              width: "340px",
              height: "520px",
              boxShadow: "0 30px 60px -10px rgba(79, 70, 229, 0.3), 0 0 0 1px rgba(255,255,255,0.2) inset",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shrink-0 shadow-sm relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shadow-inner">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-indigo-600 rounded-full" />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">Rojgar AI</p>
                  <p className="text-[10px] text-indigo-200 font-medium">Pro Assistant • Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/15 rounded-lg transition-colors relative z-20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-gray-950 scrollbar-thin">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`msg-enter flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                          : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-indigo-600"
                      }`}
                    >
                      {msg.role === "user"
                        ? <User style={{ width: "14px", height: "14px" }} />
                        : <Sparkles style={{ width: "14px", height: "14px" }} />
                      }
                    </div>

                    {/* Bubble */}
                    <div
                      className={`px-3 py-2 rounded-xl text-[12.5px] font-medium leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-sm"
                          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm"
                      }`}
                    >
                      {msg.content.split(/(\[View Details\]\(.*?\))/g).map((part, idx) => {
                        const linkMatch = part.match(/\[View Details\]\((.*?)\)/);
                        if (linkMatch) {
                          return (
                            <Link
                              key={idx}
                              href={linkMatch[1]}
                              className="mt-2 block text-center bg-white text-indigo-600 border border-indigo-200 font-bold py-1.5 px-3 rounded-lg text-[11px] hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                            >
                              Poori Jaankari Padhein →
                            </Link>
                          );
                        }
                        return <span key={idx}>{part}</span>;
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Quick Actions — only on first message */}
              {!isLoading && messages.length === 1 && (
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(action.query);
                        setTimeout(() => handleSend(), 80);
                      }}
                      className="p-2 bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all text-left shadow-sm"
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
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full dot-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full dot-bounce" />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full dot-bounce" />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={isListening ? "Bol raha hoon..." : "Naukri ke bare mein puchein..."}
                  className={`flex-1 text-[12.5px] font-medium px-3 py-2.5 rounded-xl outline-none transition-all dark:text-white ${
                    isListening
                      ? "bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-400"
                      : "bg-slate-100 dark:bg-gray-800"
                  }`}
                />
                <button
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl transition-all ${
                    isListening
                      ? "bg-red-500 text-white"
                      : "bg-slate-100 dark:bg-gray-800 text-gray-400 hover:text-indigo-600"
                  }`}
                  title="Voice Search"
                >
                  {isListening ? <MicOff style={{ width: "16px", height: "16px" }} /> : <Mic style={{ width: "16px", height: "16px" }} />}
                </button>
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-none"
                >
                  <Send style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
              <p className="text-[9.5px] text-center text-gray-400 mt-2 font-semibold flex items-center justify-center gap-1 tracking-wider uppercase">
                Next-Gen AI • Rojgar Suvidha <Sparkles style={{ width: "10px", height: "10px" }} className="text-amber-400" />
              </p>
            </div>
          </div>
        )}

        {/* ── Welcome Toast Popup ── */}
        {!isOpen && showToast && (
          <div className="toast-enter relative mr-2 mb-1">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl p-3 pr-8 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-gray-900 dark:text-white">Need Job Help?</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Ask our AI Assistant anything!</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowToast(false); }}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            {/* Small triangle pointer */}
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-gray-900 border-b border-r border-gray-200 dark:border-gray-700 rotate-45" />
          </div>
        )}

        {/* ── Floating Button ── */}
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
        >
          {isOpen ? (
            <X style={{ width: "24px", height: "24px" }} />
          ) : (
            <>
              <Sparkles style={{ width: "28px", height: "28px" }} />
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-green-400 border-[3px] border-indigo-600 rounded-full" />
            </>
          )}
        </button>
      </div>
    </>
  );
}
