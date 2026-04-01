"use client"

import * as React from "react"
import { MovementForm, type MovementFormPayload } from "./movement-form"
import type { Movimento } from "./types"
import { ItemResource } from "@/resources/Item/item.resource"
import type { InventoryItemParsed } from "@/resources/InventoryItem/inventory-item.dto"
import { CollaboratorResource } from "@/resources/Collaborator/collaborator.resource"
import { MachineResource } from "@/resources/Machine/machine.resource"
import { PcpResource } from "@/resources/Pcp/pcp.resource"

interface Props {
  onSubmit: (payload: MovementFormPayload) => Promise<unknown>
  movement?: Movimento
  items: ItemResource[]
  inventoryItems: InventoryItemParsed[]
  collaborators: CollaboratorResource[]
  machines: MachineResource[]
  pcps: PcpResource[]
  title?: string
  disableEdition?: boolean
  onRequestClose?: () => void
}

export function SaidaForm({
  onSubmit,
  movement,
  items,
  inventoryItems,
  collaborators,
  machines,
  pcps,
  title = "Cadastrar Saida",
  disableEdition,
  onRequestClose,
}: Props): React.ReactElement {
  return (
    <MovementForm
      movementType="OUT"
      title={title}
      onSubmit={onSubmit}
      movement={movement}
      items={items}
      inventoryItems={inventoryItems}
      collaborators={collaborators}
      machines={machines}
      pcps={pcps}
      disableEdition={disableEdition}
      onRequestClose={onRequestClose}
    />
  )
}

