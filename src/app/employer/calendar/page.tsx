"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, Video, Users, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ScheduleInterviewModal from "@/components/employer/ScheduleInterviewModal";
import Link from "next/link";

const localizer = momentLocalizer(moment);

export default function CalendarPage() {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employer/interviews");
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        setInterviews([]);
      } else {
        setError(null);
        setInterviews(data.interviews || []);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  // Format data for React Big Calendar
  const events = interviews.map(inv => ({
    id: inv.id,
    title: `${inv.candidate_name} - ${inv.job_role}`,
    start: new Date(inv.scheduled_at),
    end: new Date(new Date(inv.scheduled_at).getTime() + (inv.duration_minutes * 60000)),
    resource: inv
  }));

  // Filter agenda to today's events or selected date
  const selectedDateEvents = events.filter(e => 
    e.start.getDate() === currentDate.getDate() &&
    e.start.getMonth() === currentDate.getMonth() &&
    e.start.getFullYear() === currentDate.getFullYear()
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="relative border-0 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 z-0"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -z-0"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white flex items-center gap-2 drop-shadow-md">
            <CalendarIcon className="w-6 h-6 text-indigo-100" /> Interview Calendar
          </h1>
          <p className="text-sm text-indigo-100 mt-1 drop-shadow-sm">Manage your upcoming candidate interviews and schedules.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="relative z-10 px-5 py-2.5 bg-white text-indigo-900 hover:bg-gray-50 text-sm font-black rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Schedule Interview
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] overflow-hidden flex flex-col xl:flex-row min-h-[600px] lg:h-[700px]">
        {/* Left Side: Calendar Grid */}
        <div className="flex-1 border-r border-white/20 dark:border-gray-800/50 p-6 flex flex-col h-[500px] xl:h-auto">
          {/* Custom styling for react-big-calendar to match app theme */}
          <style dangerouslySetInnerHTML={{__html: `
            .rbc-calendar { font-family: inherit; }
            .rbc-btn-group button { color: inherit; }
            .rbc-today { background-color: rgba(99, 102, 241, 0.05); }
            .rbc-event { background-color: #4f46e5; border-radius: 6px; font-weight: 600; font-size: 11px; }
            .rbc-off-range-bg { background-color: transparent; opacity: 0.3; }
            .dark .rbc-month-view, .dark .rbc-month-row, .dark .rbc-header { border-color: #1f2937; }
            .dark .rbc-day-bg + .rbc-day-bg { border-left-color: #1f2937; }
          `}} />
          
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            onNavigate={(date) => setCurrentDate(date)}
            style={{ height: '100%' }}
            views={['month', 'week', 'day']}
          />
        </div>

        {/* Right Side: Agenda */}
        <div className="w-full xl:w-[400px] bg-gray-50/50 dark:bg-gray-950 p-6 flex flex-col overflow-y-auto">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest mb-6">
            Agenda: {moment(currentDate).format("MMMM Do YYYY")}
          </h3>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm font-bold text-gray-500 animate-pulse">
              Loading schedules...
            </div>
          ) : selectedDateEvents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 opacity-50">
              <CalendarIcon className="w-12 h-12 text-gray-400" />
              <p className="text-sm font-bold text-gray-500">No interviews scheduled.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {selectedDateEvents.map((event, i) => {
                const inv = event.resource;
                return (
                  <div key={i} className={`p-4 rounded-2xl border bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm transition-transform hover:-translate-y-0.5`}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-extrabold text-sm">{inv.candidate_name}</h4>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {inv.meeting_type}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-gray-500 mb-4">{inv.job_role}</p>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 
                        {moment(inv.scheduled_at).format("h:mm A")} ({inv.duration_minutes}m)
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-1 -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[8px] font-black shadow-sm text-indigo-700 dark:text-indigo-300">
                          HR
                        </div>
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[8px] font-black shadow-sm text-emerald-700 dark:text-emerald-300">
                          {inv.candidate_name.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      
                      {inv.room_id ? (
                        <Link 
                          href={inv.room_id.startsWith('http') ? inv.room_id : `/employer/call/${inv.room_id}`}
                          target="_blank"
                          className="text-[10px] font-extrabold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <Video className="w-3 h-3" /> {inv.meeting_type?.includes('Meet') ? 'Join Google Meet' : 'Join Video Call'}
                        </Link>
                      ) : (
                        <button disabled className="text-[10px] font-extrabold px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-lg shadow-sm cursor-not-allowed">
                          No Link
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ScheduleInterviewModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onScheduled={fetchInterviews}
      />
    </div>
  );
}
