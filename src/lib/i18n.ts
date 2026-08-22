// ══════════════════════════════════════════════════════════════════════
// Rojgar Suvidha — Multilingual (i18n) Master Config & SEO Helpers
// Supported: English (en), Hindi (hi), Maithili (mai), Bhojpuri (bho), Marathi (mr), Bengali (bn), Urdu (ur), Gujarati (gu), Telugu (te), Tamil (ta)
// ══════════════════════════════════════════════════════════════════════

export const SUPPORTED_LANGUAGES = ["hi", "mai", "bho", "mr", "bn", "ur", "gu", "te", "ta"] as const;
export type SupportedLang = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_CONFIG: Record<string, {
  code: string;
  label: string;
  nativeLabel: string;
  dir: "ltr" | "rtl";
  contentColumn: string;
  googleCode: string;  // for hreflang
  flag: string;
}> = {
  en: {
    code: "en",
    label: "English",
    nativeLabel: "English",
    dir: "ltr",
    contentColumn: "blog_content",
    googleCode: "en",
    flag: "🇮🇳",
  },
  hi: {
    code: "hi",
    label: "Hindi",
    nativeLabel: "हिंदी",
    dir: "ltr",
    contentColumn: "blog_content_hi",
    googleCode: "hi",
    flag: "🇮🇳",
  },
  mai: {
    code: "mai",
    label: "Maithili",
    nativeLabel: "मैथिली",
    dir: "ltr",
    contentColumn: "blog_content_mai",
    googleCode: "mai",
    flag: "🇮🇳",
  },
  bho: {
    code: "bho",
    label: "Bhojpuri",
    nativeLabel: "भोजपुरी",
    dir: "ltr",
    contentColumn: "blog_content_bho",
    googleCode: "bho",
    flag: "🇮🇳",
  },
  mr: {
    code: "mr",
    label: "Marathi",
    nativeLabel: "मराठी",
    dir: "ltr",
    contentColumn: "blog_content_mr",
    googleCode: "mr",
    flag: "🇮🇳",
  },
  bn: {
    code: "bn",
    label: "Bengali",
    nativeLabel: "বাংলা",
    dir: "ltr",
    contentColumn: "blog_content_bn",
    googleCode: "bn",
    flag: "🇮🇳",
  },
  ur: {
    code: "ur",
    label: "Urdu",
    nativeLabel: "اردو",
    dir: "rtl",
    contentColumn: "blog_content_ur",
    googleCode: "ur",
    flag: "🇮🇳",
  },
  gu: {
    code: "gu",
    label: "Gujarati",
    nativeLabel: "ગુજરાતી",
    dir: "ltr",
    contentColumn: "blog_content_gu",
    googleCode: "gu",
    flag: "🇮🇳",
  },
  te: {
    code: "te",
    label: "Telugu",
    nativeLabel: "తెలుగు",
    dir: "ltr",
    contentColumn: "blog_content_te",
    googleCode: "te",
    flag: "🇮🇳",
  },
  ta: {
    code: "ta",
    label: "Tamil",
    nativeLabel: "தமிழ்",
    dir: "ltr",
    contentColumn: "blog_content_ta",
    googleCode: "ta",
    flag: "🇮🇳",
  },
};

export function isValidLang(lang: string): lang is SupportedLang {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLang);
}

export function getLangConfig(lang: string) {
  return LANGUAGE_CONFIG[lang] || LANGUAGE_CONFIG["en"];
}

export function getLangJobUrl(slug: string, lang: string) {
  if (lang === "en") return `/job/${slug}`;
  return `/${lang}/job/${slug}`;
}

export const BASE_URL = "https://www.rojgarsuvidha.com";

/** Build hreflang alternates for a given job slug across all supported languages */
export function buildHreflangAlternates(slug: string) {
  return {
    canonical: `${BASE_URL}/job/${slug}`,
    languages: {
      "en": `${BASE_URL}/job/${slug}`,
      "hi": `${BASE_URL}/hi/job/${slug}`,
      "mai": `${BASE_URL}/mai/job/${slug}`,
      "bho": `${BASE_URL}/bho/job/${slug}`,
      "mr": `${BASE_URL}/mr/job/${slug}`,
      "bn": `${BASE_URL}/bn/job/${slug}`,
      "ur": `${BASE_URL}/ur/job/${slug}`,
      "gu": `${BASE_URL}/gu/job/${slug}`,
      "te": `${BASE_URL}/te/job/${slug}`,
      "ta": `${BASE_URL}/ta/job/${slug}`,
      "x-default": `${BASE_URL}/job/${slug}`,
    },
  };
}

