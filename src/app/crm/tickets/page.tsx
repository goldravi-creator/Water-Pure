import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { Card, CardHeader, EmptyState } from "@/components/ui";
import { PriorityBadge } from "@/components/crm/status-badges";
import { ResolveButton } from "./resolve-button";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lead: { select: { id: true, name: true, phone: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  const open = tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">Human hand-off tickets</h1>
      <p className="mb-5 mt-0.5 text-sm text-slate-500">
        {open} pending · created automatically when a customer asks to “talk to a human”
      </p>

      <Card>
        <CardHeader title="Tickets" subtitle="AI escalation → human call-back queue" />
        {tickets.length === 0 ? (
          <EmptyState
            title="No hand-off tickets"
            description="When a customer asks for a human, a ticket appears here instantly."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Subject / Reason</th>
                  <th>Customer</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className="font-medium text-slate-700">{t.subject}</span>
                      {t.reason ? <div className="max-w-[260px] text-xs text-slate-400">{t.reason}</div> : null}
                    </td>
                    <td className="text-xs">
                      {t.lead ? (
                        <Link href={`/crm/leads/${t.lead.id}`} className="font-medium text-brand-600 hover:underline">
                          {t.lead.name}
                        </Link>
                      ) : (
                        t.customerPhone
                      )}
                      <div className="text-slate-400">{t.customerPhone}</div>
                    </td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td className="text-xs">{t.status}</td>
                    <td className="text-xs">{t.assignedTo?.name ?? "Unassigned"}</td>
                    <td className="text-xs">{format(t.createdAt, "dd MMM, h:mm a")}</td>
                    <td>
                      {t.status === "OPEN" || t.status === "IN_PROGRESS" ? (
                        <ResolveButton ticketId={t.id} />
                      ) : (
                        <span className="text-xs text-slate-400">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}