const PLACEHOLDER_NAME = /^(?:[-–—_]+|n\/?a|null|undefined)$/i

function isMeaningfulName(value?: string | null) {
  const normalized = value?.trim() ?? ""
  return normalized.length > 0 && !PLACEHOLDER_NAME.test(normalized)
}

export function getCollaboratorDisplayName({
  name,
  key,
}: {
  name?: string | null
  key?: string | null
}) {
  if (isMeaningfulName(name)) return name!.trim()
  if (isMeaningfulName(key)) return key!.trim()
  return "Colaborador não identificado"
}

export function getCollaboratorInitials(name: string) {
  if (name === "Colaborador não identificado") return "NI"

  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}
