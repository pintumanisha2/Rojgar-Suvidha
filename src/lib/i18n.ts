// ══════════════════════════════════════════════════════════════════════
// Rojgar Suvidha — Multilingual (i18n) Config & Helpers
// Supported: English (en), Hindi (hi), Bengali (bn), Urdu (ur)
// ══════════════════════════════════════════════════════════════════════

export const SUPPORTED_LANGUAGES = ["hi", "bn", "ur"] as const;
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
    flag: "🇵🇰",
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

/** Build hreflang alternates for a given job slug */
export function buildHreflangAlternates(slug: string) {
  return {
    canonical: `${BASE_URL}/job/${slug}`,
    languages: {
      "en": `${BASE_URL}/job/${slug}`,
      "hi": `${BASE_URL}/hi/job/${slug}`,
      "bn": `${BASE_URL}/bn/job/${slug}`,
      "ur": `${BASE_URL}/ur/job/${slug}`,
      "x-default": `${BASE_URL}/job/${slug}`,
    },
  };
}

/** UI strings for each language (for page UI elements like buttons, labels) */
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
    translatedBy: "Hindi translation by Rojgar Suvidha AI",
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
    translatedBy: "हिंदी अनुवाद: रोजगार सुविधा",
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
    translatedBy: "বাংলা অনুবাদ: রোজগার সুবিধা",
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
    translatedBy: "اردو ترجمہ: روزگار سہولت",
  },
};
