import { createAdminClient } from "@/lib/supabase/server";
import { ContactosTable } from "@/components/ContactosTable";
import type { ContactoRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ContactosPage() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contactos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="flex-1 p-6">
        <p className="text-f7red">Error cargando contactos: {error.message}</p>
      </div>
    );
  }

  const contactos = (data ?? []) as ContactoRow[];

  return (
    <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="mb-5 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Contactos</h1>
        <p className="text-sm text-slate-400 mt-1">
          {contactos.length === 0
            ? "Todavía no hay contactos en tu base."
            : `${contactos.length} ${contactos.length === 1 ? "contacto" : "contactos"} en tu base`}
        </p>
      </div>

      <ContactosTable contactos={contactos} />
    </div>
  );
}
