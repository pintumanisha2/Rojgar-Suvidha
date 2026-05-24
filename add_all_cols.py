import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

# 1. Update min-w for the table
if "min-w-[800px]" in content:
    content = content.replace("min-w-[800px]", "min-w-[1800px]")

# 2. Update Headers
header_old = """                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-48">Candidate Profile</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Applied Role & Source</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Stage</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10">Reason for Shortlisting</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/10">HR Remarks</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-28 text-center">Links</th>"""

header_new = """                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-48">Candidate Profile</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Contact Info</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Applied Role & Source</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Stage</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-28">Applied On</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Location</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Exp. Salary / CTC</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Notice Period</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Next Action / Date</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10">Reason for Shortlisting</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/10">HR Remarks</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-28 text-center">Links</th>"""

if "<th>Contact Info</th>" not in content and header_old in content:
    content = content.replace(header_old, header_new)

# 3. Update generic field update logic
# We need a generic function for onBlur
generic_update_func = """
  const handleUpdateField = (appId: string, field: string, value: string) => {
    setJobApplications(prev => prev.map(a => a.id === appId ? { ...a, [field]: value } : a));
    const existing = JSON.parse(localStorage.getItem('rs_mock_applications') || '[]');
    const updated = existing.map((a: any) => a.id === appId ? { ...a, [field]: value } : a);
    localStorage.setItem('rs_mock_applications', JSON.stringify(updated));
    // Ideally update Supabase here too
  };
"""
if "handleUpdateField" not in content:
    content = content.replace(
        "const handleUpdateRemarks = async (appId: string, remarks: string) => {",
        generic_update_func + "\n  const handleUpdateRemarks = async (appId: string, remarks: string) => {"
    )

# 4. Update Cells
# This requires replacing the block from <td ...>Candidate Profile</td> to <td ...>Links</td>.
# We'll match the start and just replace everything before </tr>

cell_search = """                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700">
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

cell_new = """                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700">
                              <div className="text-[10px] text-gray-600 font-medium">
                                <div className="flex items-center gap-1 mb-1"><span title="Phone">📞</span> {app.candidate?.phone || app.phone || "N/A"}</div>
                                <div className="flex items-center gap-1 truncate max-w-[140px]"><span title="Email">✉️</span> {app.candidate?.email || app.email || "N/A"}</div>
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

if cell_search in content:
    content = content.replace(cell_search, cell_new)

# Now we need to insert the new editable cells right after the Status select dropdown
status_dropdown_end = """                              </select>
                            </td>"""

new_editable_cells = """                              </select>
                            </td>
                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-[10px] font-medium text-gray-500">
                              {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <input
                                type="text"
                                defaultValue={app.current_location || app.candidate?.location || ""}
                                placeholder="e.g. Delhi, WFH"
                                onBlur={(e) => handleUpdateField(app.id, 'current_location', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none text-xs hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900"
                              />
                            </td>
                            <td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <input
                                type="text"
                                defaultValue={app.expected_salary || ""}
                                placeholder="e.g. 5 LPA"
                                onBlur={(e) => handleUpdateField(app.id, 'expected_salary', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none text-xs hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900"
                              />
                            </td>
                            <td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <select
                                defaultValue={app.notice_period || ""}
                                onChange={(e) => handleUpdateField(app.id, 'notice_period', e.target.value)}
                                className="w-full h-full min-h-[40px] px-2 py-2 bg-transparent outline-none text-[11px] font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <option value="">Select...</option>
                                <option value="Immediate">Immediate Joiner</option>
                                <option value="15 Days">15 Days</option>
                                <option value="30 Days">30 Days</option>
                                <option value="60+ Days">60+ Days</option>
                              </select>
                            </td>
                            <td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <input
                                type="text"
                                defaultValue={app.next_action || ""}
                                placeholder="e.g. Interview on 25th"
                                onBlur={(e) => handleUpdateField(app.id, 'next_action', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none text-xs hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900"
                              />
                            </td>"""

if "handleUpdateField(app.id, 'current_location'" not in content:
    content = content.replace(status_dropdown_end, new_editable_cells)

# Fix colSpan
content = content.replace('<td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">', '<td colSpan={14} className="px-6 py-12 text-center text-gray-500 font-medium">')

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

