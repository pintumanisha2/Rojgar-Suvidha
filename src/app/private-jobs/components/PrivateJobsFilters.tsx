"use client";

import { useState, useRef, useEffect } from"react";
import { Search, MapPin, Briefcase, ChevronDown, SlidersHorizontal } from"lucide-react";

interface PrivateJobsFiltersProps {
 searchQuery: string;
 setSearchQuery: (val: string) => void;
 selectedLocation: string;
 setSelectedLocation: (val: string) => void;
 selectedCategory: string;
 setSelectedCategory: (val: string) => void;
 // Experience filter — parent se aata hai taaki filtering actually kaam kare
 experience: string;
 setExperience: (val: string) => void;
}

export default function PrivateJobsFilters({
 searchQuery,
 setSearchQuery,
 selectedLocation,
 setSelectedLocation,
 selectedCategory,
 setSelectedCategory,
 experience,
 setExperience,
}: PrivateJobsFiltersProps) {
 const [isExpanded, setIsExpanded] = useState(false);
 const searchRef = useRef<HTMLDivElement>(null);

 const categories = ["All","🏡 WFH","💻 Tech & IT","📊 Data Entry","📞 BPO / Telecalling","🛵 Logistics & Delivery"];

 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
 setIsExpanded(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 return (
 <div className="space-y-6 relative z-30">
 
 {/* Animated Search Bar Component */}
 <div ref={searchRef} className="relative mx-auto w-full transition-all duration-500 ease-in-out">
 {!isExpanded ? (
 // --- COMPACT PILL MODE ---
 <div 
 onClick={() => setIsExpanded(true)}
 className="bg-white border border-slate-200 rounded-full shadow-lg hover:shadow-xl cursor-text flex items-center px-4 py-3 sm:px-6 sm:py-4 mx-auto max-w-2xl transform transition-all duration-300 hover:scale-[1.01] hover:border-blue-400/50"
 >
 <Search className="w-5 h-5 text-blue-500 shrink-0"/>
 <div className="flex flex-col ml-3 flex-1 overflow-hidden">
 <span className="text-slate-800 font-extrabold text-sm truncate text-left">
 {searchQuery ||"Search for verified corporate openings..."}
 </span>
 <span className="text-slate-400 text-xs truncate text-left">
 {selectedLocation !=="All India"? selectedLocation :"Any Location"} • {experience ||"Any Experience"}
 </span>
 </div>
 <div className="ml-3 shrink-0 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-sm">
 <SlidersHorizontal className="w-4 h-4"/>
 </div>
 </div>
 ) : (
 // --- EXPANDED MODE ---
 <div 
 className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-2 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-slate-100 animate-in fade-in zoom-in-95 duration-300 max-w-4xl mx-auto ring-4 ring-blue-50"
 >
 
 {/* Keyword Field */}
 <div className="flex-1 flex items-center px-4 py-3.5 md:py-2 w-full group">
 <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors shrink-0"/>
 <div className="flex flex-col w-full ml-3">
 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">What</span>
 <input 
 type="text"
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 placeholder="Job title, keywords, or company"
 className="w-full bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 text-sm font-extrabold p-0 outline-none mt-0.5"
 autoFocus
 />
 </div>
 </div>

 {/* Experience Field */}
 <div className="flex-1 flex items-center px-4 py-3.5 md:py-2 w-full group relative cursor-pointer">
 <Briefcase className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0"/>
 <div className="flex flex-col w-full ml-3">
 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Experience</span>
 <select 
 value={experience}
 onChange={e => setExperience(e.target.value)}
 className="w-full bg-transparent border-none focus:ring-0 text-slate-900 text-sm font-extrabold p-0 appearance-none outline-none cursor-pointer mt-0.5"
 >
 <option value=""className="bg-white text-slate-900">Any Experience</option>
 <option value="Fresher"className="bg-white text-slate-900">Fresher (0 Years)</option>
 <option value="1-3 Years"className="bg-white text-slate-900">1-3 Years</option>
 <option value="4-7 Years"className="bg-white text-slate-900">4-7 Years</option>
 <option value="8+ Years"className="bg-white text-slate-900">8+ Years</option>
 </select>
 </div>
 <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 pointer-events-none"/>
 </div>

 {/* Location Field */}
 <div className="flex-1 flex items-center px-4 py-3.5 md:py-2 w-full group">
 <MapPin className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors shrink-0"/>
 <div className="flex flex-col w-full ml-3">
 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Where</span>
 <input 
 type="text"
 value={selectedLocation !=="All India"? selectedLocation :""}
 onChange={e => setSelectedLocation(e.target.value ||"All India")}
 placeholder="Enter location (e.g. Delhi, Remote)"
 className="w-full bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 text-sm font-extrabold p-0 outline-none mt-0.5"
 />
 </div>
 </div>

 {/* Search CTA */}
 <div className="px-2 py-2 w-full md:w-auto shrink-0">
 <button 
 onClick={() => setIsExpanded(false)}
 className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-8 py-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 duration-300"
 >
 Search Jobs
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Quick Category Pills */}
 <div className="max-w-4xl mx-auto space-y-3 pt-4 border-t border-slate-200/50">
 <span className="block text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
 Quick Browse Categories
 </span>
 <div className="flex flex-wrap justify-center gap-2">
 {categories.map(cat => (
 <button
 key={cat}
 onClick={() => setSelectedCategory(cat)}
 className={`px-4 py-2 rounded-xl text-xs font-black border transition-all duration-300 active:scale-95 ${
 selectedCategory === cat 
 ?"bg-blue-600 border-transparent text-white shadow-md shadow-blue-600/10"
 :"bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:bg-slate-50 shadow-sm"
 }`}
 >
 {cat}
 </button>
 ))}
 </div>
 </div>
 
 </div>
 );
}
