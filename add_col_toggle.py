import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

# 1. State
state_str = """  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");"""

state_new = """  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  
  // Column Toggle State
  const [showColToggle, setShowColToggle] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    contact: true, role: true, stage: true, appliedOn: true,
    location: true, salary: true, notice: true, nextAction: true,
    shortlistReason: true, finalReason: true, hrRemarks: true
  });
"""

if "const [showColToggle" not in content:
    content = content.replace(state_str, state_new)

# 2. UI button
btn_old = """                  <div className="flex gap-2">
                    <button onClick={handleExportExcel} className="text-[10px] font-bold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 transition-colors">
                      Export Sheet
                    </button>
                  </div>"""

btn_new = """                  <div className="flex gap-2 relative">
                    <button onClick={() => setShowColToggle(!showColToggle)} className="text-[10px] font-bold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
                      <List className="w-3 h-3" /> Columns
                    </button>
                    {showColToggle && (
                      <div className="absolute top-full right-10 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 p-3 text-xs font-medium text-gray-700 dark:text-gray-200">
                        <div className="mb-2 font-black text-gray-900 dark:text-white uppercase tracking-wider">Show/Hide Columns</div>
                        <div className="space-y-1.5">
                          {Object.keys(visibleCols).map(key => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                              <input type="checkbox" checked={(visibleCols as any)[key]} onChange={() => setVisibleCols(p => ({ ...p, [key]: !(p as any)[key] }))} className="rounded-sm" />
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    <button onClick={handleExportExcel} className="text-[10px] font-bold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 transition-colors">
                      Export Sheet
                    </button>
                  </div>"""

if "Columns" not in content and "showColToggle" not in btn_old:
    content = content.replace(btn_old, btn_new)

# 3. Replace THs
# We need to wrap each TH conditionally.
content = content.replace('<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Contact Info</th>', '{visibleCols.contact && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Contact Info</th>}')
content = content.replace('<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Applied Role & Source</th>', '{visibleCols.role && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Applied Role & Source</th>}')
content = content.replace('<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Stage</th>', '{visibleCols.stage && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Stage</th>}')
content = content.replace('<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-28">Applied On</th>', '{visibleCols.appliedOn && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-28">Applied On</th>}')
content = content.replace('<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Location</th>', '{visibleCols.location && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Location</th>}')
content = content.replace('<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Exp. Salary / CTC</th>', '{visibleCols.salary && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Exp. Salary / CTC</th>}')
content = content.replace('<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Notice Period</th>', '{visibleCols.notice && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-32">Notice Period</th>}')
content = content.replace('<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Next Action / Date</th>', '{visibleCols.nextAction && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 w-40">Next Action / Date</th>}')
content = content.replace('<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10">Reason for Shortlisting</th>', '{visibleCols.shortlistReason && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10">Reason for Shortlisting</th>}')
content = content.replace('<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-red-50 dark:bg-red-900/10">Final Result Reason</th>', '{visibleCols.finalReason && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-red-50 dark:bg-red-900/10">Final Result Reason</th>}')
content = content.replace('<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/10">HR Remarks</th>', '{visibleCols.hrRemarks && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/10">HR Remarks</th>}')

# 4. Replace TDs
# It's better to use regex to wrap the <td ...>...</td> blocks

def wrap_td(content, prefix, toggle_var):
    pattern = re.compile(prefix + r'.*?</td>', re.DOTALL)
    matches = pattern.findall(content)
    # We should only wrap the one inside tbody! There is no other though.
    if matches:
        content = content.replace(matches[0], f"{{visibleCols.{toggle_var} && (\n{matches[0]}\n)}}")
    return content

# TD 1: Contact
content = wrap_td(content, r'<td className="px-3 py-2 border border-gray-300 dark:border-gray-700">\s*<div className="text-\[10px\] text-gray-600 font-medium">', 'contact')

# TD 2: Role
content = wrap_td(content, r'<td className="px-3 py-2 border border-gray-300 dark:border-gray-700">\s*<div className="text-\[10px\] font-bold text-gray-700 dark:text-gray-300 mb-1">', 'role')

# TD 3: Stage
content = wrap_td(content, r'<td className="px-3 py-2 border border-gray-300 dark:border-gray-700 p-0">\s*<select\s*value=\{app.status\}', 'stage')

# TD 4: Applied On
content = wrap_td(content, r'<td className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-\[10px\] font-medium text-gray-500">\s*\{new Date\(app.created_at', 'appliedOn')

# TD 5: Location
content = wrap_td(content, r'<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">\s*<input\s*type="text"\s*defaultValue=\{app.current_location', 'location')

# TD 6: Salary
content = wrap_td(content, r'<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">\s*<input\s*type="text"\s*defaultValue=\{app.expected_salary', 'salary')

# TD 7: Notice
content = wrap_td(content, r'<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">\s*<select\s*defaultValue=\{app.notice_period', 'notice')

# TD 8: Next Action
content = wrap_td(content, r'<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">\s*<input\s*type="text"\s*defaultValue=\{app.next_action', 'nextAction')

# TD 9: Shortlist Reason
content = wrap_td(content, r'<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">\s*<textarea\s*defaultValue=\{app.reason_for_shortlist', 'shortlistReason')

# TD 10: Final Reason
content = wrap_td(content, r'<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">\s*<textarea\s*defaultValue=\{app.final_result_reason', 'finalReason')

# TD 11: HR Remarks
content = wrap_td(content, r'<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">\s*<textarea\s*defaultValue=\{app.hr_remarks', 'hrRemarks')

# ColSpan dynamic calculation
colspan_old = '<td colSpan={15} className="px-6 py-12 text-center text-gray-500 font-medium">'
colspan_new = '<td colSpan={4 + Object.values(visibleCols).filter(Boolean).length} className="px-6 py-12 text-center text-gray-500 font-medium">'
if colspan_old in content:
    content = content.replace(colspan_old, colspan_new)


with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

