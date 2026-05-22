"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { usePathname } from 'next/navigation';

// SEO-rich keyword links for internal linking
const quickLinks = [
  { href: "/latest-jobs", label: "Latest Sarkari Naukri 2025" },
  { href: "/results", label: "Sarkari Result 2025" },
  { href: "/admit-card", label: "Admit Card Download" },
  { href: "/answer-key", label: "Answer Key 2025" },
  { href: "/admission", label: "University Admission 2025" },
  { href: "/news", label: "Govt Job News Today" },
  // { href: "/private-jobs", label: "Private Jobs India" },
  { href: "/apply-for-me", label: "Apply For Me Service" },
  { href: "/track-application", label: "Track Application" },
];

const jobsByCategory = [
  { href: "/jobs/ssc", label: "SSC Jobs 2025" },
  { href: "/jobs/railway", label: "Railway Jobs 2025" },
  { href: "/jobs/banking", label: "Bank Jobs 2025" },
  { href: "/jobs/upsc", label: "UPSC Jobs 2025" },
  { href: "/jobs/police", label: "Police Jobs 2025" },
  { href: "/jobs/defence", label: "Defence Jobs 2025" },
  { href: "/jobs/teaching", label: "Teaching Jobs 2025" },
  { href: "/jobs/state-psc", label: "State PSC Jobs" },
];

const jobsByState = [
  { href: "/state/uttar-pradesh", label: "UP Govt Jobs" },
  { href: "/state/bihar", label: "Bihar Govt Jobs" },
  { href: "/state/delhi", label: "Delhi Govt Jobs" },
  { href: "/state/rajasthan", label: "Rajasthan Govt Jobs" },
  { href: "/state/madhya-pradesh", label: "MP Govt Jobs" },
  { href: "/state/maharashtra", label: "Maharashtra Govt Jobs" },
  { href: "/state/haryana", label: "Haryana Govt Jobs" },
  { href: "/state/west-bengal", label: "West Bengal Govt Jobs" },
];

const eSuvidhaLinks = [
  { href: "/e-suvidha", label: "e-Suvidha Portal" },
  { href: "/e-suvidha/apply/pan-new", label: "Apply PAN Card Online" },
  { href: "/e-suvidha/apply/voter-new", label: "Apply Voter ID Online" },
  { href: "/e-suvidha/apply/udyam", label: "Udyam Aadhaar (MSME)" },
  { href: "/e-suvidha/apply/pcc", label: "Police Clearance (PCC)" },
  { href: "/e-suvidha/apply/itr-nil", label: "ITR Filing (Nil Return)" },
  { href: "/e-suvidha/apply/resume-cv", label: "Professional Resume Maker" },
  { href: "/e-suvidha/apply/passport", label: "Passport Appointment" },
];

