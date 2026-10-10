import Link from "next/link";
import { format } from "date-fns";
import { Plus, UploadCloud } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardHeader, EmptyState, Select, Input, Button, LinkButton } from "@/components/ui";
import { LeadStatusBadge, SourceBadge, IntentBadge, ScoreBadge } from "@/components/crm/status-badges";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, SOURCES, SOURCE_LABELS, type LeadStatus, type Source } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const take = 50;
  const skip = (page - 1) * take;

  const where: Record<string, unknown> = {
    ...(searchParams.status ? { status: searchParams.status } : {}),
    ...(searchParams.source ? { source: searchParams.source } : {}),
    ...(searchParams.intent ? { intent: searchParams.intent } : {}),
  };
  if (searchParams.q) {
    where.OR = [
      { name: { contains: searchParams.q } },
      { phone: { contains: searchParams.q } },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        assignedTo: { select: { name: true } },
        _count: { select: { calls: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  const pages = Math.ceil(total / take);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Leads</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {total} leads · cold-call uploads and online marketing unified
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/crm/leads/import" variant="outline" size="sm">
            <UploadCloud size={15} /> Import CSV
          </LinkButton>
          <LinkButton href="/crm/leads/new" size="sm">
            <Plus size={15} /> Add lead
          </LinkButton>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" />
        <form method="GET" className="flex flex-wrap items-end gap-3 px-5 pb-4">
          <Input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Search name / phone…"
            className="w-52"
          />
          <Select name="status" defaultValue={searchParams.status ?? ""} className="w-40">
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s as LeadStatus]}
              </option>
            ))}
          </Select>
          <Select name="source" defaultValue={searchParams.source ?? ""} className="w-44">
            <option value="">All sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABELS[s as Source]}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary" size="sm">
            Apply
          </Button>
          <a href="/crm/leads" className="px-2 py-2 text-xs text-slate-400 hover:text-slate-600">
            Reset
          </a>
        </form>
      </Card>

      <Card className="mt-4">
        {leads.length === 0 ? (
          <EmptyState
            title="No leads match your filters"
            description="Try clearing filters or importing a new database."
            action={<LinkButton href="/crm/leads/import" size="sm">Import leads</LinkButton>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Intent</th>
                  <th>Score</th>
                  <th>Assignee</th>
                  <th>Calls</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link
                        href={`/crm/leads/${l.id}`}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        {l.name}
                      </Link>
                      <div className="text-xs text-slate-400">{l.phone}</div>
                    </td>
                    <td><SourceBadge source={l.source} /></td>
                    <td><LeadStatusBadge status={l.status} /></td>
                    <td><IntentBadge intent={l.intent} /></td>
                    <td><ScoreBadge score={l.score} /></td>
                    <td className="text-xs">{l.assignedTo?.name ?? "Unassigned"}</td>
                    <td>{l._count.calls}</td>
                    <td className="text-xs">{format(l.createdAt, "dd MMM")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pages > 1 ? (
        <div className="mt-4 flex items-center gap-3 text-sm">
          <a
            href={`/crm/leads?page=${Math.max(1, page - 1)}&status=${searchParams.status ?? ""}&source=${searchParams.source ?? ""}&q=${searchParams.q ?? ""}`}
            className={`rounded-lg border px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-white"}`}
          >
            Previous
          </a>
          <span className="text-xs text-slate-500">
            Page {page} of {pages}
          </span>
          <a
            href={`/crm/leads?page=${page + 1}&status=${searchParams.status ?? ""}&source=${searchParams.source ?? ""}&q=${searchParams.q ?? ""}`}
            className={`rounded-lg border px-3 py-1.5 ${page >= pages ? "pointer-events-none opacity-40" : "hover:bg-white"}`}
          >
            Next
          </a>
        </div>
      ) : null}
    </div>
  );
}