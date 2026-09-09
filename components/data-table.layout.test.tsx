import * as React from "react"
import { render, screen } from "@testing-library/react"
import type { ColumnDef } from "@tanstack/react-table"
import { describe, expect, it } from "vitest"

import { DataTable } from "@/components/data-table"

interface TestRow {
  id: number
  data: string
  item: string
}

describe("DataTable layout", () => {
  it("mantém a primeira coluna livre e trunca somente colunas configuradas", () => {
    const longItem = "Ferramenta com um nome muito extenso para validar o limite visual"
    const columns: ColumnDef<TestRow>[] = [
      { accessorKey: "data", header: "Data" },
      {
        accessorKey: "item",
        header: "Item",
        meta: { className: "max-w-[160px]", truncate: true },
      },
    ]

    const { container } = render(
      <DataTable
        data={[{ id: 1, data: "09/09/2026 15:00", item: longItem }]}
        columns={columns}
      />
    )

    const tableBody = container.querySelector('[data-slot="table-body"]')
    expect(tableBody).not.toHaveClass(
      "data-[slot=table-body]:[&>*]:data-[slot=table-cell]:first:w-8"
    )

    const itemCell = screen.getByText(longItem)
    expect(itemCell).toHaveClass("truncate")
    expect(itemCell).toHaveAttribute("title", longItem)
    expect(itemCell.closest("td")).toHaveClass("max-w-[160px]")
  })
})
