import {
  getFilenameFromContentDisposition,
  saveXlsxReport,
} from "@/services/xlsx-report-download"

export function buildToolPurchaseRequestReportFallbackFilename(
  now = new Date()
): string {
  return `relatorio-solicitacao-compra-${now.toISOString().slice(0, 10)}.xlsx`
}

export function saveToolPurchaseRequestReport(
  data: Blob,
  disposition?: string | null,
  now = new Date()
): void {
  const filename =
    getFilenameFromContentDisposition(disposition) ??
    buildToolPurchaseRequestReportFallbackFilename(now)

  saveXlsxReport(data, filename)
}
