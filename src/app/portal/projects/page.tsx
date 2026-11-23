import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";

export default async function ClientPortalProjectsPage() {
  const session = await requireSession();
  const clientFilter = session.clientId ? { clientId: session.clientId } : {};

  const projects = await prisma.project.findMany({
    where: {
      organizationId: session.organizationId,
      deletedAt: null,
      ...clientFilter,
    },
    include: { milestones: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Client Portal — My Construction Projects ({projects.length})
          </h1>
          <p className="text-xs text-slate-500">
            Live project progress, milestone completion status, and contract values
          </p>
        </div>

        <div className="space-y-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-600">{p.code}</span>
                  <h2 className="text-base font-bold">{p.name}</h2>
                  <p className="text-xs text-slate-500">{p.location}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold">
                    {formatLKR(toNumber(p.contractValue))}
                  </div>
                  <div className="text-xs font-bold text-blue-600">
                    {toNumber(p.calculatedProgress)}% Complete
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ErpPageWrapper>
  );
}

