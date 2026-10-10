import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Droplets, Wrench, CalendarCheck, Inbox } from "lucide-react";
import { prisma } from "@/lib/db";
import { getPortalLeadId } from "@/lib/auth";
import { Card, CardBody, CardHeader, Stat, Badge, EmptyState, LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PortalDashboard() {
  const leadId = await getPortalLeadId();
  if (!leadId) redirect("/portal/login");

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      serviceJobs: { orderBy: { createdAt: "desc" } },
      tickets: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (!lead) redirect("/portal/login");

  const activeJobs = lead.serviceJobs.filter((j) => j.status !== "CANCELLED").length;
  const nextJob = lead.serviceJobs[0];
  const openTickets = lead.tickets.filter((t) => t.status !== "CLOSED").length;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">
        Namaste, {lead.name.split(" ")[0]} 👋
      </h1>
      <p className="mb-6 mt-0.5 text-sm text-slate-500">
        Manage your RO service bookings, AMC and invoices.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Service Bookings" value={activeJobs} icon={<CalendarCheck size={15} />} />
        <Stat label="Active tickets" value={openTickets} tone="amber" icon={<Inbox size={15} />} />
        <Stat label="Purifier" value={lead.isCustomer ? "Registered" : "Pending"} tone="green" icon={<Droplets size={15} />} />
        <Stat label="Preferred language" value={lead.language === "en" ? "English" : "Hindi"} tone="violet" icon={<Droplets size={15} />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Next service" subtitle={lead.area || lead.city || ""} />
          <CardBody>
            {nextJob ? (
              <div className="rounded-xl bg-brand-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-brand-700">
                    <Wrench size={16} /> {nextJob.type}
                  </span>
                  <Badge className="bg-white text-brand-700">{nextJob.status}</Badge>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {nextJob.scheduledAt
                    ? `Scheduled: ${format(nextJob.scheduledAt, "dd MMM yyyy, h:mm a")}`
                    : "Scheduling in progress…"}
                </div>
                {nextJob.amount ? (
                  <div className="mt-1 text-sm text-slate-600">Estimate: ₹{nextJob.amount}</div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                title="No bookings yet"
                description="Book your first RO service in under a minute."
                action={<LinkButton href="/book" size="sm">Book a service</LinkButton>}
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent activity" />
          <CardBody className="space-y-3">
            {lead.serviceJobs.map((j) => (
              <div key={j.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm">
                <div className="text-slate-700">
                  <b>{j.type}</b>
                  <div className="text-xs text-slate-400">
                    {format(j.createdAt, "dd MMM yyyy")} · {j.status}
                  </div>
                </div>
                <Badge className="bg-slate-100 text-slate-600">{j.status}</Badge>
              </div>
            ))}
            {lead.serviceJobs.length === 0 ? (
              <p className="text-sm text-slate-400">Activity will appear here after your first booking.</p>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6">
        <Link href="/book" className="text-sm font-medium text-brand-600 hover:underline">
          → Book a new service
        </Link>
      </div>
    </div>
  );
}