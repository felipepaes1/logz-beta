import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  XLSX_MIME_TYPE,
  getFilenameFromContentDisposition,
  saveComponentOutputsReport,
} from "@/services/component-outputs-report-download"

describe("component outputs report download", () => {
  const createObjectURL = vi.fn<(object: Blob | MediaSource) => string>(
    () => "blob:component-outputs"
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

  it("lê filenames simples e codificados do Content-Disposition", () => {
    expect(
      getFilenameFromContentDisposition(
        'attachment; filename="relatorio-saidas.xlsx"'
      )
    ).toBe("relatorio-saidas.xlsx")
    expect(
      getFilenameFromContentDisposition(
        "attachment; filename*=UTF-8''relat%C3%B3rio-sa%C3%ADdas.xlsx"
      )
    ).toBe("relatório-saídas.xlsx")
  })

  it("cria e revoga a object URL e remove o link temporário", () => {
    saveComponentOutputsReport(
      new Blob(["xlsx"]),
      'attachment; filename="saidas.xlsx"'
    )

    expect(createObjectURL).toHaveBeenCalledOnce()
    const createdBlob = createObjectURL.mock.calls[0]?.[0]
    expect(createdBlob).toBeInstanceOf(Blob)
    expect((createdBlob as Blob).type).toBe(XLSX_MIME_TYPE)
    expect(clickedDownload).toBe("saidas.xlsx")
    expect(document.querySelector('a[href="blob:component-outputs"]')).toBeNull()
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:component-outputs")
  })

  it("usa o nome fallback com a data atual quando o header não traz filename", () => {
    saveComponentOutputsReport(
      new Blob(["xlsx"]),
      null,
      new Date("2026-07-30T12:00:00.000Z")
    )

    expect(clickedDownload).toBe("relatorio-saidas-2026-07-30.xlsx")
  })
})
