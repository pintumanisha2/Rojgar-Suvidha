import PrivateJobsNavbar from"@/components/layout/PrivateJobsNavbar";
import PrivateJobsFooter from"@/components/layout/PrivateJobsFooter";
import PrivateCommunityDrawer from"@/components/layout/PrivateCommunityDrawer";
import PrivateBottomNav from "@/components/layout/PrivateBottomNav";

export default function PrivateJobsLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
 <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300">
 <PrivateJobsNavbar />
 <main className="flex-grow">
 {children}
 </main>
 <PrivateCommunityDrawer />
 <PrivateBottomNav />
 <PrivateJobsFooter />
 </div>
 );
}
