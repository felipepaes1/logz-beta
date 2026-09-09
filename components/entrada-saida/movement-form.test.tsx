import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Drawer } from "@/components/ui/drawer"
import { MovementForm } from "@/components/entrada-saida/movement-form"

function renderForm(movementType: "IN" | "OUT" = "IN") {
  return render(
    <Drawer open onOpenChange={() => {}} direction="right">
      <MovementForm
        movementType={movementType}
        title="Nova movimentação"
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        items={[]}
        inventoryItems={[]}
        collaborators={[]}
        machines={[]}
        pcps={[]}
      />
    </Drawer>
  )
}

describe("MovementForm", () => {
  it("limita textos livres e identifica os campos obrigatórios", () => {
    renderForm("IN")
    fireEvent.click(screen.getByRole("button", { name: "Ferramentas" }))

    expect(screen.getByLabelText("Ordem / documento")).toHaveAttribute("maxLength", "50")
    expect(screen.getByLabelText("Justificativa (opcional)")).toHaveAttribute("maxLength", "500")

    const requiredMarks = Array.from(
      document.querySelectorAll('[data-required-mark="true"]')
    )
    expect(requiredMarks.length).toBeGreaterThanOrEqual(2)
    expect(requiredMarks.every((mark) => mark.className.includes("text-red-600"))).toBe(true)
  })

  it("marca a máquina como obrigatória somente na saída", () => {
    renderForm("OUT")
    fireEvent.click(screen.getByRole("button", { name: "Ferramentas" }))

    expect(document.getElementById("machine")).toHaveAttribute("aria-required", "true")
  })
})
