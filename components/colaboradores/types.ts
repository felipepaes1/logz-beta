export const MAX_COLABORADOR_NOME_LENGTH = 100
export const MAX_COLABORADOR_CODIGO_LENGTH = 50

export interface Colaborador {
  id: number
  nome: string
  codigo: string
  password: string
  status: string
  resource: import("@/resources/Collaborator/collaborator.resource").CollaboratorResource
}
