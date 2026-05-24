import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

old_select = """                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
                                className={`w-full h-full px-2 py-2 outline-none appearance-none cursor-pointer font-bold text-[11px] ${app.status === 'applied' ? 'bg-transparent text-gray-700 dark:text-gray-300' :
                                    app.status === 'shortlisted' ? 'bg-green-100 text-green-800 dark:bg-green-900/40' :
                                      app.status === 'interview' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40' :
                                        'bg-red-100 text-red-800 dark:bg-red-900/40'
                                  }`}
                              >
                                <option value="applied">Applied</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="interview">Interview</option>
                                <option value="rejected">Rejected</option>
                              </select>"""

new_select = """                              <select
                                value={app.status}
                                onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value)}
                                className={`w-full h-full px-2 py-2 outline-none appearance-none cursor-pointer font-bold text-[11px] ${
                                    app.status === 'applied' ? 'bg-transparent text-gray-700 dark:text-gray-300' :
                                    app.status === 'shortlisted' ? 'bg-green-100 text-green-800 dark:bg-green-900/40' :
                                    app.status === 'tech_round' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40' :
                                    app.status === 'hr_round' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40' :
                                    app.status === 'hired' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 ring-1 ring-emerald-500' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/40'
                                  }`}
                              >
                                <option value="applied">Applied</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="tech_round">Tech Round (L1)</option>
                                <option value="hr_round">HR Round</option>
                                <option value="hired">Hired / Selected 🏆</option>
                                <option value="rejected">Rejected ❌</option>
                              </select>"""

if old_select in content:
    content = content.replace(old_select, new_select)
    
# There is also one more place where the 'interview' status is used: when scheduling an interview
# `handleUpdateApplicationStatus(appId, 'interview');`
# I should change it to 'tech_round'

if "handleUpdateApplicationStatus(appId, 'interview');" in content:
    content = content.replace("handleUpdateApplicationStatus(appId, 'interview');", "handleUpdateApplicationStatus(appId, 'tech_round');")

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

