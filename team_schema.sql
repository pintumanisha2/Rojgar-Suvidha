CREATE TABLE IF NOT EXISTS employer_team_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_uid        TEXT NOT NULL, -- Ties to the company/employer account
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  role                TEXT DEFAULT 'Technical Interviewer',
  status              TEXT DEFAULT 'Pending Invite',
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- Ensure we don't have duplicate invites for the same company and email
CREATE UNIQUE INDEX IF NOT EXISTS unique_team_member_email 
ON employer_team_members (employer_uid, email);
