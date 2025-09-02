export interface CentroCusto {
  id: number
  descricao: string
  codigo: string
  modelo: string
  status: string
  resource: import("@/resources/Machine/machine.resource").MachineResource
}
