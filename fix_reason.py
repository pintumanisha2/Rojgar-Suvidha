import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

# Update Reason for shortlist textarea
old_reason = """                              <textarea
                                defaultValue={app.reason_for_shortlist || ""}
                                placeholder="Why selected?"
                                onBlur={(e) => {
                                  // Update state and local storage logic for reason (could reuse remark logic)
                                  setJobApplications(prev => prev.map(a => a.id === app.id ? { ...a, reason_for_shortlist: e.target.value } : a));
                                  const existing = JSON.parse(localStorage.getItem('mock_applications') || '[]');
                                  const updated = existing.map((a: any) => a.id === app.id ? { ...a, reason_for_shortlist: e.target.value } : a);
                                  localStorage.setItem('mock_applications', JSON.stringify(updated));
                                }}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none resize-none overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-inset focus:ring-indigo-500"
                              />"""

new_reason = """                              <textarea
                                defaultValue={app.reason_for_shortlist || ""}
                                placeholder="Why selected?"
                                onBlur={(e) => handleUpdateField(app.id, 'reason_for_shortlist', e.target.value)}
                                className="w-full h-full min-h-[40px] px-3 py-2 bg-transparent outline-none resize-none overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-1 focus:ring-inset focus:ring-indigo-500"
                              />"""

if old_reason in content:
    content = content.replace(old_reason, new_reason)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

