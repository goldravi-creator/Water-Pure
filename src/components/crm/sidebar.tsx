"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Columns3,
  PhoneCall,
  LifeBuoy,
  Megaphone,
  Upload,
  BarChart3,
  UserCog,
  Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  {
    group: "Overview",
    items: [
      { href: "/crm", label: "Dashboard", icon: LayoutDashboard },
      { href: "/crm/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    group: "Sales",
    items: [
      { href: "/crm/leads", label: "Leads", icon: Users },
      { href: "/crm/pipeline", label: "Pipeline", icon: Columns3 },
      { href: "/crm/leads/import", label: "Import Leads", icon: Upload },
    ],
  },
  {
    group: "Automation",
    items: [
      { href: "/crm/calls", label: "AI Calls", icon: PhoneCall },
      { href: "/crm/tickets", label: "Hand-off Tickets", icon: LifeBuoy },
      { href: "/crm/campaigns", label: "Campaigns", icon: Megaphone },
    ],
  },
  {
    group: "Admin",
    items: [{ href: "/crm/agents", label: "Team", icon: UserCog }],
  },
];

export function CrmSidebar({ companyName }: { companyName: string }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/crm" ? pathname === "/crm" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-none flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Droplets size={18} />
        </span>
        <div className="leading-tight">
          <div className="text-sm font-bold text-slate-800">{companyName}</div>
          <div className="text-[11px] text-slate-500">AI CRM Console</div>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {NAV.map((section) => (
          <div key={section.group}>
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {section.group}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-100 px-4 py-3 text-[11px] text-slate-400">
        v1.0 · AI telecalling enabled
      </div>
    </aside>
  );
}
