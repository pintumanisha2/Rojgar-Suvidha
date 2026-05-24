import re

with open("src/app/employer/dashboard/page.tsx", "r") as f:
    content = f.read()

# Find the duplicated button block and remove it
target = """                                  <button
                                    onClick={() => {
                                      // Store candidate details in session storage so messages page can pick it up
                                      sessionStorage.setItem('rs_outbound_scout', JSON.stringify(cand));
                                      router.push(`/employer/messages?userId=${cand.id}`);
                                    }}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                                  >
                                    <MessageSquare className="w-3 h-3" /> Message
                                  </button>"""

if target in content:
    content = content.replace(target, "")

with open("src/app/employer/dashboard/page.tsx", "w") as f:
    f.write(content)

