import Link from "next/link";
import { redirect } from "next/navigation";
import { Droplets } from "lucide-react";
import { getPortalLeadId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const leadId = await getPortalLeadId();
  if (!leadId) redirect("/portal/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Droplets size={16} />
            </span>
            <span className="text-sm font-bold text-slate-800">My WaterPure</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
            <Link href="/portal" className="hover:text-brand-600">Overview</Link>
            <Link href="/portal/bookings" className="hover:text-brand-600">My Bookings</Link>
            <Link href="/portal/invoices" className="hover:text-brand-600">Invoices</Link>
            <form action="/api/portal/logout" method="post">
              <button type="submit" className="text-xs text-slate-400 hover:text-rose-600">
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}