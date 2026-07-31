import {
  getFilenameFromContentDisposition,
  saveXlsxReport,
} from "@/services/xlsx-report-download"

export function buildComponentOutputsReportFallbackFilename(now = new Date()): string {
  return `relatorio-saidas-${now.toISOString().slice(0, 10)}.xlsx`
}

export function saveComponentOutputsReport(
  data: Blob,
  disposition?: string | null,
  now = new Date()
): void {
  const filename =
    getFilenameFromContentDisposition(disposition) ??
    buildComponentOutputsReportFallbackFilename(now)

  saveXlsxReport(data, filename)
}

export {
  XLSX_MIME_TYPE,
  getContentDisposition,
  getFilenameFromContentDisposition,
  saveXlsxReport,
} from "@/services/xlsx-report-download"
