import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

# 1. Add handleDeleteCustomColumn function
delete_func = """  const handleDeleteCustomColumn = (colToRemove: string) => {
    const updated = customColumns.filter(c => c !== colToRemove);
    setCustomColumns(updated);
    localStorage.setItem('rs_custom_columns', JSON.stringify(updated));
  };
"""

target_func = "  const handleAddCustomColumn = () => {"
if "const handleDeleteCustomColumn =" not in content:
    content = content.replace(target_func, delete_func + "\n" + target_func)

# 2. Fix Custom Columns TH to include Delete button
th_old = """                          {customColumns.map(col => (
                            <th key={col} className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 w-40">
                              {col}
                            </th>
                          ))}"""

th_new = """                          {customColumns.map(col => (
                            <th key={col} className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 w-40 relative group">
                              <div className="flex items-center justify-between">
                                <span>{col}</span>
                                <button onClick={() => handleDeleteCustomColumn(col)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity p-0.5" title="Delete Column">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </th>
                          ))}"""

if "group-hover:opacity-100" not in content:
    content = content.replace(th_old, th_new)

# 3. Inject missing custom columns mapping in the body
body_target = """                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-center space-y-1">
                              {(app.candidate?.resume_url || app.resume_url) && ("""

body_new = """                            {customColumns.map(col => (
                              <td key={col} className="px-0 py-0 border border-gray-300 dark:border-gray-700 align-top group">
                                <textarea
                                  defaultValue={app[col] || ""}
                                  placeholder={`Enter ${col}...`}
                                  onBlur={(e) => handleUpdateField(app.id, col, e.target.value)}
                                  className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none resize-none overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900"
                                />
                              </td>
                            ))}
                            <td className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-center space-y-1">
                              {(app.candidate?.resume_url || app.resume_url) && ("""

if "{customColumns.map(col => (" not in content.split('<tbody')[1]:
    content = content.replace(body_target, body_new)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

