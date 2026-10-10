import { redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { getPortalLeadId } from "@/lib/auth";
import { Card, CardHeader, Badge, EmptyState, LinkButton } from "@/components/ui";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortalInvoices() {
  const leadId = await getPortalLeadId();
  if (!leadId) redirect("/portal/login");

  const jobs = await prisma.serviceJob.findMany({
    where: { customerId: leadId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
  });

  const total = jobs.reduce((a, j) => a + (j.amount ?? 0), 0);

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">Invoices</h1>
      <p className="mb-5 mt-0.5 text-sm text-slate-500">
        Paid and completed services · total billed ₹{total.toLocaleString("en-IN")}
      </p>

      <Card>
        <CardHeader title="Completed services" subtitle="Digital invoices are generated on completion" />
        {jobs.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Your invoices will appear here once a service is completed."
            action={<LinkButton href="/book" size="sm">Book a service</LinkButton>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j, i) => (
                  <tr key={j.id}>
                    <td>
                      <span className="flex items-center gap-1.5 text-xs font-medium">
                        <FileText size={14} className="text-brand-500" /> INV-{j.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td>{j.type}</td>
                    <td className="text-xs">{format(j.createdAt, "dd MMM yyyy")}</td>
                    <td className="font-semibold text-slate-700">₹{j.amount ?? 0}</td>
                    <td>
                      <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td colSpan={3} className="font-bold text-slate-700">Total</td>
                  <td className="font-bold text-slate-800">₹{total.toLocaleString("en-IN")}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}