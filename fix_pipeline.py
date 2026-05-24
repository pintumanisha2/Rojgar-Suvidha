import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

# Replace the wrapper to be full size
content = content.replace(
    '<div className="flex-1 bg-gray-50/50 dark:bg-gray-950/30 py-8 px-4 min-h-screen">\n      <div className="max-w-5xl mx-auto space-y-6">',
    '<div className="flex-1 bg-gray-50/50 dark:bg-gray-950/30 p-6 min-h-screen">\n      <div className="w-full max-w-full h-full space-y-6">'
)

# Remove the header block and tabs, and the "jobs" tab content
# Since it's huge, we'll use regex or string manipulation.

start_idx = content.find('{/* Header Block */}')
end_idx = content.find('/* APPLICATIONS & ATS TAB CONTENT */')

if start_idx != -1 and end_idx != -1:
    # We want to replace from start_idx up to the applications tab content
    # But wait, there is a conditional ) : activeTab === "applications" ? ( that we also want to remove
    
    # We can just let it render applications if we set activeTab to "applications" and remove the other branches.
    pass

# A simpler way:
# Just change the default state of activeTab to "applications"
content = content.replace(
    'const [activeTab, setActiveTab] = useState<"jobs" | "talent" | "applications" | "settings">("jobs");',
    'const [activeTab, setActiveTab] = useState<"jobs" | "talent" | "applications" | "settings">("applications");'
)

# And remove Header Block and Tabs:
header_start = content.find('{/* Header Block */}')
tabs_end = content.find('{activeTab === "jobs" ? (')

if header_start != -1 and tabs_end != -1:
    content = content[:header_start] + content[tabs_end:]

# Write it back
with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

