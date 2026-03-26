"use client";

import { useRef, useState, useMemo } from "react";
import { Download, Upload, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useLanguage } from "@/contexts/LanguageContext";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
const BASE_FILENAME = (title: string) => title.toLowerCase().replace(/\s+/g, "-");

interface DataTableExportProps<T extends Record<string, unknown>> {
  title: string;
  columns: { id: string; header: string; accessor: (row: T) => string | number }[];
  data: T[];
  onImport?: (rows: T[]) => void;
}

export function DataTableExport<T extends Record<string, unknown>>({
  title,
  columns,
  data,
  onImport,
}: DataTableExportProps<T>) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * pageSize;
  const pageData = useMemo(() => data.slice(start, start + pageSize), [data, start, pageSize]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    setExportOpen(false);
    const headers = columns.map((c) => c.header);
    const rows = data.map((row) => columns.map((c) => String(c.accessor(row))));
    const csv = Papa.unparse([headers, ...rows]);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${BASE_FILENAME(title)}.csv`);
  };

  const exportExcel = () => {
    setExportOpen(false);
    const headers = columns.map((c) => c.header);
    const rows = data.map((row) => columns.map((c) => String(c.accessor(row))));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    downloadBlob(blob, `${BASE_FILENAME(title)}.xlsx`);
  };

  const exportJson = () => {
    setExportOpen(false);
    const rows = data.map((row) => {
      const obj: Record<string, string | number> = {};
      columns.forEach((col) => {
        obj[col.header] = col.accessor(row);
      });
      return obj;
    });
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${BASE_FILENAME(title)}.json`);
  };

  const finishImport = (rows: Record<string, string>[]) => {
    if (!onImport) return;
    const mapped = rows.map((r) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        const val = r[col.header] ?? r[Object.keys(r)[i]] ?? "";
        obj[col.id] = val;
      });
      return obj as T;
    });
    onImport(mapped);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv" || !ext) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          finishImport((results.data as Record<string, string>[]) ?? []);
        },
      });
      e.target.value = "";
      return;
    }
    if (ext === "json") {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          const rows = Array.isArray(parsed)
            ? (parsed as Record<string, unknown>[]).map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v ?? "")])))
            : [];
          finishImport(rows);
        } catch {
          finishImport([]);
        }
      };
      reader.readAsText(file, "UTF-8");
      e.target.value = "";
      return;
    }
    if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = () => {
        const wb = XLSX.read(reader.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = ws ? (XLSX.utils.sheet_to_json(ws) as Record<string, string>[]) : [];
        finishImport(rows);
      };
      reader.readAsArrayBuffer(file);
      e.target.value = "";
    }
  };

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm" aria-labelledby={`table-${title}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <h2 id={`table-${title}`} className="text-lg font-semibold text-[var(--color-title)]">
          {title}
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              aria-expanded={exportOpen}
              aria-haspopup="true"
              aria-label={t("dashboard.table.export")}
            >
              <Download className="h-4 w-4" aria-hidden />
              {t("dashboard.table.export")}
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setExportOpen(false)} />
                <div
                  className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={exportCsv}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:bg-[var(--color-surface-alt)]"
                  >
                    {t("dashboard.table.exportCsv")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={exportExcel}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:bg-[var(--color-surface-alt)]"
                  >
                    {t("dashboard.table.exportExcel")}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={exportJson}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:bg-[var(--color-surface-alt)]"
                  >
                    {t("dashboard.table.exportJson")}
                  </button>
                </div>
              </>
            )}
          </div>
          {onImport && (
            <div className="relative">
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.json,.xlsx,.xls"
                className="sr-only"
                onChange={handleImport}
                aria-label={t("dashboard.table.importCsvOrExcelOrJson")}
              />
              <button
                type="button"
                onClick={() => setImportOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                aria-expanded={importOpen}
                aria-haspopup="true"
                aria-label={t("dashboard.table.import")}
              >
                <Upload className="h-4 w-4" aria-hidden />
                {t("dashboard.table.import")}
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
              {importOpen && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setImportOpen(false)} />
                  <div
                    className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg"
                    role="menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setImportOpen(false); inputRef.current?.click(); }}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:bg-[var(--color-surface-alt)]"
                    >
                      {t("dashboard.table.exportCsv")}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setImportOpen(false); inputRef.current?.click(); }}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:bg-[var(--color-surface-alt)]"
                    >
                      {t("dashboard.table.exportExcel")}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => { setImportOpen(false); inputRef.current?.click(); }}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] focus:outline-none focus:bg-[var(--color-surface-alt)]"
                    >
                      {t("dashboard.table.exportJson")}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" role="table">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
              {columns.map((col) => (
                <th key={col.id} className="px-4 py-3 font-semibold text-[var(--color-title)]">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--color-muted)]">
                  {t("dashboard.table.noData")}
                </td>
              </tr>
            ) : (
              pageData.map((row, i) => (
                <tr key={start + i} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]">
                  {columns.map((col) => (
                    <td key={col.id} className="px-4 py-3 text-[var(--color-text)]">
                      {String(col.accessor(row))}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-muted)]">{t("dashboard.table.entriesPerPage")}</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            aria-label={t("dashboard.table.entriesPerPage")}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-muted)]" aria-live="polite">
            {total === 0 ? "0" : `${start + 1}-${Math.min(start + pageSize, total)} ${t("dashboard.table.of")} ${total}`}
          </span>
          {totalPages > 1 && (
            <>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                aria-label={t("dashboard.table.prev")}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-[var(--color-text)] hover:bg-[var(--color-surface-alt)] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                aria-label={t("dashboard.table.next")}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
