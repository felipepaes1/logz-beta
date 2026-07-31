import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  buildToolPurchaseRequestReportFallbackFilename,
  saveToolPurchaseRequestReport,
} from "@/services/tool-purchase-request-report-download"

describe("tool purchase request report download", () => {
  const createObjectURL = vi.fn<(object: Blob | MediaSource) => string>(
    () => "blob:tool-purchase-request"
  )
  const revokeObjectURL = vi.fn<(url: string) => void>()
  let clickedDownload = ""

  beforeEach(() => {
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
    clickedDownload = ""

    vi.spyOn(URL, "createObjectURL").mockImplementation(createObjectURL)
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(revokeObjectURL)
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function click(this: HTMLAnchorElement) {
        clickedDownload = this.download
      }
    )
  })

  it("gera o filename fallback com a data atual", () => {
    expect(
      buildToolPurchaseRequestReportFallbackFilename(
        new Date("2026-07-30T12:00:00.000Z")
      )
    ).toBe("relatorio-solicitacao-compra-2026-07-30.xlsx")
  })

  it("baixa o blob, remove o link temporário e revoga a object URL", () => {
    saveToolPurchaseRequestReport(
      new Blob(["xlsx"]),
      null,
      new Date("2026-07-30T12:00:00.000Z")
    )

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob)
    expect(clickedDownload).toBe(
      "relatorio-solicitacao-compra-2026-07-30.xlsx"
    )
    expect(
      document.querySelector('a[href="blob:tool-purchase-request"]')
    ).toBeNull()
    expect(revokeObjectURL).toHaveBeenCalledWith(
      "blob:tool-purchase-request"
    )
  })

  it("prioriza o filename retornado no Content-Disposition", () => {
    saveToolPurchaseRequestReport(
      new Blob(["xlsx"]),
      'attachment; filename="solicitacao.xlsx"'
    )

    expect(clickedDownload).toBe("solicitacao.xlsx")
  })
})
