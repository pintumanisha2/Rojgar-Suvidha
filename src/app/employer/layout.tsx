import PrivateJobsNavbar from "@/components/layout/PrivateJobsNavbar";
import PrivateJobsFooter from "@/components/layout/PrivateJobsFooter";

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <PrivateJobsNavbar />
      <main className="flex-grow">
        {children}
      </main>
      <PrivateJobsFooter />
    </div>
  );
}
