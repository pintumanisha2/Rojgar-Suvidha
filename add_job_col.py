import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

# Add table header
header_target = '<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-48">Candidate Profile</th>'
header_new = '<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-48">Candidate Profile</th>\n                          {!selectedJobForApps && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Applied Role</th>}'

if "{!selectedJobForApps && <th className=\"px-3 py-2 border border-gray-300 dark:border-gray-700 w-32\">Applied Role</th>}" not in content:
    content = content.replace(header_target, header_new)

# Add table cell
cell_target = """                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700">
                              <div className="font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline" onClick={() => setSelectedCandidateForDeepView({ ...app.candidate, ats_score: app.ats_score || 85, applicationId: app.id, status: app.status })}>
                                {app.candidate?.full_name || app.candidate_name || "Unknown Candidate"}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {app.candidate?.experience || "Fresher"} • Match: {app.ats_score || 85}%
                              </div>
                            </td>"""

cell_new = """                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700">
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

if "{jobs.find(j => j.id === app.job_id)?.title || \"Unknown Role\"}" not in content:
    content = content.replace(cell_target, cell_new)

# Fix the colSpan when applications list is empty
colspan_target = '<td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">'
colspan_new = '<td colSpan={!selectedJobForApps ? 8 : 7} className="px-6 py-12 text-center text-gray-500 font-medium">'
if colspan_target in content:
    content = content.replace(colspan_target, colspan_new)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

