import { supabase } from"@/lib/supabase";
import { notFound } from"next/navigation";
import { MapPin, Briefcase, IndianRupee, Clock, Building, Star, Bookmark, CheckCircle, FileText, Award, Sparkles } from"lucide-react";
import Link from"next/link";
import ScoutedApplyButton from"./ScoutedApplyButton";
import JobViewTracker from"./JobViewTracker";
import CompanyLogo from"@/components/layout/CompanyLogo";

const slugify = (text: string) => text ? text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '';
export const revalidate = 60; // Revalidate every 60 seconds

export async function generateMetadata({ params, searchParams }: any) {
 const id = searchParams.id;
 if (!id) return { title:"Job Not Found"};

 const { data: job } = await supabase.from("private_jobs").select("*").eq("id", id).single();
 if (!job) return { title:"Job Not Found"};

  return {
    title: `${job.title} at ${job.company_name} | Apply Now | Rojgar Suvidha`,
    description: job.description?.slice(0, 160) || `Hiring for ${job.title} at ${job.company_name}. Experience required: ${job.experience_required || 'Not specified'}. Apply now on Rojgar Suvidha.`,
    openGraph: {
      title: `${job.title} at ${job.company_name} | Rojgar Suvidha`,
      description: `Hiring for ${job.title} at ${job.company_name}. Salary: ${job.salary || 'Not disclosed'}. Apply directly.`,
      url: `https://www.rojgarsuvidha.com/private-jobs/${id}`,
      type: "website",
      images: job.company_logo ? [{ url: job.company_logo }] : undefined,
    }
  };
}

