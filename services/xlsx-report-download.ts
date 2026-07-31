import type { AxiosResponse } from "axios"

export const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

function decodeFilename(value: string): string {
  const normalized = value.trim().replace(/^["']|["']$/g, "")

  try {
    return decodeURIComponent(normalized)
  } catch {
    return normalized
  }
}

export function getFilenameFromContentDisposition(
  disposition?: string | null
): string | null {
  if (!disposition) return null

  const encodedFilename = disposition.match(
    /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i
  )?.[1]
  const regularFilename =
    disposition.match(/filename\s*=\s*"([^"]+)"/i)?.[1] ??
    disposition.match(/filename\s*=\s*([^;]+)/i)?.[1]
  const filename = decodeFilename(encodedFilename ?? regularFilename ?? "")

  if (!filename) return null

  return filename.split(/[\\/]/).pop() ?? null
}

export function getContentDisposition(
  headers: AxiosResponse<Blob>["headers"]
): string | null {
  const getter = headers?.get
  const valueFromGetter =
    typeof getter === "function"
      ? getter.call(headers, "content-disposition")
      : null
  const value =
    valueFromGetter ??
    headers?.["content-disposition"] ??
    headers?.["Content-Disposition"]

  return typeof value === "string" ? value : null
}

export function saveXlsxReport(data: Blob, filename: string): void {
  const blob = new Blob([data], { type: XLSX_MIME_TYPE })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")

  try {
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    URL.revokeObjectURL(objectUrl)
  }
}
