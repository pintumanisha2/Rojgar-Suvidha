import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

old_import = """  Trash2, Save, FileText, ChevronRight, Briefcase,"""
new_import = """  Trash2, Save, FileText, ChevronRight, Briefcase, List,"""

if old_import in content:
    content = content.replace(old_import, new_import)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

