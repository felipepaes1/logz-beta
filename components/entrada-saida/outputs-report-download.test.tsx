import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { OutputsReportDownload } from "@/components/entrada-saida/outputs-report-download"

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  getContentDisposition: vi.fn(() => null),
  save: vi.fn(),
  toastError: vi.fn(),
  toastLoading: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock("@/services/inventory-api.client", () => ({
  inventoryApiClient: {
    downloadComponentOutputsReport: mocks.download,
  },
}))

vi.mock("@/services/component-outputs-report-download", () => ({
  getContentDisposition: mocks.getContentDisposition,
  saveComponentOutputsReport: mocks.save,
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
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, reject, resolve }
}

describe("OutputsReportDownload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("envia o período selecionado para a API", async () => {
    const user = userEvent.setup()
    mocks.download.mockResolvedValue({
      data: new Blob(["xlsx"]),
      headers: {},
    })

    render(React.createElement(OutputsReportDownload))

    await user.click(
      screen.getByRole("combobox", { name: "Período do relatório" })
    )
    await user.click(screen.getByRole("option", { name: "3 meses" }))
    await user.click(
      screen.getByRole("button", { name: "Gerar relatório" })
    )

    await waitFor(() => {
      expect(mocks.download).toHaveBeenCalledWith("3_months")
    })
  })

  it("exibe loading, preserva o período e bloqueia downloads duplicados", async () => {
    const deferred = createDeferred<{ data: Blob; headers: object }>()
    mocks.download.mockReturnValue(deferred.promise)

    render(React.createElement(OutputsReportDownload))

    const periodSelect = screen.getByRole("combobox", {
      name: "Período do relatório",
    })
    const generateButton = screen.getByRole("button", {
      name: "Gerar relatório",
    })

    fireEvent.click(generateButton)
    fireEvent.click(generateButton)

    expect(mocks.download).toHaveBeenCalledTimes(1)
    expect(mocks.download).toHaveBeenCalledWith("7_days")
    expect(
      screen.getByRole("button", { name: "Gerando..." })
    ).toBeDisabled()
    expect(periodSelect).toBeDisabled()
    expect(periodSelect).toHaveTextContent("7 dias")

    deferred.resolve({ data: new Blob(["xlsx"]), headers: {} })

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Gerar relatório" })
      ).toBeEnabled()
    })
    expect(periodSelect).toHaveTextContent("7 dias")
  })

  it("notifica o erro e libera o botão para uma nova tentativa", async () => {
    const user = userEvent.setup()
    mocks.download.mockRejectedValue(new Error("API indisponível"))

    render(React.createElement(OutputsReportDownload))

    await user.click(
      screen.getByRole("button", { name: "Gerar relatório" })
    )

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith("API indisponível", {
        id: "download-component-outputs-report",
      })
    })
    expect(
      screen.getByRole("button", { name: "Gerar relatório" })
    ).toBeEnabled()
  })
})
