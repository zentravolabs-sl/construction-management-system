import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEquipmentAction } from "@/actions/erp";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { Wrench, Plus } from "lucide-react";

export default async function EquipmentPage() {
  const session = await requireModuleAccess("EQUIPMENT", "READ");
  const equipments = await prisma.equipment.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { equipmentCode: "asc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Heavy Equipment, Tower Cranes & Machinery Fleet ({equipments.length})
          </h1>
          <p className="text-xs text-slate-500">
            Track owned and rented machinery, operating hours, diesel consumption, and maintenance
            schedules
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Plus className="h-4 w-4 text-blue-600" />
              Register Plant / Machinery
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createEquipmentAction(formData);
              }}
              className="space-y-3"
            >
              <input
                name="name"
                required
                placeholder="Equipment Name (e.g., JCB 3DX Backhoe Loader)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="category"
                defaultValue="Earthmoving & Excavation"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  name="ownership"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="OWNED">OWNED FLEET</option>
                  <option value="RENTAL">HIRED / RENTAL</option>
                </select>
                <input
                  name="dailyRentalRate"
                  type="number"
                  step="0.01"
                  defaultValue={45000}
                  placeholder="Daily Rate (LKR)"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Add Equipment to Fleet
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Machinery Name</th>
                    <th className="pb-2">Ownership</th>
                    <th className="pb-2">Daily Rate</th>
                    <th className="pb-2">Operating Hours</th>
                    <th className="pb-2">Fuel (L)</th>
                    <th className="pb-2">Next Service</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {equipments.map((eq) => (
                    <tr key={eq.id}>
                      <td className="py-3 font-mono font-bold text-blue-600">
                        {eq.equipmentCode}
                      </td>
                      <td className="py-3">
                        <div className="font-bold">{eq.name}</div>
                        <div className="text-[11px] text-slate-500">{eq.category}</div>
                      </td>
                      <td className="py-3">{eq.ownership}</td>
                      <td className="py-3 font-semibold">
                        {formatLKR(toNumber(eq.dailyRentalRate))}
                      </td>
                      <td className="py-3 font-bold">{toNumber(eq.operatingHours)} hrs</td>
                      <td className="py-3">{toNumber(eq.fuelConsumedLiters)} L</td>
                      <td className="py-3 text-slate-500">
                        {formatDateDDMMYYYY(eq.nextMaintenanceAt)}
                      </td>
                      <td className="py-3">
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                          {eq.status}
                        </span>
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

