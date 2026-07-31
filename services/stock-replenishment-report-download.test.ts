import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  buildStockReplenishmentReportFallbackFilename,
  saveStockReplenishmentReport,
} from "@/services/stock-replenishment-report-download"

describe("stock replenishment report download", () => {
  const createObjectURL = vi.fn<(object: Blob | MediaSource) => string>(
    () => "blob:stock-replenishment"
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
      buildStockReplenishmentReportFallbackFilename(
        new Date("2026-07-30T12:00:00.000Z")
      )
    ).toBe("relatorio-reposicao-2026-07-30.xlsx")
  })

  it("baixa o XLSX e revoga a object URL", () => {
    saveStockReplenishmentReport(
      new Blob(["xlsx"]),
      null,
      new Date("2026-07-30T12:00:00.000Z")
    )

    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob)
    expect(clickedDownload).toBe("relatorio-reposicao-2026-07-30.xlsx")
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:stock-replenishment")
  })
})
