"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, Search, FileText, ExternalLink, ShieldAlert,
  GraduationCap, Mail, Phone, Code
} from "lucide-react";

export default function CandidateDirectoryPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("private_candidate_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setCandidates(data);
      } else {
        // Fallback Mock Data for UI Testing
        setCandidates([
          { id: 'c1', full_name: 'Pintu Kumar', email: 'pintu@example.com', phone: '+91 9998887776', college: 'IIT Delhi', skills: ['React', 'Next.js', 'TypeScript', 'Node.js'], expected_ctc: '12 LPA', resume_url: 'https://cloudinary.com/sample.pdf', created_at: new Date().toISOString() },
          { id: 'c2', full_name: 'Aisha Gupta', email: 'aisha@example.com', phone: '+91 8887776665', college: 'NIT Trichy', skills: ['Python', 'Django', 'SQL'], expected_ctc: '8 LPA', resume_url: null, created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 'c3', full_name: 'Rohan Mehta', email: 'rohan.m@example.com', phone: '+91 7776665554', college: 'BITS Pilani', skills: ['Figma', 'UI/UX', 'Tailwind CSS'], expected_ctc: '10 LPA', resume_url: 'https://cloudinary.com/sample2.pdf', created_at: new Date(Date.now() - 172800000).toISOString() },
        ]);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const filteredCandidates = candidates.filter(cand => 
    cand.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cand.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cand.skills?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-500" /> Candidate Directory
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Browse and oversee all registered job seekers on the platform.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search name, email, or skill (e.g. React)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm text-gray-900 dark:text-white transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500">
            Loading candidates...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 flex flex-col items-center justify-center text-gray-500">
            <ShieldAlert className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-bold text-gray-700 dark:text-gray-300">No candidates found</p>
            <p className="text-sm">Try adjusting your search query.</p>
          </div>
        ) : (
          filteredCandidates.map((cand) => (
            <div key={cand.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xl border-2 border-emerald-200 dark:border-emerald-800/50">
                      {cand.full_name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">{cand.full_name || "Unknown Candidate"}</h3>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md inline-block mt-1">
                        {cand.expected_ctc ? `Expected: ${cand.expected_ctc}` : "Fresher / Not Disclosed"}
                      </p>
                    </div>
                  </div>
                  
                  {cand.resume_url ? (
                    <a 
                      href={cand.resume_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5" /> View CV
                    </a>
                  ) : (
                    <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-lg text-xs font-bold shrink-0">
                      No CV
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-4">
                  <a href={`mailto:${cand.email}`} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 hover:text-emerald-600 transition-colors truncate">
                    <Mail className="w-4 h-4 text-gray-400" /> {cand.email}
                  </a>
                  {cand.phone && (
                    <a href={`tel:${cand.phone}`} className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 hover:text-emerald-600 transition-colors truncate">
                      <Phone className="w-4 h-4 text-gray-400" /> {cand.phone}
                    </a>
                  )}
                  {cand.college && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2 truncate col-span-full">
                      <GraduationCap className="w-4 h-4 text-gray-400 shrink-0" /> {cand.college}
                    </div>
                  )}
                </div>
              </div>

              {cand.skills && cand.skills.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-auto">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Code className="w-3.5 h-3.5" /> Top Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cand.skills.slice(0, 5).map((skill: string, idx: number) => (
                      <span key={idx} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-md text-xs font-semibold border border-gray-200 dark:border-gray-700">
                        {skill}
                      </span>
                    ))}
                    {cand.skills.length > 5 && (
                      <span className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 px-2.5 py-1 rounded-md text-xs font-semibold">
                        +{cand.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
