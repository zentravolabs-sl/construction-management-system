import Link from "next/link";
import { redirect } from "next/navigation";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProjectAction } from "@/actions/erp";
import { ArrowLeft, Save } from "lucide-react";

export default async function NewProjectPage() {
  const session = await requireModuleAccess("PROJECTS", "CREATE");
  const clients = await prisma.client.findMany({
    where: { organizationId: session.organizationId, deletedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Register New Construction Project
            </h1>
            <p className="text-xs text-slate-500">
              Auto-generates Project Code, BOQ baseline, and links client contract & budget
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Projects
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <form
            action={async (formData) => {
              "use server";
              const res = await createProjectAction(formData);
              if (res?.projectId) {
                redirect(`/projects/${res.projectId}`);
              }
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Name *
                </label>
                <input
                  name="name"
                  required
                  placeholder="Port City Commercial Tower Block B"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Client *
                </label>
                <select
                  name="clientId"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clientCode} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Type *
                </label>
                <select
                  name="projectType"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="RESIDENTIAL_CONSTRUCTION">Residential Construction</option>
                  <option value="COMMERCIAL_CONSTRUCTION">Commercial Construction</option>
                  <option value="INDUSTRIAL_CONSTRUCTION">Industrial Construction</option>
                  <option value="RENOVATION">Renovation</option>
                  <option value="INFRASTRUCTURE">Infrastructure</option>
                  <option value="ROAD_CONSTRUCTION">Road Construction</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Initial Status
                </label>
                <select
                  name="status"
                  defaultValue="ONGOING"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PLANNING">Planning</option>
                  <option value="APPROVED">Approved</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Priority
                </label>
                <select
                  name="priority"
                  defaultValue="HIGH"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Site Location Address *
                </label>
                <input
                  name="location"
                  required
                  placeholder="Plot 14, Financial District, Colombo Port City"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  City
                </label>
                <input
                  name="city"
                  defaultValue="Colombo"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Start Date *
                </label>
                <input
                  name="startDate"
                  type="date"
                  required
                  defaultValue="2026-11-20"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Expected Completion Date *
                </label>
                <input
                  name="expectedCompletionDate"
                  type="date"
                  required
                  defaultValue="2027-11-20"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Contract Value (LKR) *
                </label>
                <input
                  name="contractValue"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={250000000}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Estimated Construction Budget (LKR) *
                </label>
                <input
                  name="estimatedBudget"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={198000000}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Project Scope & Engineering Description
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Reinforced concrete structure, post-tensioned slabs, MEP & facade..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Save className="h-4 w-4" /> Create Construction Project
            </button>
          </form>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

