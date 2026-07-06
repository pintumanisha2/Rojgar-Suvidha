export interface CurrentAffairsItem {
  question: string;
  answer: string;
}

export interface GkTrick {
  title: string;
  trick: string;
}

export interface ExamTarget {
  monthsToGo: number;
  focus: string;
  checklist: string[];
  gkTricks: GkTrick[];
}

export const CALENDAR_CONFIG = {
  // Top Current Affairs of the previous month (June 2026) to show on the July 2026 printout
  currentAffairs: [
    {
      question: "Who was appointed as the new Chief of Army Staff of India in June 2026?",
      answer: "Lt Gen Upendra Dwivedi"
    },
    {
      question: "Which country won the ICC Men's T20 World Cup 2026?",
      answer: "India (defeated South Africa in final)"
    },
    {
      question: "What is the rank of India in the World Press Freedom Index 2026?",
      answer: "150th out of 180 countries"
    },
    {
      question: "Which Indian state has launched the 'Har Ghar Nal Yojana' feedback portal?",
      answer: "Uttar Pradesh"
    },
    {
      question: "Who won the French Open Men's Singles title in 2026?",
      answer: "Carlos Alcaraz"
    },
    {
      question: "India's first fully indigenous bullet train project started on which route?",
      answer: "Mumbai-Ahmedabad High-Speed Rail"
    },
    {
      question: "What is the theme of International Yoga Day celebrated on June 21, 2026?",
      answer: "Yoga for Self and Society"
    },
    {
      question: "Which IIT developed the 'Smart Agri-Scout' drone technology in June 2026?",
      answer: "IIT Madras"
    }
  ] as CurrentAffairsItem[],

  // Dynamic targets based on the countdown (relative to when CGL/UPSC is scheduled)
  studyTargets: {
    upsc: {
      monthsToGo: 5,
      focus: "Polity, Economy & Modern History. Target: Complete Lakshmikanth chapters 1-25 & NCERT Economy Class 11-12.",
      checklist: [
        "📰 Read Editorial (The Hindu / Indian Express)",
        "✍️ Daily 1 Mains GS Answer Writing Practice",
        "🧠 Solve 20 CSAT Reasoning & Math Questions",
        "📓 Revise static notes for 1 hour"
      ],
      gkTricks: [
        { title: "Mughal Kings (BHAJSA)", trick: "Babar, Humayun, Akbar, Jahangir, ShahJahan, Aurangzeb" },
        { title: "UN Languages (FACERS)", trick: "French, Arabic, Chinese, English, Russian, Spanish" }
      ]
    },
    ssc: {
      monthsToGo: 3,
      focus: "Quantitative Aptitude (Arithmetic) & English Grammar. Target: Practice 100 math problems daily.",
      checklist: [
        "⏰ 1 Full-Length Speed Mock Test (SSC CGL)",
        "🧮 30 minutes Math Simplification drills",
        "📖 Learn 20 new English Synonyms/Antonyms",
        "🌍 General Studies Quiz (30 questions)"
      ],
      gkTricks: [
        { title: "SAARC Countries (MBBS PAIN)", trick: "Maldives, Bangladesh, Bhutan, SriLanka, Pakistan, Afghan, India, Nepal" },
        { title: "Rupee Currency (SIMPN)", trick: "SriLanka, India, Maldives, Pakistan, Nepal, Seychelles" }
      ]
    },
    railway: {
      monthsToGo: 4,
      focus: "General Science (Physics/Chemistry) & General Intelligence. Target: Speed drills for arithmetic.",
      checklist: [
        "🧬 Revise 2 chapters of General Science (Class 9/10)",
        "🧩 Solve 30 Reasoning puzzles",
        "⏱️ 1 Speed Test (RRB NTPC/Group D)",
        "🇮🇳 Daily Current Affairs notes"
      ],
      gkTricks: [
        { title: "Khambhat Rivers (MAST)", trick: "Mahi, Sabarmati, Tapi, Narmada" },
        { title: "Indian Core Rivers (G-Y-N)", trick: "Ganga, Yamuna, Narmada, Godavari, Krishna" }
      ]
    },
    banking: {
      monthsToGo: 2,
      focus: "Data Interpretation (DI) & Puzzle Solving. Target: Speed and Accuracy improvement.",
      checklist: [
        "📊 Solve 5 DI Sets (High Level)",
        "🧩 Solve 5 Seating Arrangement Puzzles",
        "⏱️ 1 Quantitative Aptitude Sectional Mock",
        "📰 Read Banking Awareness updates"
      ],
      gkTricks: [
        { title: "BODMAS Sequence", trick: "Brackets, Of, Division, Multiplication, Addition, Subtraction" },
        { title: "Cheque Crossing Types", trick: "General crossing, Special crossing, Account Payee only" }
      ]
    },
    defence: {
      monthsToGo: 3,
      focus: "General Knowledge, Basic Science, and Physical Fitness. Target: Endurance and standard specs check.",
      checklist: [
        "🏃‍♂️ 5km Run (Target: Under 24 minutes)",
        "💪 10 Chin-ups & 40 Push-ups",
        "📚 GK revision on History & Geography",
        "🩺 Hydrate and track physical parameters"
      ],
      gkTricks: [
        { title: "IAF Commands (WCE-S)", trick: "Western (Delhi), Central (Prayagraj), Eastern (Shillong), Southern" },
        { title: "Core Armed Forces", trick: "Indian Army, Indian Navy, Indian Air Force, Indian Coast Guard" }
      ]
    },
    general: {
      monthsToGo: 6,
      focus: "Foundation Concepts & Speed Practice. Target: Learn core topics for all general exams.",
      checklist: [
        "✅ Complete 1 Core Topic in Maths",
        "🧠 Daily General Awareness quiz",
        "📖 Read Current Affairs (15 mins)",
        "⏰ Weekly mock test prep plan"
      ],
      gkTricks: [
        { title: "Fat Soluble Vitamins (KEDA)", trick: "Vitamins K, E, D, A are fat soluble (B & C are water soluble)" },
        { title: "Fundamental Rights (EER-C)", trick: "Equality, Exploitation, Religion, Culture/Edu, Remedies" }
      ]
    }
  } as Record<string, ExamTarget>,

  // Redirect link for dynamic QR code mock test
  mockTestUrl: "https://www.rojgarsuvidha.com/latest-jobs?source=calendar_qr"
};
