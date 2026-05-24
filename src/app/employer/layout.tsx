"use client";

import EmployerSidebar from "@/components/employer/EmployerSidebar";
import { usePathname } from "next/navigation";

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/employer/login" || pathname === "/employer/register";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {!isAuthPage && <EmployerSidebar />}
      <div className={`${isAuthPage ? "" : "md:pl-64"} flex flex-col min-h-screen`}>
        <main className={`flex-grow ${isAuthPage ? "" : "p-4 pt-24 pb-24 md:p-8 md:pt-8 md:pb-8"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

