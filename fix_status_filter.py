import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

target = '  const [searchQuery, setSearchQuery] = useState("");'
replacement = '  const [searchQuery, setSearchQuery] = useState("");\n  const [statusFilter, setStatusFilter] = useState("all");'

if 'const [statusFilter, setStatusFilter]' not in content:
    content = content.replace(target, replacement)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

