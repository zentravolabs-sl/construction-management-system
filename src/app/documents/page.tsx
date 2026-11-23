import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDocumentAction } from "@/actions/erp";
import { formatDateDDMMYYYY } from "@/lib/utils";
import { FileText, Download, Plus } from "lucide-react";

export default async function DocumentsPage() {
  const session = await requireModuleAccess("DOCUMENTS", "READ");
  const [documents, projects] = await Promise.all([
    prisma.document.findMany({
      where: { organizationId: session.organizationId },
      include: { project: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: { organizationId: session.organizationId, deletedAt: null },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Engineering Document & Drawing Repository ({documents.length})
          </h1>
          <p className="text-xs text-slate-500">
            Central vault for FIDIC contracts, BOQ files, architectural & structural drawings,
            inspection reports, and completion certificates
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Plus className="h-4 w-4 text-blue-600" />
              Upload Project Document
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createDocumentAction(formData);
              }}
              className="space-y-3"
            >
              <input
                name="title"
                required
                placeholder="Document Title *"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <select
                name="projectId"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
              <select
                name="category"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="CONTRACT">CONTRACT</option>
                <option value="BOQ_DOCUMENT">BOQ_DOCUMENT</option>
                <option value="ARCHITECTURAL_DRAWING">ARCHITECTURAL_DRAWING</option>
                <option value="STRUCTURAL_DRAWING">STRUCTURAL_DRAWING</option>
                <option value="SITE_PHOTO">SITE_PHOTO</option>
                <option value="INVOICE">INVOICE</option>
                <option value="RECEIPT">RECEIPT</option>
                <option value="APPROVAL">APPROVAL</option>
                <option value="INSPECTION_REPORT">INSPECTION_REPORT</option>
                <option value="COMPLETION_CERTIFICATE">COMPLETION_CERTIFICATE</option>
              </select>
              <select
                name="isClientVisible"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="true">Visible in Client Portal</option>
                <option value="false">Internal Engineering Only</option>
              </select>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Upload & Index Document
              </button>
            </form>
          </div>

          <div className="space-y-3 lg:col-span-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-blue-600/10 p-2.5 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {doc.title}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {doc.category} • {doc.project?.code || "General"} • v{doc.version} •{" "}
                      {doc.fileSizeKb} KB • Uploaded by {doc.uploadedBy} on{" "}
                      {formatDateDDMMYYYY(doc.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      doc.isClientVisible
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                    }`}
                  >
                    {doc.isClientVisible ? "CLIENT VISIBLE" : "INTERNAL"}
                  </span>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-600" /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

