import { redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { getPortalLeadId } from "@/lib/auth";
import { Card, CardHeader, Badge, EmptyState, LinkButton } from "@/components/ui";
import { Wrench, MapPin, CalendarClock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortalBookings() {
  const leadId = await getPortalLeadId();
  if (!leadId) redirect("/portal/login");

  const jobs = await prisma.serviceJob.findMany({
    where: { customerId: leadId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">My bookings</h1>
      <p className="mb-5 mt-0.5 text-sm text-slate-500">All your service appointments</p>

      <Card>
        <CardHeader title="Service history" />
        {jobs.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="Book your first RO service in under a minute."
            action={<LinkButton href="/book" size="sm">Book a service</LinkButton>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Service type</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                  <th>Address</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Wrench size={14} className="text-brand-500" /> {j.type}
                      </span>
                    </td>
                    <td>
                      <Badge className={j.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : j.status === "SCHEDULED" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}>
                        {j.status}
                      </Badge>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-xs">
                        <CalendarClock size={13} className="text-slate-400" />
                        {j.scheduledAt ? format(j.scheduledAt, "dd MMM yyyy, h:mm a") : "TBD"}
                      </span>
                    </td>
                    <td className="max-w-[220px] text-xs">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400" /> {j.address ?? "—"}
                      </span>
                    </td>
                    <td>{j.amount ? `₹${j.amount}` : "—"}</td>
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