import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

states_to_add = """  // Shortlist Feature States
  const [applicantToShortlist, setApplicantToShortlist] = useState<any | null>(null);
  const [shortlistReason, setShortlistReason] = useState<string>("");
"""

if "applicantToShortlist" not in content:
    content = content.replace(
        "const [selectedCandidateForDeepView, setSelectedCandidateForDeepView] = useState<any | null>(null);",
        "const [selectedCandidateForDeepView, setSelectedCandidateForDeepView] = useState<any | null>(null);\n" + states_to_add
    )

handle_func = """
  const handleShortlistApplicant = () => {
    if (!applicantToShortlist) return;

    handleUpdateApplicationStatus(applicantToShortlist.applicationId, 'shortlisted');

    setJobApplications(prev => prev.map(a => 
      a.id === applicantToShortlist.applicationId 
        ? { ...a, reason_for_shortlist: shortlistReason, status: 'shortlisted' } 
        : a
    ));

    const existing = JSON.parse(localStorage.getItem('rs_mock_applications') || '[]');
    const updated = existing.map((a: any) => 
      a.id === applicantToShortlist.applicationId 
        ? { ...a, reason_for_shortlist: shortlistReason, status: 'shortlisted' } 
        : a
    );
    localStorage.setItem('rs_mock_applications', JSON.stringify(updated));

    setApplicantToShortlist(null);
    setShortlistReason("");
    alert("Candidate successfully shortlisted!");
  };

  return ("""

if "handleShortlistApplicant" not in content:
    content = content.replace("  return (", handle_func)


actions_target = """                      <button
                        onClick={() => handleCandidateSelect(selectedCandidateForDeepView)}
                        className="px-5 py-2.5 text-sm font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" /> Message
                      </button>"""

shortlist_btn = """                      <button
                        onClick={() => setApplicantToShortlist(selectedCandidateForDeepView)}
                        className="px-5 py-2.5 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <CheckCircle className="w-4 h-4" /> Shortlist
                      </button>
                      <button
                        onClick={() => handleCandidateSelect(selectedCandidateForDeepView)}
                        className="px-5 py-2.5 text-sm font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" /> Message
                      </button>"""

if "setApplicantToShortlist(selectedCandidateForDeepView)" not in content:
    content = content.replace(actions_target, shortlist_btn)

modal_ui = """
      {/* Shortlist Applicant Modal */}
      {applicantToShortlist && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> Confirm Shortlist
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-6">You are shortlisting <strong>{applicantToShortlist.full_name || applicantToShortlist.name}</strong>. Please provide a reason to add to the ATS Pipeline.</p>

            <textarea
              value={shortlistReason}
              onChange={e => setShortlistReason(e.target.value)}
              placeholder="Reason for shortlisting (e.g. Excellent portfolio, matches criteria...)"
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
                  setApplicantToShortlist(null);
                  setShortlistReason("");
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShortlistApplicant}
                disabled={!shortlistReason.trim()}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold rounded-xl transition-colors disabled:opacity-50"
              >
                Confirm Shortlist
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
"""

if "Shortlist Applicant Modal" not in content:
    content = content.replace("    </div>\n  );\n}", modal_ui)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

