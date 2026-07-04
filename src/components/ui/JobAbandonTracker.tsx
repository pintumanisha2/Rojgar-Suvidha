"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { scheduleFormAbandonNotification } from "@/lib/notificationTriggers";

interface JobAbandonTrackerProps {
  jobTitle: string;
  jobSlug: string;
  /** How long user should be on the page before we fire the reminder (ms). Default 3 min. */
  delayMs?: number;
}

/**
 * Drop this into any job detail page or apply-for-me page.
 * If the logged-in user stays 3+ minutes without applying, they get a personalized reminder.
 */
export default function JobAbandonTracker({ jobTitle, jobSlug, delayMs = 3 * 60 * 1000 }: JobAbandonTrackerProps) {
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let active = true;

    const setupTracker = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !active) return;

      const userId = session.user.id;
      const formUrl = `/apply-for-me?job=${encodeURIComponent(jobTitle)}&url=${encodeURIComponent(`/job/${jobSlug}`)}`;

      // Schedule the abandon reminder
      const cancel = scheduleFormAbandonNotification(userId, jobTitle, formUrl, delayMs);
      cancelRef.current = cancel;
    };

    setupTracker();

    // Cleanup: user navigated away OR submitted → cancel timer
    return () => {
      active = false;
      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }
    };
  }, [jobTitle, jobSlug, delayMs]);

  return null; // Invisible component — no UI
}
