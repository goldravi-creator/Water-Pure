import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CrmSidebar } from "@/components/crm/sidebar";
import { CrmTopbar } from "@/components/crm/topbar";

export const dynamic = "force-dynamic";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <CrmSidebar companyName="WaterPure" />
      <div className="flex min-w-0 flex-1 flex-col">
        <CrmTopbar user={user} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}