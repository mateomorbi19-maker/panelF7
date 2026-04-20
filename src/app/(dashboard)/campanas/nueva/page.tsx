import { CampanaWizard } from "@/components/CampanaWizard";

export const dynamic = "force-dynamic";

export default function NuevaCampanaPage() {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 lg:p-8">
      <CampanaWizard />
    </div>
  );
}
