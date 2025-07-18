export interface Movimento {
  id: number
  data: string
  grupo: string
  codigo: string
  ferramenta: string
  maquina: string
  responsavel: string
  operacao: string
  precoUnitario: number
  precoTotal: number
  ordem: string
  quantidade: number
  resource?: import("@/resources/Component/component.resource").ComponentResource
  item?: import("@/resources/Item/item.resource").ItemResource
  itemGroup?: import("@/resources/ItemGroup/item-group.resource").ItemGroupResource
  machine?: import("@/resources/Machine/machine.resource").MachineResource
  collaborator?: import("@/resources/Collaborator/collaborator.resource").CollaboratorResource
  pcp?: import("@/resources/Pcp/pcp.resource").PcpResource
}
