import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

# 1. Update Header
header_old = '<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10">Stage / Verdict Reason</th>'
header_new = """<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10">Reason for Shortlisting</th>
                          <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-red-50 dark:bg-red-900/10">Final Result Reason</th>"""

if header_old in content:
    content = content.replace(header_old, header_new)

# 2. Revert placeholder and Add Cell
cell_old = """                            <td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <textarea
                                defaultValue={app.reason_for_shortlist || ""}
                                placeholder="Reason for Shortlist, Selection, or Rejection..."
                                onBlur={(e) => handleUpdateField(app.id, 'reason_for_shortlist', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none resize-none overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-inset focus:ring-indigo-500"
                              />
                            </td>"""

cell_new = """                            <td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <textarea
                                defaultValue={app.reason_for_shortlist || ""}
                                placeholder="Why Shortlisted?"
                                onBlur={(e) => handleUpdateField(app.id, 'reason_for_shortlist', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none resize-none overflow-hidden hover:bg-emerald-50 dark:hover:bg-emerald-900/20 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-inset focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <textarea
                                defaultValue={app.final_result_reason || ""}
                                placeholder="Why Hired or Rejected?"
                                onBlur={(e) => handleUpdateField(app.id, 'final_result_reason', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none resize-none overflow-hidden hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-inset focus:ring-red-500"
                              />
                            </td>"""

if cell_old in content:
    content = content.replace(cell_old, cell_new)

# 3. Increase ColSpan
if '<td colSpan={14}' in content:
    content = content.replace('<td colSpan={14}', '<td colSpan={15}')

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

