export interface Colaborador {
  id: number
  nome: string
  codigo: string
  password: string
  status: string
  resource: import("@/resources/Collaborator/collaborator.resource").CollaboratorResource
}
