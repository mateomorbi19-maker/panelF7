import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="h-screen flex bg-slate-50">
      <Sidebar userEmail={user?.email ?? null} />
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}
