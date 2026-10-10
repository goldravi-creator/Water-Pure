import Link from "next/link";
import { LogOut, ExternalLink } from "lucide-react";
import { Avatar } from "@/components/ui";
import type { CurrentUser } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/enums";
import { providerStatus } from "@/lib/ai/providers";
import { Badge } from "@/components/ui";

export function CrmTopbar({ user }: { user: CurrentUser }) {
  const ai = providerStatus();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <Link
          href="/crm"
          className="text-sm font-semibold text-slate-700 lg:hidden"
        >
          WaterPure CRM
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Badge
          className={
            ai.mode === "live"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-800"
          }
        >
          AI: {ai.mode === "live" ? "LIVE (Twilio + GPT-4o)" : "Mock mode"}
        </Badge>
        <Link
          href="/"
          className="hidden items-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-600 sm:flex"
        >
          <ExternalLink size={14} /> Public site
        </Link>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <Avatar name={user.name} />
          <div className="hidden leading-tight sm:block">
            <div className="text-xs font-semibold text-slate-800">{user.name}</div>
            <div className="text-[11px] text-slate-500">
              {ROLE_LABELS[user.role as Role] ?? user.role}
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
