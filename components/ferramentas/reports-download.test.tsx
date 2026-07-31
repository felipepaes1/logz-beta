import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  TOOL_REPORT_OPTIONS,
  ToolsReportsDownload,
} from "@/components/ferramentas/reports-download"

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  downloadStockReplenishment: vi.fn(),
  getContentDisposition: vi.fn<() => string | null>(() => null),
  save: vi.fn(),
  saveStockReplenishment: vi.fn(),
  toastError: vi.fn(),
  toastLoading: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock("@/services/inventory-api.client", () => ({
  inventoryApiClient: {
    downloadToolPurchaseRequestReport: mocks.download,
    downloadStockReplenishmentReport: mocks.downloadStockReplenishment,
  },
}))

vi.mock("@/services/xlsx-report-download", () => ({
  getContentDisposition: mocks.getContentDisposition,
}))

vi.mock("@/services/tool-purchase-request-report-download", () => ({
  saveToolPurchaseRequestReport: mocks.save,
}))

vi.mock("@/services/stock-replenishment-report-download", () => ({
  saveStockReplenishmentReport: mocks.saveStockReplenishment,
}))

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    loading: mocks.toastLoading,
    success: mocks.toastSuccess,
  },
}))

function createDeferred<T,>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

describe("ToolsReportsDownload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("exibe o tipo disponível e envia o blob recebido para download", async () => {
    const user = userEvent.setup()
    const reportBlob = new Blob(["xlsx"])
    const headers = { "content-disposition": "attachment" }
    mocks.getContentDisposition.mockReturnValue(
      'attachment; filename="solicitacao.xlsx"'
    )
    mocks.download.mockResolvedValue({ data: reportBlob, headers })

    render(React.createElement(ToolsReportsDownload))

    expect(TOOL_REPORT_OPTIONS).toEqual([
      {
        label: "Relatório p/ Solicitação de Compra",
        value: "purchase_request",
      },
      {
        label: "Relatório de Reposição",
        value: "stock_replenishment",
      },
    ])
    expect(
      screen.getByRole("combobox", { name: "Tipo de relatório" })
    ).toHaveTextContent("Relatório p/ Solicitação de Compra")

    await user.click(
      screen.getByRole("button", { name: "Gerar Relatórios" })
    )

    await waitFor(() => {
      expect(mocks.download).toHaveBeenCalledWith()
      expect(mocks.save).toHaveBeenCalledWith(
        reportBlob,
        'attachment; filename="solicitacao.xlsx"'
      )
    })
  })

  it("abre o modal, permite escolher o período e gera o relatório de reposição", async () => {
    const user = userEvent.setup()
    const reportBlob = new Blob(["xlsx"])
    const headers = { "content-disposition": "attachment" }
    mocks.getContentDisposition.mockReturnValue(
      'attachment; filename="reposicao.xlsx"'
    )
    mocks.downloadStockReplenishment.mockResolvedValue({
      data: reportBlob,
      headers,
    })

    render(React.createElement(ToolsReportsDownload))

    await user.click(
      screen.getByRole("combobox", { name: "Tipo de relatório" })
    )
    await user.click(
      screen.getByRole("option", { name: "Relatório de Reposição" })
    )
    await user.click(
      screen.getByRole("button", { name: "Gerar Relatórios" })
    )

    expect(
      screen.getByRole("heading", { name: "Relatório de Reposição" })
    ).toBeInTheDocument()
    expect(mocks.downloadStockReplenishment).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole("combobox", {
        name: "Período do relatório de reposição",
      })
    )
    await user.click(
      screen.getByRole("option", { name: "Últimos 15 dias" })
    )
    await user.click(
      screen.getByRole("button", { name: "Gerar relatório" })
    )

    await waitFor(() => {
      expect(mocks.downloadStockReplenishment).toHaveBeenCalledWith(
        "15_days"
      )
      expect(mocks.saveStockReplenishment).toHaveBeenCalledWith(
        reportBlob,
        'attachment; filename="reposicao.xlsx"'
      )
    })
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Relatório de Reposição" })
      ).not.toBeInTheDocument()
    })
  })

  it("exibe loading e impede downloads duplicados", async () => {
    const deferred = createDeferred<{ data: Blob; headers: object }>()
    mocks.download.mockReturnValue(deferred.promise)

    render(React.createElement(ToolsReportsDownload))

    const reportSelect = screen.getByRole("combobox", {
      name: "Tipo de relatório",
    })
    const generateButton = screen.getByRole("button", {
      name: "Gerar Relatórios",
    })

    fireEvent.click(generateButton)
    fireEvent.click(generateButton)

    expect(mocks.download).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Gerando..." })).toBeDisabled()
    expect(reportSelect).toBeDisabled()

    deferred.resolve({ data: new Blob(["xlsx"]), headers: {} })

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Gerar Relatórios" })
      ).toBeEnabled()
    })
  })

  it("notifica o erro padrão e libera o botão para nova tentativa", async () => {
    const user = userEvent.setup()
    mocks.download.mockRejectedValue(new Error("Falha ao gerar relatório"))

    render(React.createElement(ToolsReportsDownload))

    await user.click(
      screen.getByRole("button", { name: "Gerar Relatórios" })
    )

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Falha ao gerar relatório",
        { id: "download-tool-report" }
      )
    })
    expect(
      screen.getByRole("button", { name: "Gerar Relatórios" })
    ).toBeEnabled()
  })
})
