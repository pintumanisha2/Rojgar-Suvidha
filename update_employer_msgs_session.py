import re

with open("src/app/employer/messages/page.tsx", "r") as f:
    content = f.read()

target = """  useEffect(() => {
    const storedHr = localStorage.getItem("employer_name");
    const storedCompany = localStorage.getItem("employer_company");
    if (storedHr) setHrName(storedHr);
    if (storedCompany) setCompanyName(storedCompany);

    loadMessages();"""

replacement = """  useEffect(() => {
    const storedHr = localStorage.getItem("employer_name");
    const storedCompany = localStorage.getItem("employer_company");
    if (storedHr) setHrName(storedHr);
    if (storedCompany) setCompanyName(storedCompany);

    loadMessages();

    // Check if we were redirected from Talent Scout
    const scoutData = sessionStorage.getItem('rs_outbound_scout');
    if (scoutData) {
      try {
        const cand = JSON.parse(scoutData);
        if (cand && cand.id) {
          // Add dummy message to start conversation if none exists
          const currentMsgs = JSON.parse(localStorage.getItem("rs_candidate_mock_messages") || "[]");
          const hasConv = currentMsgs.some((m: any) => m.sender_id === cand.id || m.receiver_id === cand.id);
          
          if (!hasConv) {
             const initMsg = {
                id: "msg-init-" + Date.now(),
                sender_id: cand.id,
                receiver_id: "demo-recruiter-uid",
                message: `Start of conversation with ${cand.full_name || cand.name}`,
                sender_type: "candidate" as const, // just a placeholder
                created_at: new Date(Date.now() - 10000).toISOString(),
                sender_name: cand.full_name || cand.name,
                receiver_name: storedHr || "HR Manager"
             };
             localStorage.setItem("rs_candidate_mock_messages", JSON.stringify([...currentMsgs, initMsg]));
             loadMessages();
          }
          setTimeout(() => setSelectedCandidateId(cand.id), 100);
          sessionStorage.removeItem('rs_outbound_scout');
        }
      } catch (e) {}
    }"""

if "sessionStorage.getItem('rs_outbound_scout')" not in content:
    content = content.replace(target, replacement)

with open("src/app/employer/messages/page.tsx", "w") as f:
    f.write(content)

