import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

# 1. State Management
state_old = """  // Column Toggle State
  const [showColToggle, setShowColToggle] = useState(false);
  const [visibleCols, setVisibleCols] = useState({"""

state_new = """  // Custom Columns State
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");

  // Column Toggle State
  const [showColToggle, setShowColToggle] = useState(false);
  const [visibleCols, setVisibleCols] = useState({"""

if "const [customColumns" not in content:
    content = content.replace(state_old, state_new)

# 2. useEffect to load custom columns from localStorage
effect_old = """  // Fetch Candidates for Talent Scout"""

effect_new = """  // Load custom columns from localStorage on mount
  useEffect(() => {
    const savedCols = localStorage.getItem('rs_custom_columns');
    if (savedCols) {
      try {
        setCustomColumns(JSON.parse(savedCols));
      } catch (e) {}
    }
  }, []);

  const handleAddCustomColumn = () => {
    if (!newColName.trim() || customColumns.includes(newColName.trim())) return;
    const updated = [...customColumns, newColName.trim()];
    setCustomColumns(updated);
    localStorage.setItem('rs_custom_columns', JSON.stringify(updated));
    setNewColName("");
    setIsAddColModalOpen(false);
  };

  // Fetch Candidates for Talent Scout"""

if "const handleAddCustomColumn" not in content:
    content = content.replace(effect_old, effect_new)

# 3. UI: "Add Column" button
btn_old = """                    <button onClick={() => setShowColToggle(!showColToggle)} className="text-[10px] font-bold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
                      <List className="w-3 h-3" /> Columns
                    </button>"""

btn_new = """                    <button onClick={() => setIsAddColModalOpen(true)} className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-1">
                      + Add Column
                    </button>
                    <button onClick={() => setShowColToggle(!showColToggle)} className="text-[10px] font-bold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
                      <List className="w-3 h-3" /> Columns
                    </button>"""

if "+ Add Column" not in content:
    content = content.replace(btn_old, btn_new)

# 4. Modal UI for adding column (Insert at the end of the page)
modal_ui = """
      {/* Add Custom Column Modal */}
      {isAddColModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">
              Add Custom Column
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-6">Create a new field to track for all candidates (e.g., Assignment Link).</p>

            <input
              type="text"
              value={newColName}
              onChange={e => setNewColName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCustomColumn()}
              placeholder="Column Name"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm font-medium text-gray-900 dark:text-white mb-6 focus:ring-2 focus:ring-indigo-500 transition-shadow"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => setIsAddColModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomColumn}
                disabled={!newColName.trim()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-colors disabled:opacity-50"
              >
                Add Column
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}"""

if "Add Custom Column Modal" not in content:
    content = content.replace("    </div>\n  );\n}", modal_ui)


# 5. Table Headers for custom columns
th_old = '{visibleCols.hrRemarks && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/10">HR Remarks</th>}'
th_new = """{visibleCols.hrRemarks && <th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/10">HR Remarks</th>}
                          {customColumns.map(col => (
                            <th key={col} className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 w-40">
                              {col}
                            </th>
                          ))}"""

if "customColumns.map(col =>" not in content:
    content = content.replace(th_old, th_new)

# 6. Table Cells for custom columns
# Let's insert them right after hr_remarks
td_old = """{visibleCols.hrRemarks && (
<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <textarea
                                defaultValue={app.hr_remarks || ""}
                                placeholder="Any internal notes..."
                                onBlur={(e) => handleUpdateField(app.id, 'hr_remarks', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none resize-none overflow-hidden hover:bg-amber-50 dark:hover:bg-amber-900/20 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-inset focus:ring-amber-500"
                              />
                            </td>
)}"""

td_new = """{visibleCols.hrRemarks && (
<td className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                              <textarea
                                defaultValue={app.hr_remarks || ""}
                                placeholder="Any internal notes..."
                                onBlur={(e) => handleUpdateField(app.id, 'hr_remarks', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none resize-none overflow-hidden hover:bg-amber-50 dark:hover:bg-amber-900/20 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-inset focus:ring-amber-500"
                              />
                            </td>
)}
                            {customColumns.map(col => (
                              <td key={col} className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                                <textarea
                                  defaultValue={app[col] || ""}
                                  placeholder={`Enter ${col}...`}
                                  onBlur={(e) => handleUpdateField(app.id, col, e.target.value)}
                                  className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none resize-none overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900"
                                />
                              </td>
                            ))}"""

if "{customColumns.map(col => (" not in content:
    content = content.replace(td_old, td_new)


# 7. Update ColSpan logic
colspan_old = '<td colSpan={4 + Object.values(visibleCols).filter(Boolean).length}'
colspan_new = '<td colSpan={4 + Object.values(visibleCols).filter(Boolean).length + customColumns.length}'

if colspan_old in content:
    content = content.replace(colspan_old, colspan_new)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