export default function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-gray-900 text-white pt-8 sm:pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── Main Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-10 mb-10 sm:mb-14">

          {/* Brand & Description */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Image
                  src="/logo-blue.png"
                  alt="Rojgar Suvidha – India's #1 Government Job Portal"
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Rojgar<span className="text-indigo-400">Suvidha</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              India's most trusted platform for <strong className="text-gray-300">Sarkari Naukri</strong>, 
              Government & Private Job updates. Apply for any job with our exclusive{' '}
              <Link href="/apply-for-me" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2">
                "Apply For Me"
              </Link>{' '}
              service.
            </p>
            {/* Trust Signals */}
            <div className="flex flex-col gap-1.5 text-xs text-gray-500">
              <span>✅ Daily Updated Jobs</span>
              <span>✅ 100% Free to Use</span>
              <span>✅ Expert Form Filling Service</span>
            </div>
          </div>

          {/* Quick Links – SEO Anchor Texts */}
          <div>
            <h3 className="text-sm font-bold mb-4 text-gray-200 uppercase tracking-wider">Quick Links</h3>
            
            {/* HIGHLIGHTED HR LOGIN BUTTON */}
            <Link
              href="/employer/login"
              className="group flex items-center justify-between p-1 pl-3 pr-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-md hover:shadow-emerald-500/20 transition-all mb-4 border border-emerald-400/30 hover:scale-105 active:scale-95"
            >
              <span className="font-extrabold text-white text-[11px] tracking-widest uppercase">HR / Recruiter Login</span>
              <span className="w-6 h-6 rounded flex items-center justify-center text-white bg-white/20 group-hover:bg-white group-hover:text-emerald-600 transition-colors">
                →
              </span>
            </Link>

            <ul className="space-y-2.5">
              {quickLinks.map(link => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Jobs by Category – Internal Linking */}
          <div>
            <h3 className="text-sm font-bold mb-4 text-gray-200 uppercase tracking-wider">Jobs by Category</h3>
            <ul className="space-y-2.5">
              {jobsByCategory.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Jobs by State – Internal Linking */}
          <div>
            <h3 className="text-sm font-bold mb-4 text-gray-200 uppercase tracking-wider">Jobs by State</h3>
            <ul className="space-y-2.5">
              {jobsByState.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* e-Suvidha Services */}
          <div>
            <h3 className="text-sm font-bold mb-4 text-blue-400 uppercase tracking-wider">e-Suvidha Services</h3>
            <ul className="space-y-2.5">
              {eSuvidhaLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Contact & Social Row ── */}
        <div className="border-t border-gray-800 pt-8 pb-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-bold mb-4 text-gray-200 uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-indigo-400 shrink-0" />
                <a href="mailto:support@rojgarsuvidha.com" className="text-gray-400 hover:text-white text-sm transition-colors">
                  support@rojgarsuvidha.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="text-gray-400 text-sm">New Delhi, India</span>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-sm font-bold mb-4 text-gray-200 uppercase tracking-wider">Follow Us for Daily Job Alerts</h3>
            <div className="flex gap-3">
              <a href="https://youtube.com/@rojgarsuvidha" target="_blank" rel="noopener noreferrer" aria-label="Rojgar Suvidha YouTube Channel"
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all shadow-md">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" /></svg>
              </a>
              <a href="https://t.me/rojgarsuvidha" target="_blank" rel="noopener noreferrer" aria-label="Rojgar Suvidha Telegram Channel"
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-sky-500 hover:text-white transition-all shadow-md">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M11.944 20a11.944 11.944 0 1 0 0-23.888 11.944 11.944 0 0 0 0 23.888Zm-3.178-9.452 1.488 4.84c.16.516.488.544.756.24.22-.24.588-.58.916-.9 1.108 1.084 3.016 2.3 3.528 2.528.532.236.936.172 1.116-.396.408-1.296 2.152-7.848 2.656-9.98.12-.488-.032-.736-.34-.616-1.552.616-8.5 3.516-10.236 4.192-.516.204-.528.484-.04.636l2.164.672v-.004Zm6.392-4.048-4.524 4.092-.124 1.492 1.144-1.216 3.504-4.368Z"/></svg>
              </a>
              <a href="https://whatsapp.com/channel/rojgarsuvidha" target="_blank" rel="noopener noreferrer" aria-label="Rojgar Suvidha WhatsApp Channel"
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-[#25D366] hover:text-white transition-all shadow-md">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.013 2.008c-5.464 0-9.897 4.435-9.897 9.901 0 1.956.512 3.82 1.48 5.48L2 22l4.75-1.246c1.6.896 3.42 1.368 5.263 1.368 5.464 0 9.897-4.436 9.897-9.902 0-5.466-4.433-9.901-9.897-9.901zm0 18.252c-1.636 0-3.235-.436-4.64-1.265l-.33-.195-3.46.907.925-3.374-.216-.344c-.91-1.453-1.393-3.138-1.393-4.887 0-4.996 4.062-9.06 9.06-9.06s9.06 4.064 9.06 9.06c0 4.997-4.06 9.06-9.06 9.06zm4.97-6.79c-.272-.136-1.614-.796-1.865-.886-.25-.092-.435-.137-.617.136-.183.272-.705.886-.864 1.067-.158.182-.317.204-.59.068-.272-.136-1.152-.424-2.193-1.352-.81-.72-1.356-1.61-1.516-1.88-.16-.273-.017-.42.12-.556.124-.123.273-.317.408-.475.137-.16.183-.273.273-.454.09-.182.045-.34-.023-.477-.068-.136-.617-1.492-.845-2.042-.222-.538-.448-.465-.617-.474-.158-.008-.34-.01-.522-.01-.183 0-.477.068-.727.34-.25.272-.953.93-.953 2.27 0 1.34.93 2.635 1.066 2.816.136.18 1.916 2.923 4.64 4.066.647.272 1.152.434 1.545.556.65.305 1.24.26 1.705.158.523-.114 1.614-.66 1.84-1.296.228-.636.228-1.18.16-1.296-.07-.113-.25-.18-.522-.316z"/></svg>
              </a>
              <a href="https://instagram.com/rojgarsuvidha" target="_blank" rel="noopener noreferrer" aria-label="Rojgar Suvidha Instagram"
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all shadow-md">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 0 1 1.772 1.153 4.902 4.902 0 0 1 1.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 0 1-1.153 1.772 4.902 4.902 0 0 1-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 0 1-1.772-1.153 4.902 4.902 0 0 1-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 0 1 1.153-1.772A4.902 4.902 0 0 1 5.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 1.802a3.333 3.333 0 1 0 0 6.666 3.333 3.333 0 0 0 0-6.666zm5.338-3.205a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" clipRule="evenodd" /></svg>
              </a>
            </div>
          </div>
        </div>

        {/* ── SEO Rich Text Footer ── */}
        <div className="border-t border-gray-800 pt-6 pb-4">
          <p className="text-gray-600 text-xs leading-relaxed text-center max-w-4xl mx-auto">
            Rojgar Suvidha is India's leading platform for <strong className="text-gray-500">Sarkari Naukri</strong>, 
            {' '}<strong className="text-gray-500">Government Jobs 2025-2026</strong>, SSC, Railway, Banking, UPSC, Police & State PSC notifications. 
            We provide daily updates on <strong className="text-gray-500">Admit Cards</strong>, <strong className="text-gray-500">Exam Results</strong>, 
            {' '}<strong className="text-gray-500">Answer Keys</strong> & University Admissions. 
            Our exclusive "Apply For Me" service ensures error-free government job form filling.
          </p>
        </div>

        {/* ── Legal Bar ── */}
        <div className="border-t border-gray-800 pt-5 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-gray-500 text-xs text-center md:text-left">
            © {new Date().getFullYear()} Rojgar Suvidha. All rights reserved. | 
            <span className="ml-1">Not affiliated with any government organization.</span>
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-x-5 gap-y-2">
            <Link href="/about" className="text-gray-500 hover:text-white transition-colors text-xs">About Us</Link>
            <Link href="/contact-us" className="text-gray-500 hover:text-white transition-colors text-xs">Contact Us</Link>
            <Link href="/complaint" className="text-red-400 hover:text-red-300 transition-colors text-xs font-semibold">Help & Support</Link>
            <Link href="/track-application" className="text-gray-500 hover:text-white transition-colors text-xs">Track Application</Link>
            <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors text-xs">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-500 hover:text-white transition-colors text-xs">Terms of Service</Link>
            <Link href="/refund-policy" className="text-gray-500 hover:text-white transition-colors text-xs">Refund Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
