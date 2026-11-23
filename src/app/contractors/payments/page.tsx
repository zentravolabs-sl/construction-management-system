import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createContractorPaymentAction } from "@/actions/erp";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { Calculator } from "lucide-react";

export default async function ContractorPaymentsPage() {
  const session = await requireModuleAccess("CONTRACTORS", "READ");
  const [agreements, payments] = await Promise.all([
    prisma.contractorAgreement.findMany({
      where: { organizationId: session.organizationId },
      include: { contractor: true, project: true },
    }),
    prisma.contractorPayment.findMany({
      where: { organizationId: session.organizationId },
      include: { contractor: true, project: true, agreement: true },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Subcontractor IPC Certification & Net Payable Engine
          </h1>
          <p className="text-xs text-slate-500">
            Formula: Approved Work Value − Previous Certified Payments − Advance Recovery −
            Retention − Other Approved Deductions = Net Payable
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Calculator className="h-4 w-4 text-blue-600" />
              Certify Subcontractor Payment
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createContractorPaymentAction(formData);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold">Agreement *</label>
                <select
                  name="agreementId"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {agreements.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.agreementNumber} - {ag.contractor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold">
                  Cumulative Approved Work Value (LKR) *
                </label>
                <input
                  name="approvedWorkValue"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={92000000}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">
                  Less: Previous Certified Payments (LKR) *
                </label>
                <input
                  name="previousCertifiedPayments"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={85000000}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold">Less: Advance Recovery</label>
                  <input
                    name="advanceRecovery"
                    type="number"
                    step="0.01"
                    defaultValue={1000000}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Retention %</label>
                  <input
                    name="retentionPct"
                    type="number"
                    step="0.01"
                    defaultValue={5}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold">
                  Less: Other Approved Deductions (LKR)
                </label>
                <input
                  name="otherDeductions"
                  type="number"
                  step="0.01"
                  defaultValue={0}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <input
                name="notes"
                placeholder="IPC Certification Notes"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Compute Net Payable & Post Voucher
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-bold">Certified Subcontractor Payment Vouchers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="pb-2">Voucher #</th>
                    <th className="pb-2">Contractor</th>
                    <th className="pb-2">Approved Work</th>
                    <th className="pb-2">Prev Certified</th>
                    <th className="pb-2">Adv Recovery</th>
                    <th className="pb-2">Retention</th>
                    <th className="pb-2">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((cp) => (
                    <tr key={cp.id}>
                      <td className="py-2.5 font-mono font-bold text-blue-600">
                        <div>{cp.voucherNumber}</div>
                        <div className="text-[10px] text-slate-400">
                          {formatDateDDMMYYYY(cp.paymentDate)}
                        </div>
                      </td>
                      <td className="py-2.5 font-bold">{cp.contractor.name}</td>
                      <td className="py-2.5">{formatLKR(toNumber(cp.approvedWorkValue))}</td>
                      <td className="py-2.5">
                        -{formatLKR(toNumber(cp.previousCertifiedPayments))}
                      </td>
                      <td className="py-2.5 text-amber-600">
                        -{formatLKR(toNumber(cp.advanceRecovery))}
                      </td>
                      <td className="py-2.5 text-amber-600">
                        -{formatLKR(toNumber(cp.retentionAmount))}
                      </td>
                      <td className="py-2.5 font-extrabold text-emerald-600">
                        {formatLKR(toNumber(cp.netPayable))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