/** UI strings for each language */
export const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    applyNow: "Apply Now",
    downloadAdmitCard: "Download Admit Card",
    checkResult: "Check Result",
    applyForMe: "Apply For Me (Expert Help)",
    lastDate: "Last Date",
    totalPosts: "Total Posts",
    viewAllJobs: "View All Jobs",
    similarJobs: "Similar Notifications",
    readInLanguage: "Read in your language",
    translatedBy: "Translation by Rojgar Suvidha AI",
  },
  hi: {
    applyNow: "अभी आवेदन करें",
    downloadAdmitCard: "एडमिट कार्ड डाउनलोड करें",
    checkResult: "रिजल्ट देखें",
    applyForMe: "मेरे लिए आवेदन करें (विशेषज्ञ सहायता)",
    lastDate: "अंतिम तिथि",
    totalPosts: "कुल पद",
    viewAllJobs: "सभी नौकरियाँ देखें",
    similarJobs: "समान अधिसूचनाएँ",
    readInLanguage: "अपनी भाषा में पढ़ें",
    translatedBy: "हिंदी अनुवाद: रोजगार सुविधा AI",
  },
  mai: {
    applyNow: "अहिनहि आवेदन करू",
    downloadAdmitCard: "एडमिट कार्ड डाउनलोड करू",
    checkResult: "रिजल्ट देखू",
    applyForMe: "हमरा लेल आवेदन करू (विशेषज्ञ सहायता)",
    lastDate: "अंतिम तिथि",
    totalPosts: "कुल पद",
    viewAllJobs: "सब नौकरी देखू",
    similarJobs: "समान सूचना",
    readInLanguage: "अपन भाषा में पढ़ू",
    translatedBy: "मैथिली अनुवाद: रोजगार सुविधा AI",
  },
  bho: {
    applyNow: "अभी आवेदन करीं",
    downloadAdmitCard: "एडमिट कार्ड डाउनलोड करीं",
    checkResult: "रिजल्ट देखीं",
    applyForMe: "कातिन आवेदन करीं (विशेषज्ञ सहायता)",
    lastDate: "अंतिम तिथि",
    totalPosts: "कुल पद",
    viewAllJobs: "सब नौकरी देखीं",
    similarJobs: "समान जानकारी",
    readInLanguage: "अपना भाषा में पढ़ीं",
    translatedBy: "भोजपुरी अनुवाद: रोजगार सुविधा AI",
  },
  mr: {
    applyNow: "आता अर्ज करा",
    downloadAdmitCard: "प्रवेशपत्र डाउनलोड करा",
    checkResult: "निकाल पहा",
    applyForMe: "माझ्यासाठी अर्ज करा (तज्ज्ञ मदत)",
    lastDate: "अंतिम तारीख",
    totalPosts: "एकूण जागा",
    viewAllJobs: "सर्व नोकऱ्या पहा",
    similarJobs: "संबंधित नोकरी जाहिराती",
    readInLanguage: "तुमच्या भाषेत वाचा",
    translatedBy: "मराठी भाषांतर: रोजगार सुविधा AI",
  },
  bn: {
    applyNow: "এখনই আবেদন করুন",
    downloadAdmitCard: "অ্যাডমিট কার্ড ডাউনলোড করুন",
    checkResult: "ফলাফল দেখুন",
    applyForMe: "আমার জন্য আবেদন করুন (বিশেষজ্ঞ সাহায্য)",
    lastDate: "শেষ তারিখ",
    totalPosts: "মোট পদ",
    viewAllJobs: "সমস্ত চাকরি দেখুন",
    similarJobs: "একই ধরনের বিজ্ঞপ্তি",
    readInLanguage: "আপনার ভাষায় পড়ুন",
    translatedBy: "বাংলা অনুবাদ: রোজগার সুবিধা AI",
  },
  ur: {
    applyNow: "ابھی درخواست دیں",
    downloadAdmitCard: "ایڈمٹ کارڈ ڈاؤن لوڈ کریں",
    checkResult: "نتیجہ چیک کریں",
    applyForMe: "میرے لیے درخواست دیں (ماہر مدد)",
    lastDate: "آخری تاریخ",
    totalPosts: "کل آسامیاں",
    viewAllJobs: "تمام ملازمتیں دیکھیں",
    similarJobs: "ملتے جلتے نوٹیفیکیشن",
    readInLanguage: "اپنی زبان میں پڑھیں",
    translatedBy: "اردو ترجمہ: روزگار سہولت AI",
  },
  gu: {
    applyNow: "હમણાં અરજી કરો",
    downloadAdmitCard: "એડમિટ કાર્ડ ડાઉનલોડ કરો",
    checkResult: "પરિણામ તપાસો",
    applyForMe: "મારા વતી અરજી કરો (નિષ્ણાત મદદ)",
    lastDate: "અંતિમ તારીખ",
    totalPosts: "કુલ જગ્યાઓ",
    viewAllJobs: "તમામ નોકરીઓ જુઓ",
    similarJobs: "સમાન જાહેરાતો",
    readInLanguage: "તમારી ભાષામાં વાંચો",
    translatedBy: "ગુજરાતી અનુવાદ: રોજગાર સુવિધા AI",
  },
  te: {
    applyNow: "ఇప్పుడే దరఖాస్తు చేయండి",
    downloadAdmitCard: "హాల్ టికెట్ డౌన్‌లోడ్ చేసుకోండి",
    checkResult: "ఫలితాలు చూడండి",
    applyForMe: "నా తరఫున అప్లై చేయండి (నిపుణుల సహాయం)",
    lastDate: "చివరి తేదీ",
    totalPosts: "మొత్తం పోస్టులు",
    viewAllJobs: "అన్ని ఉద్యోగాలు చూడండి",
    similarJobs: "సంబంధిత నోటిఫికేషన్లు",
    readInLanguage: "మీ భాషలో చదవండి",
    translatedBy: "తెలుగు అనువాదం: రోజ్‌గార్ సువిధ AI",
  },
  ta: {
    applyNow: "இப்போதே விண்ணப்பிக்கவும்",
    downloadAdmitCard: "ஹால் டிக்கெட் பதிவிறக்கவும்",
    checkResult: "முடிவை பார்க்கவும்",
    applyForMe: "எனக்காக விண்ணப்பிக்கவும் (நிபுணர் உதவி)",
    lastDate: "கடைசி தேதி",
    totalPosts: "மொத்த பணியிடங்கள்",
    viewAllJobs: "அனைத்து வேலைகளையும் காண்க",
    similarJobs: "தொடர்புடைய அறிவிப்புகள்",
    readInLanguage: "உங்கள் மொழியில் படிக்கவும்",
    translatedBy: "தமிழ் மொழியாக்கம்: ரோஜ்கார் சுவிதா AI",
  },
};
