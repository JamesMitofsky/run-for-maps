import SiteNav from "@/components/SiteNav";

// Shared chrome for every /profile page. SiteNav lives here (not in the pages)
// so the navbar is pinned to the top of the viewport on every profile route and
// across every loading/empty state, at any screen size.
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-paper font-body text-ink min-h-screen">
      <SiteNav />
      {children}
    </div>
  );
}
