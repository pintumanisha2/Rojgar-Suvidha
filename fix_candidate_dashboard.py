import re

with open("src/app/dashboard/page.tsx", "r") as f:
    content = f.read()

# 1. Add MessageSquare and Send to imports
if "MessageSquare" not in content:
    content = content.replace("LogOut, CheckCircle2, Loader2, ShieldCheck, Lock, Briefcase, Camera, Trash2,", "LogOut, CheckCircle2, Loader2, ShieldCheck, Lock, Briefcase, Camera, Trash2, MessageSquare, Send, Paperclip,")

# 2. Add Sidebar Button
sidebar_target = """              <button onClick={() => setActiveTab("requests")}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === "requests" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <ClipboardCheck className="w-5 h-5" /> Apply For Me
              </button>
            </div>"""

sidebar_replacement = """              <button onClick={() => setActiveTab("requests")}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === "requests" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <ClipboardCheck className="w-5 h-5" /> Apply For Me
              </button>
              <button onClick={() => setActiveTab("messages")}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === "messages" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <MessageSquare className="w-5 h-5" /> Messages
              </button>
            </div>"""

if "setActiveTab(\"messages\")" not in content:
    content = content.replace(sidebar_target, sidebar_replacement)

with open("src/app/dashboard/page.tsx", "w") as f:
    f.write(content)

