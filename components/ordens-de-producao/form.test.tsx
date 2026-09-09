import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Drawer } from "@/components/ui/drawer"
import { OrdemProducaoForm } from "@/components/ordens-de-producao/form"
import { ProductionOrderResource } from "@/resources/ProductionOrders/production-orders.resource"

const mocks = vi.hoisted(() => ({
  onSubmit: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
  },
}))

function makeProductionOrder(
  id: number,
  description: string,
  code: string,
  active = true
) {
  const resource = new ProductionOrderResource()
  resource.setApiId(String(id))
  resource.setAttribute("description", description)
  resource.setAttribute("code", code)
  resource.setAttribute("active", active)
  return resource
}

function Harness({
  resource,
  existingResources,
}: {
  resource?: ProductionOrderResource
  existingResources?: ProductionOrderResource[]
}) {
  return (
    <Drawer open onOpenChange={() => {}} direction="right">
      <OrdemProducaoForm
        title={resource ? "Editar Ordem" : "Nova Ordem"}
        resource={resource}
        existingResources={existingResources}
        onSubmit={mocks.onSubmit}
      />
    </Drawer>
  )
}

describe("OrdemProducaoForm", () => {
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

  it("bloqueia a criação quando descrição e código já existem, mesmo inativos", async () => {
    const existing = makeProductionOrder(1, "Ordem padrão", "OP-001", false)
    render(<Harness existingResources={[existing]} />)

    fireEvent.change(document.querySelector('input[name="descricao"]')!, {
      target: { value: "Ordem padrão" },
    })
    fireEvent.change(document.querySelector('input[name="codigo"]')!, {
      target: { value: "OP-001" },
    })
    fireEvent.submit(document.querySelector("form")!)

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledOnce())
    expect(mocks.onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole("heading", { name: "Nova Ordem" })).toBeInTheDocument()
  })

  it("permite editar a própria ordem sem acusar duplicidade", async () => {
    const resource = makeProductionOrder(2, "Ordem padrão", "OP-001")
    render(<Harness resource={resource} existingResources={[resource]} />)

    fireEvent.submit(document.querySelector("form")!)

    await waitFor(() => expect(mocks.onSubmit).toHaveBeenCalledOnce())
    expect(mocks.toastError).not.toHaveBeenCalled()
  })
})
