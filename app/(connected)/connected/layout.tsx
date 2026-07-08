import SiteNav from "@/components/SiteNav";

// Shared chrome for every /connected page. SiteNav lives here (not in the pages)
// so the navbar is pinned to the top of the viewport on every connected route and
// across every loading/empty state, at any screen size.
export default function ConnectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-paper font-body text-ink min-h-screen">
      <SiteNav />
      {children}
    </div>
  );
}
