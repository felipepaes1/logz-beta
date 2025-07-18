export interface Colaborador {
  id: number
  nome: string
  codigo: string
  status: string
  resource: import("@/resources/Collaborator/collaborator.resource").CollaboratorResource
}
