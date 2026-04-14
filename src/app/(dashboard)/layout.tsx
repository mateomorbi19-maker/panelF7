import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="h-screen flex bg-f7black text-slate-100">
      <Sidebar userEmail={user?.email ?? null} />
      <main className="flex-1 min-w-0 flex overflow-hidden pt-14 pb-16 md:pt-0 md:pb-0">
        {children}
      </main>
    </div>
  );
}
