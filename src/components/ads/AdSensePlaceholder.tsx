"use client";

interface AdSensePlaceholderProps {
  format?: "leaderboard" | "rectangle" | "responsive";
  className?: string;
}

// 🔴 AdSense pending approval — placeholder hidden until approved
// When AdSense is approved, replace the return null with the <ins> adsbygoogle tag:
//
//   <ins className="adsbygoogle"
//        style={{ display: "block" }}
//        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
//        data-ad-slot="XXXXXXXXXX"
//        data-ad-format="auto"
//        data-full-width-responsive="true"></ins>
//   <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>

export default function AdSensePlaceholder({ format = "responsive", className = "" }: AdSensePlaceholderProps) {
  // Hidden until Google AdSense is approved
  return null;
}
