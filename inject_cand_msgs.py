import re

with open("src/app/dashboard/page.tsx", "r") as f:
    content = f.read()

# 1. State Injection
state_target = """  const [otpSubmitted, setOtpSubmitted] = useState(false);"""
state_repl = """  const [otpSubmitted, setOtpSubmitted] = useState(false);

  // Messages State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatConversations, setChatConversations] = useState<any[]>([]);
  const [selectedEmployerId, setSelectedEmployerId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
"""
if "const [chatMessages," not in content:
    content = content.replace(state_target, state_repl)

# 2. Logic Injection
logic_target = """  const playChimeSound = () => {"""
logic_repl = """  const loadMessages = () => {
    const mockStr = localStorage.getItem("rs_candidate_mock_messages");
    if (mockStr) {
      const msgs = JSON.parse(mockStr);
      setChatMessages(msgs);

      const empMap = new Map();
      msgs.forEach((m: any) => {
        const empId = m.sender_type === "employer" ? m.sender_id : m.receiver_id;
        const empName = m.sender_type === "employer" ? m.sender_name : m.receiver_name;
        const compName = m.company_name || "Company";
        
        if (!empMap.has(empId)) {
          empMap.set(empId, {
            id: empId,
            name: empName || "HR Manager",
            company: compName,
            lastMsg: m.message,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(m.created_at).getTime(),
            unread: 0
          });
        } else {
          const existing = empMap.get(empId);
          if (new Date(m.created_at).getTime() > existing.timestamp) {
            existing.lastMsg = m.message;
            existing.time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            existing.timestamp = new Date(m.created_at).getTime();
          }
        }
      });

      const sorted = Array.from(empMap.values()).sort((a: any, b: any) => b.timestamp - a.timestamp);
      setChatConversations(sorted);
    }
  };

  useEffect(() => {
    loadMessages();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "rs_candidate_mock_messages") {
        loadMessages();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedEmployerId) return;

    const messageText = chatInput.trim();
    setChatInput("");

    const targetEmp = chatConversations.find(c => c.id === selectedEmployerId);
    const lastMsgFromEmp = chatMessages.find((m: any) => m.sender_type === "employer" && m.sender_id === selectedEmployerId);
    const candId = lastMsgFromEmp ? lastMsgFromEmp.receiver_id : "cand-sandbox-123";
    const candName = lastMsgFromEmp ? lastMsgFromEmp.receiver_name : (user?.user_metadata?.full_name || profile?.full_name || "Candidate");

    const newMsgObj = {
      id: "msg-" + Date.now(),
      sender_id: candId,
      receiver_id: selectedEmployerId,
      message: messageText,
      sender_type: "candidate" as const,
      created_at: new Date().toISOString(),
      sender_name: candName,
      receiver_name: targetEmp?.name
    };

    const updatedMessages = [...chatMessages, newMsgObj];
    localStorage.setItem("rs_candidate_mock_messages", JSON.stringify(updatedMessages));
    loadMessages();
    window.dispatchEvent(new Event("storage"));
  };

  const playChimeSound = () => {"""
if "const loadMessages = () => {" not in content:
    content = content.replace(logic_target, logic_repl)

with open("src/app/dashboard/page.tsx", "w") as f:
    f.write(content)

