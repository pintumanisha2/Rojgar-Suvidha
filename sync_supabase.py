import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

# Update handleUpdateField
old_update = """  const handleUpdateField = (appId: string, field: string, value: string) => {
    setJobApplications(prev => prev.map(a => a.id === appId ? { ...a, [field]: value } : a));
    const existing = JSON.parse(localStorage.getItem('rs_mock_applications') || '[]');
    const updated = existing.map((a: any) => a.id === appId ? { ...a, [field]: value } : a);
    localStorage.setItem('rs_mock_applications', JSON.stringify(updated));
    // Ideally update Supabase here too
  };"""

new_update = """  const handleUpdateField = async (appId: string, field: string, value: string) => {
    // Optimistic UI Update
    setJobApplications(prev => prev.map(a => a.id === appId ? { ...a, [field]: value } : a));
    
    // Local Storage Mock update
    const existing = JSON.parse(localStorage.getItem('rs_mock_applications') || '[]');
    const updated = existing.map((a: any) => a.id === appId ? { ...a, [field]: value } : a);
    localStorage.setItem('rs_mock_applications', JSON.stringify(updated));

    // Cloud Auto-Save
    if (userId && !appId.startsWith("mock-")) {
      try {
        const { error } = await supabase
          .from("private_job_applications")
          .update({ [field]: value })
          .eq("id", appId);
          
        if (error) console.warn(`Supabase Sync Error: Column '${field}' might be missing.`, error);
      } catch (err) {}
    }
  };"""

if old_update in content:
    content = content.replace(old_update, new_update)

# Update handleUpdateRemarks
old_remarks = """  const handleUpdateRemarks = async (appId: string, remarks: string) => {
    // Optimistic UI update for remarks (though currently not in state, let's add it)
    setJobApplications(prev => prev.map(a => a.id === appId ? { ...a, hr_remarks: remarks } : a));"""

new_remarks = """  const handleUpdateRemarks = async (appId: string, remarks: string) => {
    // Sync via our generic handler
    await handleUpdateField(appId, "hr_remarks", remarks);
  };
  
  // Keep the old signature if it was doing other things, but let's just replace the whole function if possible.
"""

# Let's just use regex to replace the entire handleUpdateRemarks function body since we don't know exact spacing.
# Actually, it's safer to just let handleUpdateField do it and point handleUpdateRemarks to it.
import re
pattern = re.compile(r'const handleUpdateRemarks = async \(appId: string, remarks: string\) => \{.*?\};', re.DOTALL)
replacement = """const handleUpdateRemarks = async (appId: string, remarks: string) => {
    handleUpdateField(appId, 'hr_remarks', remarks);
  };"""

content = pattern.sub(replacement, content)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

