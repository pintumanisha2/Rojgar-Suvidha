import re

with open("src/app/employer/dashboard/page.tsx", "r") as f:
    content = f.read()

target1 = """      sender_type: "employer" as const,
      created_at: new Date().toISOString(),
      sender_name: hrName,
      company_name: companyName"""
replacement1 = """      sender_type: "employer" as const,
      created_at: new Date().toISOString(),
      sender_name: hrName,
      company_name: companyName,
      receiver_name: selectedCandidate.full_name || selectedCandidate.name"""

if replacement1 not in content:
    content = content.replace(target1, replacement1)

target2 = """      sender_type: "candidate" as const,
      created_at: new Date().toISOString()"""
replacement2 = """      sender_type: "candidate" as const,
      created_at: new Date().toISOString(),
      sender_name: selectedCandidate.full_name || selectedCandidate.name,
      receiver_name: hrName"""

if replacement2 not in content:
    content = content.replace(target2, replacement2)

with open("src/app/employer/dashboard/page.tsx", "w") as f:
    f.write(content)

