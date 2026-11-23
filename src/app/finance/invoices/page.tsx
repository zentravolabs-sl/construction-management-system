import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createClientInvoiceAction,
  recordInvoicePartialPaymentAction,
} from "@/actions/erp";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { FileText, CreditCard } from "lucide-react";

export default async function ClientInvoicesPage() {
  const session = await requireModuleAccess("FINANCE", "READ");
  const [invoices, projects, org] = await Promise.all([
    prisma.invoice.findMany({
      where: { organizationId: session.organizationId },
      include: { client: true, project: true },
      orderBy: { invoiceDate: "desc" },
    }),
    prisma.project.findMany({
      where: { organizationId: session.organizationId, deletedAt: null },
      orderBy: { code: "asc" },
    }),
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
  ]);

  const openInvoices = invoices.filter((i) => toNumber(i.outstandingAmount) > 0);

  const exportRows = invoices.map((i) => ({
    invoiceNumber: i.invoiceNumber,
    date: formatDateDDMMYYYY(i.invoiceDate),
    dueDate: formatDateDDMMYYYY(i.dueDate),
    client: i.client.name,
    project: i.project.code,
    subtotal: toNumber(i.subtotal),
    taxAmount: toNumber(i.taxAmount),
    totalAmount: toNumber(i.totalAmount),
    paidAmount: toNumber(i.paidAmount),
    outstandingAmount: toNumber(i.outstandingAmount),
    status: i.status,
  }));

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Client Progress Invoices & Partial Payment Settlement
            </h1>
            <p className="text-xs text-slate-500">
              Configurable VAT ({toNumber(org?.defaultTaxRate ?? 18)}%), discount support, and
              partial payment allocation
            </p>
          </div>
          <ExportButtons
            title="Client Invoices Register"
            filename="Client-Invoices-LKR"
            columns={[
              { header: "Invoice #", key: "invoiceNumber" },
              { header: "Date", key: "date" },
              { header: "Due Date", key: "dueDate" },
              { header: "Client", key: "client" },
              { header: "Project", key: "project" },
              { header: "Subtotal", key: "subtotal" },
              { header: "VAT", key: "taxAmount" },
              { header: "Total", key: "totalAmount" },
              { header: "Paid", key: "paidAmount" },
              { header: "Outstanding", key: "outstandingAmount" },
              { header: "Status", key: "status" },
            ]}
            rows={exportRows}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form 1: Issue New Invoice */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <FileText className="h-4 w-4 text-blue-600" />
              Generate New Client Progress Invoice (IPC)
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createClientInvoiceAction(formData);
              }}
              className="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold">Project *</label>
                  <select
                    name="projectId"
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold">Description *</label>
                  <input
                    name="description"
                    required
                    placeholder="IPC #05 - Structural Slab Progress"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold">Amount Before Tax (LKR) *</label>
                  <input
                    name="rate"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={25000000}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Discount (LKR)</label>
                  <input
                    name="discountAmount"
                    type="number"
                    step="0.01"
                    defaultValue={0}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Configurable Tax %</label>
                  <input
                    name="taxRate"
                    type="number"
                    step="0.01"
                    defaultValue={toNumber(org?.defaultTaxRate ?? 18)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Issue Client Invoice
              </button>
            </form>
          </div>

          {/* Form 2: Apply Partial or Full Payment */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Record Partial or Full Client Payment
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await recordInvoicePartialPaymentAction(formData);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold">
                  Select Outstanding Invoice *
                </label>
                <select
                  name="invoiceId"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {openInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} ({inv.client.name}) — Outstanding:{" "}
                      {formatLKR(toNumber(inv.outstandingAmount))}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold">Payment Received (LKR) *</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={10000000}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Method</label>
                  <select
                    name="paymentMethod"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                    <option value="CHEQUE">CHEQUE</option>
                    <option value="CASH">CASH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold">Bank / Cheque Ref</label>
                  <input
                    name="referenceNo"
                    placeholder="SLIPS-99281"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Post Payment & Update Balance
              </button>
            </form>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2">Invoice #</th>
                  <th className="pb-2">Client & Project</th>
                  <th className="pb-2">Date / Due</th>
                  <th className="pb-2">Subtotal</th>
                  <th className="pb-2">Tax</th>
                  <th className="pb-2">Total</th>
                  <th className="pb-2">Paid</th>
                  <th className="pb-2">Outstanding</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                    <td className="py-3">
                      <div className="font-bold">{inv.client.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {inv.project.code} • {inv.description}
                      </div>
                    </td>
                    <td className="py-3 text-slate-500">
                      <div>{formatDateDDMMYYYY(inv.invoiceDate)}</div>
                      <div className="text-[10px]">Due: {formatDateDDMMYYYY(inv.dueDate)}</div>
                    </td>
                    <td className="py-3">{formatLKR(toNumber(inv.subtotal))}</td>
                    <td className="py-3">{formatLKR(toNumber(inv.taxAmount))}</td>
                    <td className="py-3 font-bold">{formatLKR(toNumber(inv.totalAmount))}</td>
                    <td className="py-3 font-bold text-emerald-600">
                      {formatLKR(toNumber(inv.paidAmount))}
                    </td>
                    <td className="py-3 font-extrabold text-amber-600">
                      {formatLKR(toNumber(inv.outstandingAmount))}
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          inv.status === "PAID"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-amber-500/15 text-amber-600"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

