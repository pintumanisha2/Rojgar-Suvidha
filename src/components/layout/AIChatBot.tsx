"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2, Sparkles, Mic, MicOff } from "lucide-react";
import Link from "next/link";

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "bot"; content: string }[]>([
    { role: "bot", content: "Namaste! Main Rojgar Assistant hoon. Main aapki career ya jobs se judi kya madad kar sakta hoon? 😊" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
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
        throw new Error(data.error || "Failed to get reply");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "Sorry, abhi server mein kuch dikkat hai. Kripya baad mein koshish karein." },
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
      `}</style>

      <div className="fixed bottom-24 md:bottom-5 right-5 z-[999] flex flex-col items-end gap-3">
        
        {/* ── Chat Window ── */}
        {isOpen && (
          <div
            className="chat-window-enter flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
            style={{
              width: "320px",
              height: "480px",
              boxShadow: "0 20px 60px -10px rgba(79, 70, 229, 0.25), 0 4px 20px rgba(0,0,0,0.12)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/25">
                    <Bot className="w-4.5 h-4.5 text-white" style={{ width: "18px", height: "18px" }} />
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
                className="p-1.5 hover:bg-white/15 rounded-lg transition-colors"
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
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-indigo-600"
                      }`}
                    >
                      {msg.role === "user"
                        ? <User style={{ width: "12px", height: "12px" }} />
                        : <Bot style={{ width: "12px", height: "12px" }} />
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

        {/* ── Floating Button ── */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen
              ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              : "bg-indigo-600 text-white bot-btn-pulse"
          }`}
        >
          {isOpen ? (
            <X style={{ width: "22px", height: "22px" }} />
          ) : (
            <>
              <Bot style={{ width: "26px", height: "26px" }} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-400 border-2 border-indigo-600 rounded-full" />
            </>
          )}
        </button>
      </div>
    </>
  );
}
