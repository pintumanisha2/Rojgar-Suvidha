export interface Author {
  slug: string;
  name: string;
  initial: string;
  role: string;
  qualification: string;
  experience: string;
  speciality: string[];
  color: string;
  bio: string;
  avatarUrl?: string;
  socials: {
    linkedin?: string;
    twitter?: string;
    telegram?: string;
  };
}

export const AUTHORS: Author[] = [
  {
    slug: "arjun-sharma",
    name: "Arjun Sharma",
    initial: "A",
    role: "Senior Exam Analyst & Chief Editor",
    qualification: "MA Political Science, B.Ed",
    experience: "12+ Years in Sarkari Recruitment Journalism",
    speciality: ["latest-jobs", "results"],
    color: "bg-indigo-600",
    bio: "Arjun has over 12 years of experience analyzing central government examinations including SSC CGL, UPSC Civil Services, and Railway RRB exams. He specializes in cut-off predictions, vacancy breakdowns, and exam pattern changes.",
    socials: {
      telegram: "https://t.me/govermentform",
      twitter: "https://twitter.com/rojgarsuvidha",
    },
  },
  {
    slug: "priya-verma",
    name: "Priya Verma",
    initial: "P",
    role: "Admit Card & Result Specialist",
    qualification: "B.Ed, M.Sc Mathematics",
    experience: "8+ Years in Educational & Examination Coverage",
    speciality: ["admit-card", "answer-key", "results"],
    color: "bg-rose-600",
    bio: "Priya tracks live examination updates, admit card download releases, and answer key objection windows across national and state testing agencies. She ensures candidates get verified download links within minutes of release.",
    socials: {
      telegram: "https://t.me/govermentform",
    },
  },
  {
    slug: "rajesh-kumar",
    name: "Rajesh Kumar",
    initial: "R",
    role: "Railway & Defence Jobs Expert",
    qualification: "B.Tech Mechanical, MBA",
    experience: "10+ Years in Technical & Defence Recruitment",
    speciality: ["latest-jobs"],
    color: "bg-emerald-600",
    bio: "Rajesh is a former recruitment correspondent specializing in Indian Railways (RRB NTPC, Group D, ALP), Defence (Army, Navy, Airforce, Agniveer), and Engineering PSU jobs. He breaks down technical eligibility and physical standards.",
    socials: {
      telegram: "https://t.me/govermentform",
    },
  },
  {
    slug: "sunita-devi",
    name: "Sunita Devi",
    initial: "S",
    role: "State Govt Jobs Correspondent",
    qualification: "MA Hindi, LLB",
    experience: "10+ Years in State PSC & Teacher Recruitment",
    speciality: ["latest-jobs", "news"],
    color: "bg-amber-600",
    bio: "Sunita covers state-level public service commission examinations including UPPSC, BPSC, MPPSC, HSSC, and REET. She specializes in local state notifications, reservation rules, and domicile criteria.",
    socials: {
      telegram: "https://t.me/govermentform",
    },
  },
  {
    slug: "vivek-mishra",
    name: "Vivek Mishra",
    initial: "V",
    role: "Admission & Education Desk Head",
    qualification: "M.Ed, UGC-NET Qualified",
    experience: "9+ Years in Higher Education & Entrance Exams",
    speciality: ["admission", "news"],
    color: "bg-violet-600",
    bio: "Vivek leads the education and entrance exam desk at Rojgar Suvidha, tracking CUET, NEET, JEE, University admissions, and national scholarship schemes for students across India.",
    socials: {
      telegram: "https://t.me/govermentform",
    },
  },
];

/**
 * Deterministic author selection by slug & category
 */
export function getAuthorBySlug(slug: string): Author | undefined {
  return AUTHORS.find((a) => a.slug === slug);
}

export function selectAuthorForJob(jobSlug: string, category: string): Author {
  const catAuthors = AUTHORS.filter((a) => a.speciality.includes(category));
  const pool = catAuthors.length > 0 ? catAuthors : AUTHORS;
  const charSum = jobSlug.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return pool[charSum % pool.length];
}
