"use client";

import { useEffect, useRef, useState, use } from "react";

export default function CallPage({ params }: { params: Promise<{ roomId: string }> }) {
  const unwrappedParams = use(params);
  const containerRef = useRef<HTMLDivElement>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    
    let zp: any = null;

    const myMeeting = async (element: HTMLDivElement) => {
      // NOTE: Replace these with your ZegoCloud AppID and ServerSecret
      const appID = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || "0"); 
      const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || "";
      
      // If keys are missing, don't attempt to connect to prevent errors
      if (!appID || !serverSecret) return;

      // Dynamically import to avoid SSR 'document is not defined' error
      const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, 
        serverSecret, 
        unwrappedParams.roomId, 
        Date.now().toString(), 
        "User_" + Date.now().toString().slice(-4)
      );

      zp = ZegoUIKitPrebuilt.create(kitToken);
      zp.joinRoom({
        container: element,
        sharedLinks: [
          {
            name: 'Copy Joining Link',
            url: window.location.protocol + '//' + window.location.host + window.location.pathname,
          },
        ],
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        showPreJoinView: false,
        onJoinRoom: () => {
          setJoined(true);
        },
        onLeaveRoom: () => {
          window.close(); // Close tab when left, or redirect
        }
      });
    };

    myMeeting(containerRef.current);

    return () => {
      if (zp) {
        zp.destroy();
      }
    };
  }, [unwrappedParams.roomId]);

  return (
    <div className="w-full h-screen bg-gray-900 flex items-center justify-center relative">
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
      
      {/* If AppID is 0, show error */}
      {(!process.env.NEXT_PUBLIC_ZEGO_APP_ID || process.env.NEXT_PUBLIC_ZEGO_APP_ID === "0") && (
        <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700 shadow-2xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Setup Required</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Please add your <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">NEXT_PUBLIC_ZEGO_APP_ID</code> and <code className="bg-gray-100 dark:bg-gray-900 px-1 py-0.5 rounded">NEXT_PUBLIC_ZEGO_SERVER_SECRET</code> to your .env.local file to enable live calling.
            </p>
            <button 
              onClick={() => window.close()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
            >
              Close Tab
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
