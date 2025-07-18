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
  resource?: import("@/resources/Item/item.resource").ItemResource
  manufacturer?: import("@/resources/Manufacturer/manufacturer.resource").ManufacturerResource
  itemGroup?: import("@/resources/ItemGroup/item-group.resource").ItemGroupResource
}
