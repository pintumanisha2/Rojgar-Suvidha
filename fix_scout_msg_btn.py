import re

with open("src/app/employer/dashboard/page.tsx", "r") as f:
    content = f.read()

target = """                                  <button
                                    onClick={() => setCandidateToShortlist(cand)}
                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                                  >
                                    <CheckCircle className="w-3 h-3" /> Shortlist
                                  </button>"""

replacement = """                                  <button
                                    onClick={() => {
                                      // Store candidate details in session storage so messages page can pick it up
                                      sessionStorage.setItem('rs_outbound_scout', JSON.stringify(cand));
                                      router.push(`/employer/messages?userId=${cand.id}`);
                                    }}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                                  >
                                    <MessageSquare className="w-3 h-3" /> Message
                                  </button>
                                  <button
                                    onClick={() => setCandidateToShortlist(cand)}
                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                                  >
                                    <CheckCircle className="w-3 h-3" /> Shortlist
                                  </button>"""

if "sessionStorage.setItem('rs_outbound_scout'" not in content:
    content = content.replace(target, replacement)

with open("src/app/employer/dashboard/page.tsx", "w") as f:
    f.write(content)

