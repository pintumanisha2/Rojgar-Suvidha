import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

# 1. Update Header
header_old = """                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-48">Candidate Profile</th>
                          {!selectedJobForApps && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Applied Role</th>}"""
header_new = """                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-48">Candidate Profile</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Applied Role & Source</th>"""

if header_old in content:
    content = content.replace(header_old, header_new)

# 2. Update Cell
cell_old = """                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700">
                              <div className="font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline" onClick={() => setSelectedCandidateForDeepView({ ...app.candidate, ats_score: app.ats_score || 85, applicationId: app.id, status: app.status })}>
                                {app.candidate?.full_name || app.candidate_name || "Unknown Candidate"}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {app.candidate?.experience || "Fresher"} • Match: {app.ats_score || 85}%
                              </div>
                            </td>
                            {!selectedJobForApps && (
                              <td className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-[10px] font-bold text-gray-700 dark:text-gray-300">
                                {jobs.find(j => j.id === app.job_id)?.title || "Unknown Role"}
                              </td>
                            )}"""

cell_new = """                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700">
                              <div className="font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline" onClick={() => setSelectedCandidateForDeepView({ ...app.candidate, ats_score: app.ats_score || 85, applicationId: app.id, status: app.status })}>
                                {app.candidate?.full_name || app.candidate_name || "Unknown Candidate"}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {app.candidate?.experience || "Fresher"} • Match: {app.ats_score || 85}%
                              </div>
                            </td>
                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700">
                                <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                                  {jobs.find(j => j.id === app.job_id)?.title || "Unknown Role"}
                                </div>
                                {app.hr_remarks?.includes("Talent Scout") ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-blue-50 text-blue-600 border border-blue-200">
                                    Talent Scout
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-purple-50 text-purple-600 border border-purple-200">
                                    Organic (Form)
                                  </span>
                                )}
                            </td>"""

if cell_old in content:
    content = content.replace(cell_old, cell_new)

# 3. Update colspan
colspan_old = '<td colSpan={!selectedJobForApps ? 8 : 7} className="px-6 py-12 text-center text-gray-500 font-medium">'
colspan_new = '<td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">'

if colspan_old in content:
    content = content.replace(colspan_old, colspan_new)
elif '<td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">' in content:
    content = content.replace('<td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">', colspan_new)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

