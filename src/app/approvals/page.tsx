import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decideApprovalAction } from "@/actions/erp";
import { formatDateTimeColombo, formatLKR, toNumber } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

export default async function ApprovalsPage() {
  const session = await requireModuleAccess("APPROVALS", "READ");
  const canApprove = hasPermission(session.role, "APPROVALS", "APPROVE");

  const approvals = await prisma.approval.findMany({
    where: { organizationId: session.organizationId },
    include: {
      requester: true,
      decider: true,
      history: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { requestedAt: "desc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Centralized Multi-Level Approval Workflow Center
            </h1>
            <p className="text-xs text-slate-500">
              Review and authorize Purchase Requests, Purchase Orders, Project Expenses,
              Subcontractor IPCs, Stock Adjustments, BOQs & Variation Orders
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <ShieldCheck className="h-4 w-4" />
            Your Role ({session.role}): {canApprove ? "Authorized Approver" : "View Only"}
          </div>
        </div>

        <div className="space-y-4">
          {approvals.map((ap) => (
            <div
              key={ap.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-600">
                      {ap.referenceCode}
                    </span>
                    <span className="rounded bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold dark:bg-slate-800">
                      {ap.entityType}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        ap.status === "APPROVED"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : ap.status === "REJECTED"
                          ? "bg-red-500/15 text-red-600"
                          : "bg-amber-500/15 text-amber-600"
                      }`}
                    >
                      {ap.status}
                    </span>
                  </div>
                  <h2 className="mt-2 text-base font-bold">{ap.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Requested by {ap.requester?.fullName || "Site Engineer"} on{" "}
                    {formatDateTimeColombo(ap.requestedAt)} • Level {ap.approvalLevel}
                  </p>
                  {ap.comments && (
                    <p className="mt-1 text-xs italic text-slate-600 dark:text-slate-300">
                      &ldquo;{ap.comments}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {formatLKR(toNumber(ap.amount))}
                  </div>

                  {ap.status === "PENDING" && canApprove && (
                    <div className="flex items-center gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await decideApprovalAction(
                            ap.id,
                            "APPROVED",
                            `Approved by ${session.fullName}`
                          );
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await decideApprovalAction(
                            ap.id,
                            "REJECTED",
                            `Rejected by ${session.fullName}`
                          );
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-500"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ErpPageWrapper>
  );
}

