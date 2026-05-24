import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

# 1. State Additions
state_old = """  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");"""

state_new = """  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");"""

if "const [searchQuery," not in content:
    content = content.replace(state_old, state_new)


# 2. Filter Logic (Before return statement)
# Let's insert the filteredApplications derived state right before return
filter_logic = """
  const filteredApplications = jobApplications.filter(app => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = app.candidate?.full_name?.toLowerCase().includes(searchLower) || false;
    const emailMatch = app.candidate?.email?.toLowerCase().includes(searchLower) || false;
    const phoneMatch = app.candidate?.phone?.toLowerCase().includes(searchLower) || false;
    
    const statusMatch = statusFilter === 'all' || app.status === statusFilter;
    
    return (nameMatch || emailMatch || phoneMatch) && statusMatch;
  });

  return (
"""
if "const filteredApplications =" not in content:
    content = content.replace("  return (", filter_logic)


# 3. Use filteredApplications in map
if "{jobApplications.map((app, index) => (" in content:
    content = content.replace("{jobApplications.map((app, index) => (", "{filteredApplications.map((app, index) => (")


# 4. Add UI Search Bar & Dropdown
ui_old = """                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-emerald-600" /> Excel Pipeline: {selectedJobForApps ? selectedJobForApps.title : 'All Jobs Overview'}
                    </h3>
                  </div>
                  <div className="flex gap-2 relative">"""

ui_new = """                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm whitespace-nowrap">
                      <FileText className="w-4 h-4 text-emerald-600" /> Excel Pipeline: {selectedJobForApps ? selectedJobForApps.title : 'All Jobs Overview'}
                    </h3>
                  </div>
                  
                  <div className="flex flex-1 items-center gap-2 max-w-md w-full ml-auto">
                    <div className="relative flex-1">
                      <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search name, email..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-[10px] sm:text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-[10px] sm:text-xs py-1.5 px-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-gray-700 dark:text-gray-300"
                    >
                      <option value="all">All Stages</option>
                      <option value="applied">Applied</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="tech_round">Tech Round</option>
                      <option value="hr_round">HR Round</option>
                      <option value="hired">Hired / Selected</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="flex gap-2 relative shrink-0">"""

if "placeholder=\"Search name, email...\"" not in content:
    content = content.replace(ui_old, ui_new)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

