import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProjectAction } from "@/actions/erp";
import { toNumber } from "@/lib/utils";
import { ArrowLeft, Save } from "lucide-react";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireModuleAccess("PROJECTS", "UPDATE");
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.organizationId },
  });
  if (!project) notFound();

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Edit Project: {project.code}
            </h1>
            <p className="text-xs text-slate-500">{project.name}</p>
          </div>
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Project
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <form
            action={async (formData) => {
              "use server";
              await updateProjectAction(formData);
              redirect(`/projects/${project.id}`);
            }}
            className="space-y-4"
          >
            <input type="hidden" name="projectId" value={project.id} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Project Name *
                </label>
                <input
                  name="name"
                  required
                  defaultValue={project.name}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Site Location *
                </label>
                <input
                  name="location"
                  required
                  defaultValue={project.location}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={project.status}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PLANNING">PLANNING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="ONGOING">ONGOING</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                  <option value="DELAYED">DELAYED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Priority
                </label>
                <select
                  name="priority"
                  defaultValue={project.priority}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Contract Value (LKR)
                </label>
                <input
                  name="contractValue"
                  type="number"
                  step="0.01"
                  defaultValue={toNumber(project.contractValue)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Original Budget (LKR)
                </label>
                <input
                  name="estimatedBudget"
                  type="number"
                  step="0.01"
                  defaultValue={toNumber(project.estimatedBudget)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Revised Budget (LKR)
                </label>
                <input
                  name="revisedBudget"
                  type="number"
                  step="0.01"
                  defaultValue={toNumber(project.revisedBudget ?? project.estimatedBudget)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={project.description || ""}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </form>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