export default async function PrivateJobDetailsPage({ params, searchParams }: any) {
 const id = searchParams.id;
 if (!id) notFound();

 // 1. Fetch the main job
 const { data: job } = await supabase.from("private_jobs").select("*").eq("id", id).single();
 if (!job) notFound();

 // 2. Fetch similar jobs (same category or just latest)
 const { data: similarJobs } = await supabase
 .from("private_jobs")
 .select("id, title, company_name, location, source_site")
 .neq("id", id)
 .order("created_at", { ascending: false })
 .limit(4);

  // Generate JSON-LD JobPosting Schema
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description || `Hiring for ${job.title} at ${job.company_name}.`,
    "datePosted": job.created_at,
    "validThrough": new Date(new Date(job.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Roughly 30 days
    "employmentType": job.title.toLowerCase().includes("part") ? "PART_TIME" : "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company_name,
      "sameAs": job.source_site || "https://www.rojgarsuvidha.com",
      "logo": job.company_logo || "https://www.rojgarsuvidha.com/logo-blue.png"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location || "India",
        "addressCountry": "IN"
      }
    },
    "baseSalary": job.salary ? {
      "@type": "MonetaryAmount",
      "currency": "INR",
      "value": {
        "@type": "QuantitativeValue",
        "value": job.salary,
        "unitText": "MONTH"
      }
    } : undefined
  };

  return (
  <main className="min-h-screen bg-slate-50 pt-24 pb-20 relative overflow-x-hidden">
  
  {/* JSON-LD Structured Data */}
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
  />

  {/* Ambient Background Orbs */}
  <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse duration-[10000ms]" />
  <div className="absolute top-[20%] right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] translate-x-1/3 pointer-events-none" />

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
  
  {/* Track behaviour silently */}
  <JobViewTracker job={{ id: job.id, skills_required: job.skills_required }} />

  {/* Breadcrumb - Animated */}
  <div className="text-xs font-bold text-slate-500 mb-6 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
  <Link href="/"className="hover:text-blue-600 transition-colors">Home</Link>
  <span className="text-slate-400">›</span>
  <Link href="/private-jobs"className="hover:text-blue-600 transition-colors">Private Jobs</Link>
  <span className="text-slate-400">›</span>
  <span className="text-slate-900 truncate">{job.title}</span>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  
  {/* LEFT COLUMN: Main Content */}
  <div className="lg:col-span-2 space-y-6">
  
  {/* 1. Hero Job Card (Glassmorphism & Premium) */}
  <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-50 to-indigo-50/30 rounded-bl-[100px] -mr-8 -mt-8 pointer-events-none"/>
  
  <div className="flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-6 relative z-10">
  <div className="flex-1">
  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
  {job.title}
  </h1>
  <p className="text-base sm:text-lg font-bold text-slate-600 mt-2 flex items-center gap-2">
  <Building className="w-5 h-5 text-indigo-500"/> {job.company_name}
  <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded-md font-black shadow-sm">
  <Star className="w-3.5 h-3.5 fill-amber-500"/> 4.2
  </span>
  </p>

  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 text-sm font-bold text-slate-700">
  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
  <Briefcase className="w-4 h-4 text-blue-500"/>
  {job.experience_required ||"Not specified"}
  </div>
  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 text-emerald-700">
  <IndianRupee className="w-4 h-4 text-emerald-500"/>
  {job.salary ||"Not disclosed"}
  </div>
  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
  <MapPin className="w-4 h-4 text-rose-500"/>
  {job.location}
  </div>
  </div>
  </div>

  <CompanyLogo 
  companyName={job.company_name} 
  logoUrl={job.company_logo} 
  className="shrink-0 h-20 w-20 sm:h-24 sm:w-24 rounded-2xl shadow-md border border-white/60"
  />
  </div>

  <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
  <div className="text-xs font-bold text-slate-500 flex flex-wrap items-center gap-4">
  <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
  <Clock className="w-3.5 h-3.5 text-slate-400"/> Posted: {new Date(job.created_at).toLocaleDateString()}
  </span>
  <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md">
  <CheckCircle className="w-3.5 h-3.5"/> Active Openings
  </span>
  </div>
  
  <div className="flex items-center gap-3 w-full sm:w-auto">
  <button className="p-3 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all shadow-sm">
  <Bookmark className="w-5 h-5"/>
  </button>
  <div className="flex-1 sm:flex-none">
  <ScoutedApplyButton job={job} />
  </div>
  </div>
  </div>
  </div>

  {/* 2. Job Highlights */}
  {job.skills_required && job.skills_required.length > 0 && (
  <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
  <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
  <Sparkles className="w-5 h-5 text-amber-500"/> Job Highlights
  </h2>
  <ul className="space-y-3.5 text-sm font-semibold text-slate-700">
  <li className="flex items-start gap-3">
  <div className="min-w-1.5 h-1.5 mt-2 rounded-full bg-blue-500"></div>
  <p>Strong proficiency in {job.skills_required[0] ||"core domain skills"}.</p>
  </li>
  <li className="flex items-start gap-3">
  <div className="min-w-1.5 h-1.5 mt-2 rounded-full bg-blue-500"></div>
  <p>Coordinate with teams and resolve technical queries efficiently.</p>
  </li>
  <li className="flex items-start gap-3">
  <div className="min-w-1.5 h-1.5 mt-2 rounded-full bg-blue-500"></div>
  <p>Maintain clear communication and provide proper resolution.</p>
  </li>
  </ul>
  </div>
  )}

  {/* 3. Job Description */}
  <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
  <h2 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
  <FileText className="w-5 h-5 text-blue-500"/> Job Description
  </h2>
  
  <div className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-loose mb-8">
  {job.description ||"No description provided."}
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-sm border-t border-slate-100 pt-6">
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
  <span className="text-slate-500 font-bold block mb-1">Role</span>
  <span className="font-bold text-slate-900">{job.title}</span>
  </div>
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
  <span className="text-slate-500 font-bold block mb-1">Industry Type</span>
  <span className="font-bold text-slate-900">IT / Corporate</span>
  </div>
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
  <span className="text-slate-500 font-bold block mb-1">Employment Type</span>
  <span className="font-bold text-slate-900">Full Time, Permanent</span>
  </div>
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
  <span className="text-slate-500 font-bold block mb-1">Education</span>
  <span className="font-bold text-slate-900">Any Graduate</span>
  </div>
  </div>

  {/* Key Skills */}
  {job.skills_required && job.skills_required.length > 0 && (
  <div className="mt-8 pt-6 border-t border-slate-100">
  <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
  <Award className="w-4 h-4 text-indigo-500"/> Key Skills
  </h3>
  <div className="flex flex-wrap gap-2.5">
  {job.skills_required.map((skill: string) => (
  <span key={skill} className="bg-white border border-slate-200 shadow-sm text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:border-blue-400 hover:text-blue-600 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default">
  <Star className="w-3 h-3 text-amber-400 fill-amber-100"/> {skill}
  </span>
  ))}
  </div>
  </div>
  )}
  </div>

  </div>

  {/* RIGHT COLUMN: Sidebar */}
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
  
  {/* Similar Jobs */}
  <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 relative overflow-hidden">
  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none"/>
  
  <h3 className="text-base font-black text-slate-900 mb-5 relative z-10">Jobs you might like</h3>
  
  <div className="space-y-4 relative z-10">
  {similarJobs?.map(simJob => (
  <div key={simJob.id} className="group p-3 -mx-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer">
  <Link href={`/private-jobs/${slugify(simJob.title)}?id=${simJob.id}`}>
  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
  {simJob.title}
  </h4>
  </Link>
  <p className="text-xs font-bold text-slate-500 mt-1.5">{simJob.company_name}</p>
  <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-400 bg-white w-max px-2 py-0.5 rounded border border-slate-100">
  <MapPin className="w-3 h-3 text-rose-400"/> {simJob.location?.split(',')[0]}
  </div>
  </div>
  ))}
  </div>
  </div>

  {/* Premium CTA or Ad space */}
  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-7 text-white text-center shadow-xl shadow-blue-900/20 relative overflow-hidden group">
  {/* Background decorative pattern */}
  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent group-hover:scale-150 transition-transform duration-700"></div>
  
  <div className="relative z-10">
  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/20">
  <Sparkles className="w-6 h-6 text-yellow-300"/>
  </div>
  <h3 className="text-xl font-black mb-2 tracking-tight">Get AI Job Alerts</h3>
  <p className="text-sm font-medium text-blue-100 mb-6 leading-relaxed opacity-90">Never miss an opportunity matching your unique skills and profile.</p>
  <button className="w-full bg-white text-indigo-700 font-black py-3 rounded-xl text-sm hover:shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 transition-all active:scale-95">
  Create Free Alert
  </button>
  </div>
  </div>

  </div>

  </div>
  </div>
  </main>
  );
}
