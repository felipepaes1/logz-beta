export interface Fornecedor {
  id: number
  empresa: string
  vendedor: string
  email: string
  telefone: string
  prazo: number
  observacoes: string
  resource?: import("@/resources/Provider/provider.resource").ProviderResource
  dto?: import("@/resources/Provider/provider.dto").ProviderDto
}
