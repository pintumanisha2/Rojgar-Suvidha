import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

# Update Table Header
header_old = '<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10">Reason for Shortlisting</th>'
header_new = '<th className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/10">Stage / Verdict Reason</th>'

if header_old in content:
    content = content.replace(header_old, header_new)

# Update Textarea Placeholder
placeholder_old = 'placeholder="Why selected?"'
placeholder_new = 'placeholder="Reason for Shortlist, Selection, or Rejection..."'

if placeholder_old in content:
    content = content.replace(placeholder_old, placeholder_new)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

