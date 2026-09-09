import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { FerramentaFormDrawer } from "@/components/ferramentas/form-drawer"
import { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import { ManufacturerResource } from "@/resources/Manufacturer/manufacturer.resource"
import { ProviderResource } from "@/resources/Provider/provider.resource"

const mocks = vi.hoisted(() => ({
  createOrUpdateGroup: vi.fn(),
  createOrUpdateManufacturer: vi.fn(),
  getGroups: vi.fn(),
  getManufacturers: vi.fn(),
  getProviders: vi.fn(),
  onSubmit: vi.fn(),
  onSaved: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}))

function makeGroup(id: number, description: string) {
  const group = new ItemGroupResource()
  group.setApiId(String(id))
  group.setAttribute("description", description)
  return group
}

function makeManufacturer(id: number, description: string) {
  const manufacturer = new ManufacturerResource()
  manufacturer.setApiId(String(id))
  manufacturer.setAttribute("description", description)
  return manufacturer
}

function Harness({ groups }: { groups: ItemGroupResource[] }) {
  const [open, setOpen] = React.useState(true)
  const [currentGroups, setCurrentGroups] = React.useState(groups)
  const [currentManufacturers, setCurrentManufacturers] = React.useState([
    makeManufacturer(10, "Sandvik"),
  ])

  return (
    <FerramentaFormDrawer
      open={open}
      onOpenChange={setOpen}
      title="Nova Ferramenta"
      manufacturers={currentManufacturers}
      itemGroups={currentGroups}
      onGroupsUpdated={setCurrentGroups}
      onManufacturersUpdated={setCurrentManufacturers}
      onSubmit={mocks.onSubmit}
      onSaved={mocks.onSaved}
    />
  )
}

describe("FerramentaForm group flows", () => {
  const initialGroup = makeGroup(1, "Brocas")
  const createdGroup = makeGroup(2, "Fresas")
  const editedGroup = makeGroup(1, "Brocas de precisão")

  beforeEach(() => {
    vi.clearAllMocks()
    const getComputedStyle = window.getComputedStyle.bind(window)
    vi.spyOn(window, "getComputedStyle").mockImplementation((element, pseudo) => {
      const style = getComputedStyle(element, pseudo)
      Object.defineProperty(style, "transform", {
        configurable: true,
        value: style.transform || "none",
      })
      return style
    })
    mocks.onSubmit.mockResolvedValue({})
    mocks.getProviders.mockResolvedValue({ getData: () => [] })
    mocks.getGroups.mockResolvedValue({
      getData: () => [initialGroup, createdGroup],
    })
    mocks.getManufacturers.mockResolvedValue({
      getData: () => [makeManufacturer(10, "Sandvik")],
    })
    mocks.createOrUpdateGroup.mockResolvedValue({
      getData: () => ({ data: { id: 2 } }),
    })

    vi.spyOn(ItemGroupResource, "createOrUpdate").mockImplementation(
      mocks.createOrUpdateGroup
    )
    vi.spyOn(ItemGroupResource, "get").mockImplementation(mocks.getGroups)
    vi.spyOn(ManufacturerResource, "createOrUpdate").mockImplementation(
      mocks.createOrUpdateManufacturer
    )
    vi.spyOn(ManufacturerResource, "get").mockImplementation(mocks.getManufacturers)
    vi.spyOn(ProviderResource, "get").mockImplementation(mocks.getProviders)
  })

  it("cria um grupo sem fechar o Drawer e preserva os campos já preenchidos", async () => {
    const user = userEvent.setup()
    render(<Harness groups={[makeGroup(1, "Brocas")]} />)

    const nameInput = await screen.findByLabelText("Nome")
    const codeInput = screen.getByLabelText("Código")
    await user.type(nameInput, "Ferramenta de teste")
    await user.type(codeInput, "FT-001")

    await user.click(screen.getByRole("button", { name: "+ Novo Grupo" }))
    await user.type(await screen.findByLabelText("Nome do grupo"), "Fresas")
    await user.click(screen.getByRole("button", { name: "Confirmar" }))

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Novo grupo" })).not.toBeInTheDocument()
    })

    expect(screen.getByRole("heading", { name: "Nova Ferramenta" })).toBeInTheDocument()
    expect(nameInput).toHaveValue("Ferramenta de teste")
    expect(codeInput).toHaveValue("FT-001")
    expect(mocks.createOrUpdateGroup).toHaveBeenCalledOnce()
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Grupo criado com sucesso!")
  })

  it("edita um grupo sem desmontar o formulário principal", async () => {
    const user = userEvent.setup()
    mocks.createOrUpdateGroup.mockResolvedValue({
      getData: () => ({ data: { id: 1 } }),
    })
    mocks.getGroups.mockResolvedValue({
      getData: () => [editedGroup],
    })

    render(<Harness groups={[makeGroup(1, "Brocas")]} />)

    const nameInput = await screen.findByLabelText("Nome")
    await user.type(nameInput, " com detalhe")
    await user.click(screen.getByText("Selecione um grupo"))
    await user.click(screen.getByRole("option", { name: "Brocas" }))
    await user.click(screen.getByRole("button", { name: "Editar grupo" }))

    const editInput = await screen.findByLabelText("Nome do grupo")
    await user.clear(editInput)
    await user.type(editInput, "Brocas de precisão")
    await user.click(screen.getByRole("button", { name: "Confirmar" }))

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Editar grupo" })).not.toBeInTheDocument()
    })

    expect(screen.getByRole("heading", { name: "Nova Ferramenta" })).toBeInTheDocument()
    expect(nameInput).toHaveValue(" com detalhe")
    expect(mocks.createOrUpdateGroup).toHaveBeenCalledOnce()
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Grupo atualizado com sucesso!")
  })

  it("cria um fabricante mantendo o Drawer principal aberto", async () => {
    const user = userEvent.setup()
    const iscar = makeManufacturer(11, "Iscar")
    mocks.createOrUpdateManufacturer.mockResolvedValue({
      getData: () => ({ data: { id: 11 } }),
    })
    mocks.getManufacturers.mockResolvedValue({
      getData: () => [makeManufacturer(10, "Sandvik"), iscar],
    })

    render(<Harness groups={[makeGroup(1, "Brocas")]} />)

    await screen.findByLabelText("Nome")
    await user.click(screen.getByRole("button", { name: "+ Novo Fabricante" }))
    await user.type(await screen.findByLabelText("Nome do fabricante"), "Iscar")
    await user.click(screen.getByRole("button", { name: "Confirmar" }))

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Novo fabricante" })).not.toBeInTheDocument()
    })

    expect(screen.getByRole("heading", { name: "Nova Ferramenta" })).toBeInTheDocument()
    expect(mocks.createOrUpdateManufacturer).toHaveBeenCalledOnce()
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Fabricante criado com sucesso!")
  })

  it("salva a ferramenta, fecha apenas o Drawer principal e notifica a atualização", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<Harness groups={[makeGroup(1, "Brocas")]} />)

    const nameInput = await screen.findByLabelText("Nome")
    const codeInput = document.querySelector('input[name="codigo"]') as HTMLInputElement
    expect(codeInput).toBeInTheDocument()
    await user.type(nameInput, "Fresa de topo")
    await user.type(codeInput, "FT-002")

    await user.click(screen.getByText("Selecione um grupo"))
    await user.click(screen.getByRole("option", { name: "Brocas" }))
    await user.click(screen.getByText("Selecione um fabricante"))
    await user.click(screen.getByRole("option", { name: "Sandvik" }))
    await user.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Nova Ferramenta" })).not.toBeInTheDocument()
    })

    expect(mocks.onSubmit).toHaveBeenCalledOnce()
    expect(mocks.onSaved).toHaveBeenCalledOnce()
    expect(mocks.onSubmit.mock.calls[0][0]).toMatchObject({
      name: "Fresa de topo",
      code: "FT-002",
    })
  })
})
