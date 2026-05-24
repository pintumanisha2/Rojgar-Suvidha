with open(".gemini/antigravity-ide/brain/9c90a884-7a37-43f6-a443-459424a59d95/task.md", "r") as f:
    content = f.read()

content = content.replace("[ ] Add \"Message\" button to Candidate Cards", "[x] Add \"Message\" button to Candidate Cards")
content = content.replace("[ ] Overhaul `src/app/employer/messages/page.tsx`", "[x] Overhaul `src/app/employer/messages/page.tsx`")
content = content.replace("[ ] Implement `window.addEventListener('storage')` for real-time synchronization in Employer Inbox.", "[x] Implement `window.addEventListener('storage')` for real-time synchronization in Employer Inbox.")

with open(".gemini/antigravity-ide/brain/9c90a884-7a37-43f6-a443-459424a59d95/task.md", "w") as f:
    f.write(content)
