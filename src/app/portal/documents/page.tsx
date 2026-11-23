import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY } from "@/lib/utils";
import { Download, FileText } from "lucide-react";

export default async function ClientPortalDocumentsPage() {
  const session = await requireSession();

  const documents = await prisma.document.findMany({
    where: {
      organizationId: session.organizationId,
      isClientVisible: true,
      ...(session.clientId ? { project: { clientId: session.clientId } } : {}),
    },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Client Portal — Shared Contracts, Drawings & Certificates
          </h1>
          <p className="text-xs text-slate-500">
            Download official documents approved for client portal visibility
          </p>
        </div>

        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-bold">{doc.title}</div>
                  <div className="text-xs text-slate-500">
                    {doc.project?.name || "General"} • {doc.category} •{" "}
                    {formatDateDDMMYYYY(doc.createdAt)}
                  </div>
                </div>
              </div>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
            </div>
          ))}
        </div>
      </div>
    </ErpPageWrapper>
  );
}

