import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";

export default async function ContractorAgreementsPage() {
  const session = await requireModuleAccess("CONTRACTORS", "READ");
  const agreements = await prisma.contractorAgreement.findMany({
    where: { organizationId: session.organizationId },
    include: { contractor: true, project: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Subcontractor Agreements, Work Measurements & Retention Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Track contract sum, mobilization advances, retention percentage, and certified progress
          </p>
        </div>

        <div className="space-y-4">
          {agreements.map((ag) => (
            <div
              key={ag.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="rounded bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-600">
                    {ag.agreementNumber}
                  </span>
                  <h2 className="mt-2 text-base font-bold">{ag.title}</h2>
                  <p className="text-xs text-slate-500">
                    Contractor: {ag.contractor.name} • Project: {ag.project.code} ({ag.project.name})
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600">
                  {ag.paymentBasis} • {toNumber(ag.progressPct)}% Complete
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                Scope: {ag.scopeOfWork} ({formatDateDDMMYYYY(ag.startDate)} →{" "}
                {formatDateDDMMYYYY(ag.endDate)})
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-5">
                <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800">
                  <div className="text-slate-500">Contract Sum</div>
                  <div className="font-bold">{formatLKR(toNumber(ag.contractAmount))}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800">
                  <div className="text-slate-500">Certified Work Value</div>
                  <div className="font-bold text-blue-600">
                    {formatLKR(toNumber(ag.certifiedWorkValue))}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800">
                  <div className="text-slate-500">Advance Recovered</div>
                  <div className="font-bold">
                    {formatLKR(toNumber(ag.advanceRecovered))} /{" "}
                    {formatLKR(toNumber(ag.advanceAmount))}
                  </div>
                </div>
                <div className="rounded-xl bg-amber-500/10 p-3 text-xs">
                  <div className="text-amber-700 dark:text-amber-300">
                    Retention Held ({toNumber(ag.retentionPct)}%)
                  </div>
                  <div className="font-bold text-amber-700 dark:text-amber-300">
                    {formatLKR(toNumber(ag.retentionHeld))}
                  </div>
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-3 text-xs">
                  <div className="text-emerald-700 dark:text-emerald-300">Total Net Paid</div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-300">
                    {formatLKR(toNumber(ag.totalPaid))}
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

