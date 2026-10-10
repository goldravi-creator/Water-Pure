import { prisma } from "@/lib/db";
import { Card, CardHeader, Badge } from "@/components/ui";
import { Avatar } from "@/components/ui";
import { ROLE_LABELS, type Role } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const users = await prisma.user.findMany({
    orderBy: { role: "asc" },
    include: {
      _count: {
        select: {
          assignedLeads: true,
          calls: true,
          serviceJobs: true,
          tickets: true,
        },
      },
    },
  });

  const roleBadge: Record<string, string> = {
    OWNER: "bg-violet-100 text-violet-700",
    MANAGER: "bg-brand-100 text-brand-700",
    TEAM_LEAD: "bg-indigo-100 text-indigo-700",
    AGENT: "bg-emerald-100 text-emerald-700",
    TECHNICIAN: "bg-amber-100 text-amber-800",
    ACCOUNTANT: "bg-slate-100 text-slate-600",
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800">Team</h1>
      <p className="mb-5 mt-0.5 text-sm text-slate-500">
        Agents, technicians and managers on the platform
      </p>

      <Card>
        <CardHeader title="Users & workload" subtitle="Assigned leads vs AI-automated follow-ups" />
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Assigned leads</th>
                <th>Calls</th>
                <th>Hand-off tickets</th>
                <th>Service jobs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="flex items-center gap-2">
                      <Avatar name={u.name} />
                      <div>
                        <div className="text-sm font-medium text-slate-700">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </div>
                    </span>
                  </td>
                  <td>
                    <Badge className={roleBadge[u.role] ?? ""}>
                      {ROLE_LABELS[u.role as Role] ?? u.role}
                    </Badge>
                  </td>
                  <td>{u._count.assignedLeads}</td>
                  <td>{u._count.calls}</td>
                  <td>{u._count.tickets}</td>
                  <td>{u._count.serviceJobs}</td>
                  <td>
                    <Badge className={u.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                      {u.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}