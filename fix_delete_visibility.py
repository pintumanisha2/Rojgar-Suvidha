import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

target = 'className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity p-0.5"'
replacement = 'className="text-red-400 hover:text-red-600 transition-colors p-0.5 ml-2"'

if target in content:
    content = content.replace(target, replacement)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

