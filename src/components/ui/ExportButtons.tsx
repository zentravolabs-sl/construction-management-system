"use client";

import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn {
  header: string;
  key: string;
}

export function ExportButtons({
  title,
  filename,
  columns,
  rows,
}: {
  title: string;
  filename: string;
  columns: ExportColumn[];
  rows: Record<string, string | number>[];
}) {
  function handleExportExcel() {
    const formatted = rows.map((r) => {
      const obj: Record<string, string | number> = {};
      columns.forEach((c) => {
        obj[c.header] = r[c.key] ?? "";
      });
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  function handleExportPdf() {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(`BuildMaster ERP - ${title}`, 14, 15);
    doc.setFontSize(9);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString("en-GB", {
        timeZone: "Asia/Colombo",
      })} (Asia/Colombo) • Currency: LKR`,
      14,
      21
    );

    autoTable(doc, {
      startY: 26,
      head: [columns.map((c) => c.header)],
      body: rows.map((r) => columns.map((c) => String(r[c.key] ?? ""))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [29, 78, 216] },
    });

    doc.save(`${filename}.pdf`);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleExportPdf}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        <FileText className="h-3.5 w-3.5 text-red-600" />
        Export PDF
      </button>
      <button
        type="button"
        onClick={handleExportExcel}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
        Export Excel (.xlsx)
      </button>
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        <Printer className="h-3.5 w-3.5 text-blue-600" />
        Print View
      </button>
    </div>
  );
}

