export interface ResumeFormData {
  name: string;
  email: string;
  phone: string;
  city: string;
  dob: string;
  gender: string;
  objective_hint: string;
  edu10: { board: string; school: string; year: string; percent: string };
  edu12: { board: string; school: string; year: string; percent: string; stream?: string };
  eduGrad: { degree: string; college: string; university: string; year: string; percent: string };
  skills: string;
  experience: string;
  languages: string;
}

export interface GeneratedResumeData {
  objective: string;
  summary: string;
  skills_formatted: string[];
  achievements: string[];
  hobbies: string[];
}

export function generateLocalResume(form: ResumeFormData): GeneratedResumeData {
  // 1. Classify Category / Domain based on objective_hint & skills
  const hint = (form.objective_hint || "").toLowerCase();
  const rawSkills = (form.skills || "").toLowerCase();
  
  let category: "GOVERNMENT" | "TECH" | "SALES" | "FINANCE" | "ADMIN" | "DEFAULT" = "DEFAULT";
  
  const matchesGov = ["ssc", "railway", "rrb", "bank", "police", "teacher", "teaching", "civil", "upsc", "government", "sarkari", "clerk", "constable", "patwari", "army"];
  const matchesTech = ["software", "developer", "web", "it", "frontend", "backend", "fullstack", "coder", "programmer", "app", "java", "python", "react", "html", "css", "js", "computer", "science"];
  const matchesSales = ["sales", "marketing", "business", "retail", "digital", "seo", "growth", "lead", "client", "bd", "promoter"];
  const matchesFinance = ["finance", "account", "ca", "tax", "audit", "billing", "gst", "ledger", "tally", "banking"];
  const matchesAdmin = ["hr", "human", "admin", "operations", "management", "manager", "executive", "reception", "office", "clerical"];

  if (matchesGov.some(keyword => hint.includes(keyword) || rawSkills.includes(keyword))) {
    category = "GOVERNMENT";
  } else if (matchesTech.some(keyword => hint.includes(keyword) || rawSkills.includes(keyword))) {
    category = "TECH";
  } else if (matchesSales.some(keyword => hint.includes(keyword) || rawSkills.includes(keyword))) {
    category = "SALES";
  } else if (matchesFinance.some(keyword => hint.includes(keyword) || rawSkills.includes(keyword))) {
    category = "FINANCE";
  } else if (matchesAdmin.some(keyword => hint.includes(keyword) || rawSkills.includes(keyword))) {
    category = "ADMIN";
  }

  // 2. Check if candidate is Fresher
  const expText = (form.experience || "").toLowerCase();
  const isFresher = expText === "" || expText.includes("fresh") || expText.includes("fresher") || expText === "no" || expText === "none";

  // 3. Process user inputted skills
  const cleanInputSkills = (form.skills || "")
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 1)
    .map(s => {
      // Capitalize first letter of each word
      return s.replace(/\b\w/g, c => c.toUpperCase());
    });

  // 4. Select templates based on Category & Experience Level
  let objective = "";
  let summary = "";
  let skillsFormatted: string[] = [];
  let achievements: string[] = [];
  let hobbies: string[] = [];

  switch (category) {
    case "GOVERNMENT":
      objective = isFresher
        ? "To secure a challenging position in a prestigious government sector where I can leverage my academic foundation, dedication, and problem-solving skills to contribute to public administration and organizational growth while serving the nation with integrity."
        : "Dedicated and disciplined professional seeking a suitable role in the public sector to utilize my proven administrative capabilities, operational efficiency, and leadership skills to drive organizational goals and deliver excellence in public service.";
      
      summary = isFresher
        ? "Highly motivated and detail-oriented candidate with a stellar academic record and strong fundamental competencies. Possesses excellent analytical ability, exceptional time management, and a strong work ethic suitable for structured public sector responsibilities."
        : "Result-driven and disciplined professional with extensive experience in administrative operations and team management. Expert in maintaining high standards of compliance, standard operating procedures, and executing tasks with high precision and transparency.";
      
      skillsFormatted = Array.from(new Set([
        ...cleanInputSkills,
        "Computer Proficiency",
        "Data Entry & Typing",
        "Public Relations",
        "Office Administration",
        "Analytical Problem Solving"
      ])).slice(0, 7);

      achievements = [
        `Successfully completed academic qualifications with excellent grades, ranking high in top percentiles.`,
        "Active participant in school/college quiz, debate, and social service initiatives, demonstrating leadership and public spirit.",
        "Certified in computer operations and application software, achieving high proficiency in digital spreadsheets and records."
      ];

      hobbies = ["Reading biographies", "Outdoor sports (Cricket/Badminton)", "Preparing for competitive exams", "Volunteering at blood donation camps"];
      break;

    case "TECH":
      objective = isFresher
        ? `Enthusiastic and detail-oriented technology graduate seeking an entry-level position as a ${form.objective_hint || "Software Engineer"} to apply my programming skills, algorithmic knowledge, and passion for modern web technologies to build scalable, high-impact digital solutions.`
        : `Innovative ${form.objective_hint || "Software Engineer"} with a strong track record of designing, developing, and deploying robust software solutions. Eager to join a dynamic development team to leverage my tech expertise and architectural skills to drive excellence.`;

      summary = isFresher
        ? "Proactive programmer with hands-on project experience in web technologies and software design principles. Strong logical thinker, quick learner of new framework stacks, and an excellent collaborator in agile, fast-paced team environments."
        : "Highly skilled technical professional with a successful record of building scalable web architectures, APIs, and optimizing database performance. Expert in clean code standards, system tuning, and mentoring development teams.";

      skillsFormatted = Array.from(new Set([
        ...cleanInputSkills,
        "Data Structures & Algorithms",
        "Version Control (Git)",
        "Database Management",
        "REST APIs & Integrations",
        "Agile Methodologies"
      ])).slice(0, 7);

      achievements = [
        "Designed and successfully deployed multiple open-source software applications with high performance indices.",
        "Recognized for quick bug fixing and high-quality coding implementations in technical workshops and hackathons.",
        "Successfully completed certified advanced software development bootcamps and algorithmic training courses."
      ];

      hobbies = ["Coding side projects", "Reading tech blogs & documentations", "Playing strategy games & Chess", "Attending technology meetups"];
      break;

    case "SALES":
      objective = isFresher
        ? "Ambitious and energetic graduate looking to jumpstart a career in Sales & Marketing. Seeking to leverage my outstanding communication, persuasion, and interpersonal skills to drive business growth, capture market share, and exceed sales targets."
        : "High-performing Sales & Business Development professional with a proven track record of exceeding revenue goals. Passionate about building long-term client relationships, identifying high-potential market opportunities, and negotiating high-value deals.";

      summary = isFresher
        ? "Highly expressive and result-oriented candidate with a deep interest in consumer behavior, market dynamics, and customer relationship management. Natural networker with exceptional listening skills, resilience, and a goal-oriented mindset."
        : "Dynamic sales strategist with a track record of driving revenue growth and scaling business portfolios. Expert in market penetration, lead generation, key account management, and training high-performing sales teams.";

      skillsFormatted = Array.from(new Set([
        ...cleanInputSkills,
        "Negotiation & Persuasion",
        "Market Research & Analysis",
        "Client Relationship Building",
        "CRM & Pipeline Management",
        "Public Speaking & Presentation"
      ])).slice(0, 7);

      achievements = [
        "Led inter-collegiate management event marketing, increasing footfall and digital engagement by over 40%.",
        "Exceeded monthly lead generation and client outreach targets by 125% during internship projects.",
        "Awarded 'Best Presenter' in regional business pitch and mock-selling competitions."
      ];

      hobbies = ["Reading business biographies", "Active networking", "Traveling & exploring cultures", "Blogging on digital consumer trends"];
      break;

    case "FINANCE":
      objective = isFresher
        ? "Meticulous and analytical commerce graduate seeking an entry-level Finance or Accounting role. Aiming to apply my understanding of financial principles, taxation rules, and spreadsheet software to maintain flawless ledger records and assist in audits."
        : "Seasoned Finance professional with extensive experience in accounting, tax compliance, and financial analysis. Seeking to leverage my deep expertise in corporate reporting, cost control, and budget optimization to ensure stellar fiscal health.";

      summary = isFresher
        ? "Detail-oriented finance enthusiast with a solid grasp of double-entry bookkeeping, financial statement analysis, and compliance regulations. Possesses strong analytical rigor, high ethical standards, and advanced proficiency in spreadsheet utilities."
        : "Chartered accountant/finance analyst with a successful history of managing corporate accounts, mitigating compliance risks, and conducting comprehensive financial audits. Expert at translating numbers into actionable strategic growth initiatives.";

      skillsFormatted = Array.from(new Set([
        ...cleanInputSkills,
        "Financial Reporting",
        "Tax Compliance & GST",
        "Budgeting & Forecasting",
        "General Ledger Accounting",
        "Advanced Excel & Spreadsheet Automation"
      ])).slice(0, 7);

      achievements = [
        "Accurately audited and reconciled multi-ledger accounts, reducing discrepancy rates to zero during professional training.",
        "Developed automated spreadsheet formulas that reduced weekly ledger reconciliation time by 30%.",
        "Consistently recognized for academic excellence in advanced financial accounting and corporate taxation courses."
      ];

      hobbies = ["Analyzing stock market trends", "Reading financial & economic columns", "Playing chess", "Personal finance planning"];
      break;

    case "ADMIN":
      objective = isFresher
        ? "Motivated and organized graduate seeking a career path in Human Resources or Administrative Operations. Eager to utilize my strong communication, event coordination, and conflict-resolution skills to support employee relations and maintain efficient office workflows."
        : "People-centric and detail-driven Operations/HR professional seeking a key leadership position. Dedicated to implementing progressive workplace policies, streamlining business workflows, and building inclusive team cultures that boost productivity.";

      summary = isFresher
        ? "Enthusiastic and highly organized individual with a strong foundation in administrative practices and human relations. Highly empathetic listener, adept at multi-tasking, maintaining strict confidentiality, and coordinating office logistics."
        : "Accomplished HR Specialist with comprehensive expertise in recruitment, employee relations, onboarding, compliance, and office administration. Skilled at resolving operational bottlenecks and boosting overall employee engagement.";

      skillsFormatted = Array.from(new Set([
        ...cleanInputSkills,
        "Talent Acquisition",
        "Employee Onboarding & Relations",
        "Workflow & Operations Management",
        "Conflict Resolution & Mediation",
        "Vendor & Office Logistics Coordination"
      ])).slice(0, 7);

      achievements = [
        "Successfully coordinated large-scale college recruitment drives and campus events with over 500+ attendees.",
        "Designed and implemented digitized employee feedback templates that improved response rates by 50%.",
        "Consistently rated as 'Outstanding Organizer' for managing cultural and guest speaker conferences in college."
      ];

      hobbies = ["Reading psychology and HR journals", "Event organization", "Practicing yoga & mindfulness", "Volunteering for youth mentoring programs"];
      break;

    default:
      objective = isFresher
        ? "To secure a position in a growth-oriented organization where I can apply my education, technical capabilities, and positive work ethic. Committed to continuous learning and contributing effectively to team goals."
        : "Goal-oriented professional with a strong track record of success seeking a challenging role to leverage my diverse skill set, operational efficiency, and problem-solving abilities to deliver organizational success.";

      summary = isFresher
        ? "Enthusiastic, reliable, and detail-oriented individual with strong communication and problem-solving skills. Quick learner with a high degree of adaptability, ready to take on challenging responsibilities and grow with the organization."
        : "Versatile professional with a stellar history of delivering results and improving operational workflows. Strong analytical thinker, proactive collaborator, and adept at managing projects from inception to high-quality completion.";

      skillsFormatted = Array.from(new Set([
        ...cleanInputSkills,
        "Critical Thinking",
        "Effective Communication",
        "Task Prioritization",
        "Team Collaboration",
        "Problem Solving"
      ])).slice(0, 7);

      achievements = [
        "Recognized multiple times for outstanding dedication, punctuality, and excellent performance in academic projects.",
        "Successfully organized and managed several extracurricular workshops and student forums.",
        "Completed certified skill-enhancement courses, proving dedication to continuous professional growth."
      ];

      hobbies = ["Reading books", "Engaging in fitness activities", "Learning new digital skills", "Community participation"];
      break;
  }

  // 5. Fallbacks for empty forms
  if (skillsFormatted.length === 0) {
    skillsFormatted = ["Communication", "Problem Solving", "Time Management", "Team Collaboration"];
  }

  return {
    objective,
    summary,
    skills_formatted: skillsFormatted,
    achievements,
    hobbies
  };
}
