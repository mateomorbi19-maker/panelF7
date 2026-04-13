import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="min-h-screen flex">
      <Sidebar userEmail={user?.email ?? null} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
