import re

files = [
    "src/app/employer/dashboard/page.tsx",
    "src/app/employer/pipeline/page.tsx"
]

pattern = re.compile(r'\s*\{\/\* Database instructions for admin \*\/\}\s*<div[^>]*>.*?recruiter Portal Database Vetting Info.*?</div>\s*</div>', re.DOTALL)

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = pattern.sub('', content)
    
    with open(filepath, 'w') as f:
        f.write(new_content)

print("Removed from files")
