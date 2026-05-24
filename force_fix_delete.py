import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

pattern = re.compile(r'\{customColumns\.map\(col => \(\s*<th key=\{col\} className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 w-40">\s*\{col\}\s*</th>\s*\)\)\}')

th_new = """{customColumns.map(col => (
                            <th key={col} className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 w-40 relative group">
                              <div className="flex items-center justify-between">
                                <span>{col}</span>
                                <button onClick={() => handleDeleteCustomColumn(col)} className="text-red-400 hover:text-red-600 transition-colors p-0.5 ml-2" title="Delete Column">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </th>
                          ))}"""

new_content = pattern.sub(th_new, content)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(new_content)

