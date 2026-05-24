import re

with open("src/app/employer/dashboard/page.tsx", "r") as f:
    content = f.read()

# 1. Add states
states_to_add = """  // Shortlist Feature States
  const [candidateToShortlist, setCandidateToShortlist] = useState<any | null>(null);
  const [selectedJobIdForShortlist, setSelectedJobIdForShortlist] = useState<string>("");
  const [shortlistReason, setShortlistReason] = useState<string>("");
"""

if "candidateToShortlist" not in content:
    content = content.replace(
        "const [selectedCandidateForDeepView, setSelectedCandidateForDeepView] = useState<any | null>(null);",
        "const [selectedCandidateForDeepView, setSelectedCandidateForDeepView] = useState<any | null>(null);\n" + states_to_add
    )

# 2. Add handleShortlistFromScout before return (
handle_func = """
  const handleShortlistFromScout = () => {
    if (!candidateToShortlist || !selectedJobIdForShortlist) return;

    const newApp = {
      id: "mock-app-" + Date.now(),
      job_id: selectedJobIdForShortlist,
      candidate_name: candidateToShortlist.full_name || candidateToShortlist.name,
      email: candidateToShortlist.email,
      phone: candidateToShortlist.phone,
      resume_url: candidateToShortlist.resume_url,
      status: "shortlisted",
      created_at: new Date().toISOString(),
      reason_for_shortlist: shortlistReason,
      hr_remarks: "Added from Talent Scout",
      ats_score: candidateToShortlist.ats_score || 85,
      candidate: candidateToShortlist
    };

    const existing = JSON.parse(localStorage.getItem('rs_mock_applications') || '[]');
    localStorage.setItem('rs_mock_applications', JSON.stringify([...existing, newApp]));

    // Optimistically add
    if (selectedJobForApps && selectedJobForApps.id === selectedJobIdForShortlist) {
      setJobApplications(prev => [newApp, ...prev]);
    }

    setCandidateToShortlist(null);
    setSelectedJobIdForShortlist("");
    setShortlistReason("");
    alert("Candidate shortlisted successfully and added to ATS pipeline!");
  };

  return ("""

if "handleShortlistFromScout" not in content:
    content = content.replace("  return (", handle_func)

# 3. Add Shortlist button to Candidate actions
actions_target = """                                    onClick={() => handleCandidateSelect(cand)}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                                  >
                                    <MessageSquare className="w-3 h-3" /> Message
                                  </button>"""

shortlist_btn = """                                    onClick={() => handleCandidateSelect(cand)}
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

if "setCandidateToShortlist(cand)" not in content:
    content = content.replace(actions_target, shortlist_btn)

# 4. Add Shortlist Modal to the bottom
modal_ui = """
      {/* Shortlist Candidate Modal */}
      {candidateToShortlist && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> Shortlist Candidate
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Select a job role for <strong>{candidateToShortlist.full_name || candidateToShortlist.name}</strong> and provide a reason.</p>

            <select
              value={selectedJobIdForShortlist}
              onChange={e => setSelectedJobIdForShortlist(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm font-bold text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-indigo-500 transition-shadow appearance-none cursor-pointer"
            >
              <option value="" disabled>Select a Job Role...</option>
              {jobs.filter(j => j.status !== 'closed').map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>

            <textarea
              value={shortlistReason}
              onChange={e => setShortlistReason(e.target.value)}
              placeholder="Reason for shortlisting (e.g. Strong technical skills, perfect experience match...)"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm font-medium text-gray-900 dark:text-white mb-3 focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none min-h-[100px]"
            ></textarea>

            <div className="flex flex-wrap gap-2 mb-6">
              <span onClick={() => setShortlistReason("Strong Technical Skills")} className="cursor-pointer text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md hover:bg-indigo-100 transition border border-indigo-100">Strong Tech Skills</span>
              <span onClick={() => setShortlistReason("Relevant Work Experience")} className="cursor-pointer text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md hover:bg-emerald-100 transition border border-emerald-100">Relevant Experience</span>
              <span onClick={() => setShortlistReason("Good Communication")} className="cursor-pointer text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-md hover:bg-amber-100 transition border border-amber-100">Good Comm Skills</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCandidateToShortlist(null);
                  setSelectedJobIdForShortlist("");
                  setShortlistReason("");
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShortlistFromScout}
                disabled={!selectedJobIdForShortlist || !shortlistReason.trim()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-colors disabled:opacity-50"
              >
                Save to Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
"""

if "Shortlist Candidate Modal" not in content:
    content = content.replace("    </div>\n  );\n}", modal_ui)

with open("src/app/employer/dashboard/page.tsx", "w") as f:
    f.write(content)

