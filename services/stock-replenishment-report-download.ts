import {
  getFilenameFromContentDisposition,
  saveXlsxReport,
} from "@/services/xlsx-report-download"

export function buildStockReplenishmentReportFallbackFilename(
  now = new Date()
): string {
  return `relatorio-reposicao-${now.toISOString().slice(0, 10)}.xlsx`
}

export function saveStockReplenishmentReport(
  data: Blob,
  disposition?: string | null,
  now = new Date()
): void {
  const filename =
    getFilenameFromContentDisposition(disposition) ??
    buildStockReplenishmentReportFallbackFilename(now)

  saveXlsxReport(data, filename)
}
