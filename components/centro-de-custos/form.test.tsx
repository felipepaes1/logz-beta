import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Drawer } from "@/components/ui/drawer"
import { CentroCustoForm } from "@/components/centro-de-custos/form"
import { MachineResource } from "@/resources/Machine/machine.resource"

const mocks = vi.hoisted(() => ({
  onSubmit: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
  },
}))

function makeMachine(
  id: number,
  description: string,
  code: string,
  model: string | null,
  active = true
) {
  const resource = new MachineResource()
  resource.setApiId(String(id))
  resource.setAttribute("description", description)
  resource.setAttribute("code", code)
  resource.setAttribute("model", model)
  resource.setAttribute("active", active)
  return resource
}

function Harness({
  resource,
  existingResources,
}: {
  resource?: MachineResource
  existingResources?: MachineResource[]
}) {
  return (
    <Drawer open onOpenChange={() => {}} direction="right">
      <CentroCustoForm
        title={resource ? "Editar Centro de Custo" : "Novo Centro de Custo"}
        resource={resource}
        existingResources={existingResources}
        onSubmit={mocks.onSubmit}
      />
    </Drawer>
  )
}

describe("CentroCustoForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const originalGetComputedStyle = window.getComputedStyle.bind(window)
    vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudo) => {
      const style = originalGetComputedStyle(element, pseudo)
      Object.defineProperty(style, "transform", {
        configurable: true,
        value: style.transform || "none",
      })
      return style
    })
    mocks.onSubmit.mockResolvedValue(undefined)
  })

  it("bloqueia a criação quando nome, código e C.C. já existem", async () => {
    const existing = makeMachine(1, "Torno", "TC-001", "CC-10", false)
    render(<Harness existingResources={[existing]} />)

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Torno" } })
    fireEvent.change(document.querySelector('input[name="codigo"]')!, {
      target: { value: "TC-001" },
    })
    fireEvent.change(document.querySelector('input[name="modelo"]')!, {
      target: { value: "CC-10" },
    })
    fireEvent.submit(document.querySelector("form")!)

    await waitFor(() => {
      expect(mocks.toastError).toHaveBeenCalledWith(
        "Já existe um centro de custo cadastrado com este nome, código e C.C."
      )
    })
    expect(mocks.onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole("heading", { name: "Novo Centro de Custo" })).toBeInTheDocument()
  })

  it("permite editar um centro de custo sem C.C. e envia null", async () => {
    const resource = makeMachine(2, "Fresa", "FR-002", null)
    render(<Harness resource={resource} existingResources={[resource]} />)

    fireEvent.submit(document.querySelector("form")!)

    await waitFor(() => expect(mocks.onSubmit).toHaveBeenCalledOnce())
    expect(mocks.onSubmit.mock.calls[0][0].model).toBeNull()
  })
})
