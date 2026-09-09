"use client"

import * as React from "react"

import { Drawer } from "@/components/ui/drawer"
import type { ItemGroupResource } from "@/resources/ItemGroup/item-group.resource"
import type { ItemResource } from "@/resources/Item/item.resource"
import type { ManufacturerResource } from "@/resources/Manufacturer/manufacturer.resource"
import type { ProviderResource } from "@/resources/Provider/provider.resource"
import type { ItemDto } from "@/resources/Item/item.dto"
import { FerramentaForm } from "./form"

interface FerramentaFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  manufacturers: ManufacturerResource[]
  itemGroups: ItemGroupResource[]
  onSubmit: (dto: ItemDto) => Promise<unknown>
  onSaved?: (dto: ItemDto) => void | Promise<void>
  resource?: ItemResource
  provider?: ProviderResource | null
  onGroupsUpdated?: (groups: ItemGroupResource[]) => void
  onManufacturersUpdated?: (manufacturers: ManufacturerResource[]) => void
}

export function FerramentaFormDrawer({
  open,
  onOpenChange,
  title,
  manufacturers,
  itemGroups,
  onSubmit,
  onSaved,
  resource,
  provider,
  onGroupsUpdated,
  onManufacturersUpdated,
}: FerramentaFormDrawerProps) {
  const nestedOverlayOpenRef = React.useRef(false)
  const closeRequestedRef = React.useRef(false)

  React.useEffect(() => {
    if (!open) return
    // A new opening starts a fresh interaction cycle. This also prevents a
    // previous explicit close from authorizing a later implicit dismiss.
    nestedOverlayOpenRef.current = false
    closeRequestedRef.current = false
  }, [open])

  const handleNestedOverlayChange = React.useCallback((nestedOpen: boolean) => {
    nestedOverlayOpenRef.current = nestedOpen
  }, [])

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        closeRequestedRef.current = false
        onOpenChange(true)
        return
      }

      // Nested Radix layers can ask the parent Drawer to dismiss while they
      // close or restore focus. Only an explicit close is allowed here.
      if (!closeRequestedRef.current) return
      closeRequestedRef.current = false
      onOpenChange(false)
    },
    [onOpenChange]
  )

  const requestClose = React.useCallback(() => {
    if (nestedOverlayOpenRef.current) return
    closeRequestedRef.current = true
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      direction="right"
    >
      {open ? (
        <FerramentaForm
          key={resource ? `edit-${resource.getApiId?.() ?? "unknown"}` : "create"}
          title={title}
          resource={resource}
          provider={provider}
          manufacturers={manufacturers}
          itemGroups={itemGroups}
          onGroupsUpdated={onGroupsUpdated}
          onManufacturersUpdated={onManufacturersUpdated}
          onNestedOverlayChange={handleNestedOverlayChange}
          onRequestClose={requestClose}
          onSaved={onSaved}
          onSubmit={onSubmit}
        />
      ) : null}
    </Drawer>
  )
}
