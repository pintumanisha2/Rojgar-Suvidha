"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // When pathname or searchParams change, the route transition has finished.
    if (visible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setProgress(0), 200); // reset after hidden
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, visible]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Intercept clicks on links to start the loader (use capture phase to beat React)
    const handleClick = (e: MouseEvent | TouchEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (
        target &&
        target.href &&
        target.target !== "_blank" &&
        target.target !== "_blank" &&
        !("ctrlKey" in e && e.ctrlKey) &&
        !("metaKey" in e && e.metaKey) &&
        !("shiftKey" in e && e.shiftKey) &&
        !("altKey" in e && e.altKey)
      ) {
        try {
          const url = new URL(target.href);
          const currentUrl = new URL(window.location.href);

          // Trigger if it's internal and navigates to a different path or query
          if (
            url.origin === currentUrl.origin &&
            (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) &&
            !url.hash // ignore pure hash links
          ) {
            // Delay showing the loader by 100ms. If navigation completes (skeleton loads), it won't show.
            const delayTimer = setTimeout(() => {
              setVisible(true);
              setProgress(15);

              // Trickle effect (like YouTube)
              interval = setInterval(() => {
                setProgress((prev) => {
                  if (prev >= 90) {
                    clearInterval(interval);
                    return prev;
                  }
                  const step = (100 - prev) * 0.05 + Math.random() * 3;
                  return prev + step;
                });
              }, 300);
            }, 100);

            // Fallback timeout in case navigation stalls
            setTimeout(() => {
              clearInterval(interval);
              clearTimeout(delayTimer);
              setProgress(100);
              setTimeout(() => setVisible(false), 300);
            }, 6000);
            
            // Cleanup function for the delayTimer on unmount/success is handled by the overall effect
          }
        } catch (err) {
          // invalid URL, ignore
        }
      }
    };

    // Use capture phase (true) so we intercept before React handles the click
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 h-[4px] md:h-[3px] z-[999999] transition-all ease-out pointer-events-none ${
        visible ? "opacity-100 duration-300" : "opacity-0 duration-200"
      }`}
      style={{
        width: `${progress}%`,
        backgroundColor: "#4f46e5", // Indigo-600
        boxShadow: "0 0 10px #4f46e5, 0 0 5px #4f46e5",
      }}
    >
      {/* Glow peg at the end */}
      <div className="absolute right-0 top-0 h-full w-[100px] shadow-[0_0_10px_#4f46e5,0_0_5px_#4f46e5] opacity-100 rotate-3 -translate-y-0.5 rounded-full" />
    </div>
  );
}
