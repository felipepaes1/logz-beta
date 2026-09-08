import { describe, expect, it } from "vitest"

import { getCollaboratorDisplayName } from "@/lib/collaborator-display"

describe("getCollaboratorDisplayName", () => {
  it("prioriza o nome do colaborador quando ele é válido", () => {
    expect(
      getCollaboratorDisplayName({ name: "  Júlio César  ", key: "42" })
    ).toBe("Júlio César")
  })

  it("usa a chave como fallback quando o nome contém apenas travessões", () => {
    expect(
      getCollaboratorDisplayName({ name: "—", key: "Reginaldo Gorges" })
    ).toBe("Reginaldo Gorges")
  })

  it("exibe um rótulo claro quando nome e chave são placeholders", () => {
    expect(getCollaboratorDisplayName({ name: "--", key: "—" })).toBe(
      "Colaborador não identificado"
    )
  })
})
