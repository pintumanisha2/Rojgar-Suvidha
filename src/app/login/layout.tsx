import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login – Rojgar Suvidha | Sign In to Your Account",
  description: "Login to Rojgar Suvidha to access your saved jobs, application tracker, Apply For Me service, and personalized government job alerts. Sign in with Google or email.",
  alternates: { canonical: "https://www.rojgarsuvidha.com/login" },
  openGraph: {
    title: "Login – Rojgar Suvidha",
    description: "Sign in to Rojgar Suvidha to access saved jobs, application tracking, and Apply For Me service.",
    url: "https://www.rojgarsuvidha.com/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
