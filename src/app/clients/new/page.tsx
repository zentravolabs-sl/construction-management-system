import Link from "next/link";
import { redirect } from "next/navigation";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { createClientAction } from "@/actions/erp";
import { ArrowLeft, Save } from "lucide-react";

export default async function NewClientPage() {
  const session = await requireModuleAccess("CLIENTS", "CREATE");

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Register New Construction Client
            </h1>
            <p className="text-xs text-slate-500">
              Create an individual or corporate client record with dedicated client portal support
            </p>
          </div>
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Clients
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <form
            action={async (formData) => {
              "use server";
              const res = await createClientAction(formData);
              if (res?.clientId) {
                redirect(`/clients/${res.clientId}`);
              }
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Client / Company Name *
                </label>
                <input
                  name="name"
                  required
                  placeholder="Shangri-La Urban Developments PLC"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Client Type *
                </label>
                <select
                  name="clientType"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="COMPANY">COMPANY (Corporate / Developer / Govt)</option>
                  <option value="INDIVIDUAL">INDIVIDUAL (Private Homeowner)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Primary Contact Person
                </label>
                <input
                  name="contactPerson"
                  placeholder="Mr. Asanka De Mel"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  NIC / Business Registration No (BRN)
                </label>
                <input
                  name="nicOrBrn"
                  placeholder="PQ-0098412"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number *
                </label>
                <input
                  name="phone"
                  required
                  placeholder="+94 11 244 9900"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="contracts@developer.lk"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Address
                </label>
                <input
                  name="address"
                  placeholder="No. 1, Galle Face Center Road"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  City
                </label>
                <input
                  name="city"
                  defaultValue="Colombo 02"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Client Notes & Payment Terms
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Retention 5%, IPC certification cycle 14 days..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Save className="h-4 w-4" /> Register Client
            </button>
          </form>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

