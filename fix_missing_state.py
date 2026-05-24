import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

missing_state = """
  // Custom Columns State
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");

  // Column Toggle State
  const [showColToggle, setShowColToggle] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    contact: true, role: true, stage: true, appliedOn: true,
    location: true, salary: true, notice: true, nextAction: true,
    shortlistReason: true, finalReason: true, hrRemarks: true
  });
"""

target = "const [interviewTime, setInterviewTime] = useState(\"\");"

if "const [showColToggle" not in content:
    content = content.replace(target, target + "\n" + missing_state)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

