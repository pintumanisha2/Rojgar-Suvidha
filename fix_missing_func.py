import re

with open("src/app/employer/pipeline/page.tsx", "r") as f:
    content = f.read()

missing_funcs = """  // Column Toggle State
  const [showColToggle, setShowColToggle] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    contact: true, role: true, stage: true, appliedOn: true,
    location: true, salary: true, notice: true, nextAction: true,
    shortlistReason: true, finalReason: true, hrRemarks: true
  });

  // Load custom columns from localStorage on mount
  useEffect(() => {
    const savedCols = localStorage.getItem('rs_custom_columns');
    if (savedCols) {
      try {
        setCustomColumns(JSON.parse(savedCols));
      } catch (e) {}
    }
  }, []);

  const handleAddCustomColumn = () => {
    if (!newColName.trim() || customColumns.includes(newColName.trim())) return;
    const updated = [...customColumns, newColName.trim()];
    setCustomColumns(updated);
    localStorage.setItem('rs_custom_columns', JSON.stringify(updated));
    setNewColName("");
    setIsAddColModalOpen(false);
  };
"""

target = """  // Column Toggle State
  const [showColToggle, setShowColToggle] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    contact: true, role: true, stage: true, appliedOn: true,
    location: true, salary: true, notice: true, nextAction: true,
    shortlistReason: true, finalReason: true, hrRemarks: true
  });"""

if "const handleAddCustomColumn =" not in content:
    content = content.replace(target, missing_funcs)

with open("src/app/employer/pipeline/page.tsx", "w") as f:
    f.write(content)

