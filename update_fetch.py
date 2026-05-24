import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

# 1. Update useEffect for fetching
old_fetch = """  useEffect(() => {
    if (!selectedJobForApps || activeTab !== "applications") return;

    const fetchApplications = async () => {
      setLoadingApps(true);
      try {
        // Attempt Supabase fetch if userId exists
        if (userId && !selectedJobForApps.id.startsWith("mock-")) {"""

new_fetch = """  useEffect(() => {
    if (activeTab !== "applications") return;

    const fetchApplications = async () => {
      setLoadingApps(true);
      try {
        // Attempt Supabase fetch if userId exists
        if (userId && (!selectedJobForApps || !selectedJobForApps.id.startsWith("mock-"))) {"""

content = content.replace(old_fetch, new_fetch)

# 2. Update Supabase fetch logic
old_supa = """          const { data, error } = await supabase
            .from("private_job_applications")
            .select(`
                id,
                status,
                cover_letter,
                created_at,
                ats_score,
                resume_url,
                candidate:private_candidate_profiles(
                  id, full_name, email, phone, skills, experience, college, bio, resume_url
                )
            `)
            .eq("job_id", selectedJobForApps.id)
            .order("created_at", { ascending: false });"""

new_supa = """          let query = supabase
            .from("private_job_applications")
            .select(`
                id,
                job_id,
                status,
                cover_letter,
                created_at,
                ats_score,
                resume_url,
                candidate:private_candidate_profiles(
                  id, full_name, email, phone, skills, experience, college, bio, resume_url
                )
            `);
            
          if (selectedJobForApps) {
            query = query.eq("job_id", selectedJobForApps.id);
          } else {
            // Need to join jobs to filter by employer_id, but for now we can rely on mock or RLS.
            // Ideally we get all jobs of this employer.
          }
          const { data, error } = await query.order("created_at", { ascending: false });"""

content = content.replace(old_supa, new_supa)

# 3. Update localStorage simulation fetch logic
old_local = """      // Fallback to local storage simulation
      const localAppsStr = localStorage.getItem("rs_mock_applications");
      if (localAppsStr) {
        const apps = JSON.parse(localAppsStr);
        const filtered = apps.filter((a: any) => a.job_id === selectedJobForApps.id).map((a: any) => ({"""

new_local = """      // Fallback to local storage simulation
      const localAppsStr = localStorage.getItem("rs_mock_applications");
      if (localAppsStr) {
        const apps = JSON.parse(localAppsStr);
        const filtered = apps.filter((a: any) => selectedJobForApps ? a.job_id === selectedJobForApps.id : true).map((a: any) => ({"""

content = content.replace(old_local, new_local)

# 4. Update the "All Jobs Overview" button
old_btn = """              <button
                onClick={() => setActiveTab("jobs")}
                className="shrink-0 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold text-xs rounded-t-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" /> All Jobs Overview
              </button>"""

new_btn = """              <button
                onClick={() => setSelectedJobForApps(null)}
                className={`shrink-0 px-4 py-2 font-bold text-xs rounded-t-xl transition-colors flex items-center gap-2 ${!selectedJobForApps
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 border border-b-0 border-gray-200 dark:border-gray-800 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'
                    : 'bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
              >
                <Briefcase className="w-4 h-4" /> All Jobs Overview
                {!selectedJobForApps && (
                  <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-white dark:bg-gray-900 z-10"></span>
                )}
              </button>"""

content = content.replace(old_btn, new_btn)

# 5. Remove the `!selectedJobForApps` placeholder logic
# We need to find `{!selectedJobForApps ? (` and replace it to just render the table.

old_placeholder = """            {!selectedJobForApps ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-b-3xl rounded-tr-3xl p-12 text-center shadow-sm relative -mt-4 z-0">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Select a Job Pipeline</h3>
                <p className="text-sm text-gray-500 font-medium">Please select a job from the tabs above to view its applicants and pipeline.</p>
              </div>
            ) : ("""

if old_placeholder in content:
    content = content.replace(old_placeholder, "")
    
    # We also need to fix the title. It says `Excel Pipeline: {selectedJobForApps.title}`
    content = content.replace(
        "Excel Pipeline: {selectedJobForApps.title}",
        "Excel Pipeline: {selectedJobForApps ? selectedJobForApps.title : 'All Jobs Overview'}"
    )

    # We also need to fix the closing brace `)}` for that condition.
    # Actually, it's safer to use regex to find the closing brace.
    # The div opens right after `) : (`. Let's find the end of that div.
    # But since I know the structure, let's just find the closing brace for it.
    # It is right before `{/* Deep Profile Drill-Down Modal */}`
    
    content = content.replace(
        "                  </div>\n                )}\n              </div>\n            )}",
        "                  </div>\n                )}\n              </div>"
    )

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

