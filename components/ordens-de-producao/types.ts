export interface OrdemProducao {
  id: number
  descricao: string
  codigo: string
  status: string
  resource: import("@/resources/ProductionOrders/production-orders.resource").ProductionOrderResource
}
