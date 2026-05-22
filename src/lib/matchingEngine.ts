export interface UserProfile {
  skills: string[];
  desired_role: string;
  preferred_location?: string;
}

export interface MatchResult {
  percentage: number;
  matchedSkills: string[];
  matchedRole: boolean;
  reasons: string[];
}

/**
 * Calculates matching score and reasoning between a job posting and candidate's preferences
 */
export function calculateJobMatch(
  jobTitle: string,
  jobDesc: string,
  jobSkills: string[] = [],
  jobLoc: string = "",
  profile?: UserProfile | null
): MatchResult {
  if (!profile || (!profile.desired_role && (!profile.skills || profile.skills.length === 0))) {
    return {
      percentage: 0,
      matchedSkills: [],
      matchedRole: false,
      reasons: []
    };
  }

  let score = 0;
  let maxScore = 0;
  const reasons: string[] = [];
  const matchedSkills: string[] = [];
  let matchedRole = false;

  const titleLower = jobTitle.toLowerCase();
  const descLower = (jobDesc || "").toLowerCase();
  const textToSearch = `${titleLower} ${descLower}`;

  // 1. Desired Role Matching (+50 points)
  if (profile.desired_role) {
    maxScore += 50;
    const roleLower = profile.desired_role.toLowerCase().trim();
    
    // Check direct matching or keyword sub-matching
    if (titleLower.includes(roleLower) || descLower.includes(roleLower)) {
      score += 50;
      matchedRole = true;
      reasons.push(`Matches your target role: "${profile.desired_role}"`);
    } else {
      // Check partial words (e.g. "React Developer" -> "react")
      const words = roleLower.split(/\s+/).filter(w => w.length > 2);
      let partialMatch = false;
      for (const word of words) {
        if (titleLower.includes(word)) {
          score += 35; // slightly lower score for partial matching
          partialMatch = true;
          matchedRole = true;
          reasons.push(`Highly relevant to your "${profile.desired_role}" interests`);
          break;
        }
      }
    }
  }

  // 2. Skills Matching (+15 points per skill, capped at 45)
  if (profile.skills && profile.skills.length > 0) {
    maxScore += 45;
    let skillScore = 0;
    
    for (const skill of profile.skills) {
      const sLower = skill.toLowerCase().trim();
      if (!sLower) continue;

      // Check in job's structured skills array OR text description
      const foundInStructured = jobSkills.some(js => js.toLowerCase().includes(sLower) || sLower.includes(js.toLowerCase()));
      const foundInText = textToSearch.includes(sLower);

      if (foundInStructured || foundInText) {
        matchedSkills.push(skill);
        skillScore += 15;
      }
    }

    const finalSkillPoints = Math.min(45, skillScore);
    score += finalSkillPoints;

    if (matchedSkills.length > 0) {
      reasons.push(`Matches your skills: ${matchedSkills.slice(0, 3).join(", ")}${matchedSkills.length > 3 ? "..." : ""}`);
    }
  }

  // 3. Location Matching (+15 points)
  if (profile.preferred_location && jobLoc) {
    maxScore += 15;
    const prefLocLower = profile.preferred_location.toLowerCase().trim();
    const jobLocLower = jobLoc.toLowerCase().trim();

    if (prefLocLower !== "all india" && prefLocLower !== "remote" && (jobLocLower.includes(prefLocLower) || prefLocLower.includes(jobLocLower))) {
      score += 15;
      reasons.push(`Located in your preferred city: ${jobLoc}`);
    } else if (prefLocLower === "remote" && (titleLower.includes("wfh") || titleLower.includes("remote") || descLower.includes("work from home"))) {
      score += 15;
      reasons.push("Perfect remote work / WFH match");
    }
  }

  // Fallback maxScore safeguard
  if (maxScore === 0) maxScore = 100;

  // Normalize match percentage
  const percentage = Math.min(100, Math.round((score / maxScore) * 100));

  return {
    percentage,
    matchedSkills,
    matchedRole,
    reasons
  };
}
