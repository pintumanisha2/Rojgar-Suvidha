"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";

interface ShareJobButtonProps {
  url: string;
  title: string;
}

export default function ShareJobButton({ url, title }: ShareJobButtonProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = url.startsWith("http") ? url : `https://www.rojgarsuvidha.com${url}`;

  const whatsappText = encodeURIComponent(
    `🔔 *New Sarkari Naukri Alert!*\n\n📋 *${title}*\n\nApply now on Rojgar Suvidha 👇\n${fullUrl}\n\n🇮🇳 _India's #1 Govt Job Portal_`
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${title}\n${fullUrl}`);
    } catch {
      const el = document.createElement("textarea");
      el.value = fullUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      {/* WhatsApp Share */}
      <a
        href={`https://wa.me/?text=${whatsappText}`}
        target="_blank"
        rel="noopener noreferrer"
        id="share-whatsapp-btn"
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm bg-[#25D366] hover:bg-[#1da851] text-white transition-all shadow-sm shadow-green-500/20"
        title="Share on WhatsApp"
      >
        <MessageCircle className="w-4 h-4" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopy}
        id="share-copy-link-btn"
        className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-sm transition-all border ${
          copied
            ? "bg-green-500 text-white border-green-500 shadow-sm shadow-green-500/20"
            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
        title="Copy link to clipboard"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">Copy Link</span>
          </>
        )}
      </button>
    </div>
  );
}
