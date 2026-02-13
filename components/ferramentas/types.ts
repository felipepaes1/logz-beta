export interface PurchaseRequestInfo {
  providerName?: string
  providerId?: number
  requestedQty?: number
  openedAt?: string
  closedAt?: string | null
  openedBy?: string | number
}

export interface Ferramenta {
  id: number
  nome: string
  codigo: string
  grupo: string
  fabricante: string
  estoqueMinimo: number
  estoqueAtual: number
  fornecedor: string
  status: string
  preOrderer?: number
  preOrdered?: boolean | number
  purchaseRequest?: PurchaseRequestInfo | null
  resource?: import("@/resources/Item/item.resource").ItemResource
  manufacturer?: import("@/resources/Manufacturer/manufacturer.resource").ManufacturerResource
  itemGroup?: import("@/resources/ItemGroup/item-group.resource").ItemGroupResource
  provider?: import("@/resources/Provider/provider.resource").ProviderResource
}
