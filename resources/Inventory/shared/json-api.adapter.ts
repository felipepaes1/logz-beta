export interface JsonApiIdentifier {
  type: string
  id: string | number
}

export interface JsonApiRelationshipObject {
  data?:
    | JsonApiIdentifier
    | JsonApiIdentifier[]
    | JsonApiResourceObject
    | JsonApiResourceObject[]
    | null
}

export interface JsonApiResourceObject<
  TAttributes extends Record<string, unknown> = Record<string, unknown>,
> {
  type: string
  id: string | number
  attributes?: TAttributes
  relationships?: Record<string, JsonApiRelationshipObject>
  [key: string]: unknown
}

export interface JsonApiDocument<
  TData =
    | JsonApiResourceObject
    | JsonApiResourceObject[]
    | null,
> {
  data: TData
  included?: JsonApiResourceObject[]
  meta?: Record<string, unknown>
  links?: Record<string, unknown>
}

export interface JsonApiCollectionResult<T> {
  data: T[]
  meta?: Record<string, unknown>
  links?: Record<string, unknown>
  raw: JsonApiDocument
}

export interface JsonApiSingleResult<T> {
  data: T | null
  meta?: Record<string, unknown>
  links?: Record<string, unknown>
  raw: JsonApiDocument
}

export interface JsonApiPageQuery {
  limit?: number
  offset?: number
}

export interface JsonApiQuery<
  TFilter extends Record<string, unknown> = Record<string, unknown>,
> {
  filter?: TFilter
  include?: string | string[]
  sort?: string | string[]
  page?: JsonApiPageQuery
  [key: string]: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function pickProperty<T = unknown>(
  source: Record<string, unknown>,
  key: string
): T | undefined {
  if (!Object.prototype.hasOwnProperty.call(source, key)) return undefined
  return source[key] as T
}

function isValidResourceObject(value: unknown): value is JsonApiResourceObject {
  if (!isRecord(value)) return false
  const type = value["type"]
  const id = value["id"]
  return (
    typeof type === "string" &&
    (typeof id === "string" || typeof id === "number")
  )
}

function sanitizePageQuery(page?: JsonApiPageQuery): JsonApiPageQuery | undefined {
  if (!page) return undefined
  const output: JsonApiPageQuery = {}

  if (Number.isFinite(page.limit as number)) {
    output.limit = Number(page.limit)
  }

  if (Number.isFinite(page.offset as number)) {
    output.offset = Number(page.offset)
  }

  return Object.keys(output).length ? output : undefined
}

function sanitizeFilterQuery<TFilter extends Record<string, unknown>>(
  filter?: TFilter
): TFilter | undefined {
  if (!filter || !isRecord(filter)) return undefined
  const output: Record<string, unknown> = {}

  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      output[key] = value
    }
  })

  return Object.keys(output).length ? (output as TFilter) : undefined
}

export function normalizeCsvValue(value?: string | string[]): string | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) {
    const clean = value.map((entry) => String(entry).trim()).filter(Boolean)
    return clean.length ? clean.join(",") : undefined
  }
  const text = String(value).trim()
  return text.length ? text : undefined
}

export function buildJsonApiQuery<TFilter extends Record<string, unknown>>(
  query?: JsonApiQuery<TFilter>
): Record<string, unknown> | undefined {
  if (!query) return undefined

  const output: Record<string, unknown> = {}
  const filter = sanitizeFilterQuery(query.filter)
  const page = sanitizePageQuery(query.page)
  const include = normalizeCsvValue(query.include)
  const sort = normalizeCsvValue(query.sort)

  if (filter) output.filter = filter
  if (include) output.include = include
  if (sort) output.sort = sort
  if (page) output.page = page

  Object.entries(query).forEach(([key, value]) => {
    if (["filter", "include", "sort", "page"].includes(key)) return
    if (value === undefined || value === null || value === "") return
    output[key] = value
  })

  return Object.keys(output).length ? output : undefined
}

export function unwrapJsonApiDocument(response: unknown): JsonApiDocument {
  const responseObject = isRecord(response) ? response : {}
  const axiosResponse = pickProperty<Record<string, unknown>>(
    responseObject,
    "axiosResponse"
  )
  const payload =
    (isRecord(axiosResponse) ? pickProperty(axiosResponse, "data") : undefined) ??
    pickProperty(responseObject, "data") ??
    response

  if (isRecord(payload)) {
    if (isRecord(payload.data) && "data" in payload.data) {
      return payload.data as unknown as JsonApiDocument
    }

    if ("data" in payload) {
      return payload as unknown as JsonApiDocument
    }
  }

  if (isValidResourceObject(payload)) {
    return { data: payload }
  }

  return { data: [] as JsonApiResourceObject[] }
}

export function asCollection(data: JsonApiDocument["data"]): JsonApiResourceObject[] {
  if (Array.isArray(data)) {
    return data.filter(isValidResourceObject)
  }

  if (isValidResourceObject(data)) {
    return [data]
  }

  return []
}

export function asSingle(
  data: JsonApiDocument["data"]
): JsonApiResourceObject | null {
  if (Array.isArray(data)) {
    const first = data.find(isValidResourceObject)
    return first ?? null
  }

  return isValidResourceObject(data) ? data : null
}

export function buildIncludedMap(
  included: JsonApiResourceObject[] | undefined
): Map<string, JsonApiResourceObject> {
  const map = new Map<string, JsonApiResourceObject>()
  if (!Array.isArray(included)) return map

  included.forEach((entry) => {
    if (!isValidResourceObject(entry)) return
    map.set(`${entry.type}:${entry.id}`, entry)
  })

  return map
}

function getAsResourceObject(
  value: unknown,
  includedMap: Map<string, JsonApiResourceObject>
): JsonApiResourceObject | null {
  if (isValidResourceObject(value) && value.attributes) return value
  if (!isRecord(value)) return null

  const type = value.type
  const id = value.id
  if (typeof type !== "string" || (typeof id !== "string" && typeof id !== "number")) {
    return null
  }

  return includedMap.get(`${type}:${id}`) ?? ({
    type,
    id,
  } as JsonApiResourceObject)
}

export function resolveRelationData(
  relation:
    | JsonApiIdentifier
    | JsonApiIdentifier[]
    | JsonApiResourceObject
    | JsonApiResourceObject[]
    | null
    | undefined,
  includedMap: Map<string, JsonApiResourceObject>
): JsonApiResourceObject | JsonApiResourceObject[] | null {
  if (!relation) return null

  if (Array.isArray(relation)) {
    const list = relation
      .map((entry) => getAsResourceObject(entry, includedMap))
      .filter((entry): entry is JsonApiResourceObject => !!entry)

    return list
  }

  return getAsResourceObject(relation, includedMap)
}

export function readRelationshipData(
  resource: JsonApiResourceObject,
  relationKeys: string[]
):
  | JsonApiIdentifier
  | JsonApiIdentifier[]
  | JsonApiResourceObject
  | JsonApiResourceObject[]
  | null
  | undefined {
  const relationships = resource.relationships ?? {}
  for (const key of relationKeys) {
    const match = relationships[key]
    if (match && "data" in match) return match.data
  }
  return undefined
}

export function readAttribute(
  resource: JsonApiResourceObject,
  attributeKeys: string[]
): unknown {
  const attributes = resource.attributes ?? {}

  for (const key of attributeKeys) {
    if (Object.prototype.hasOwnProperty.call(attributes, key)) {
      return attributes[key]
    }
  }

  for (const key of attributeKeys) {
    if (Object.prototype.hasOwnProperty.call(resource, key)) {
      return resource[key]
    }
  }

  return undefined
}

export function toOptionalString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  const normalized = String(value).trim()
  return normalized.length ? normalized : null
}

export function toOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === "") return null
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  const text = String(value).trim().replace(",", ".")
  if (!text.length) return null
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : null
}

export function toOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") return undefined
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value === 1

  const text = String(value).trim().toLowerCase()
  if (["1", "true", "yes", "sim"].includes(text)) return true
  if (["0", "false", "no", "não"].includes(text)) return false
  return undefined
}

export function toMovementType(value: unknown): "IN" | "OUT" | null {
  if (!value) return null
  const normalized = String(value).trim().toUpperCase()
  if (normalized === "IN" || normalized === "OUT") {
    return normalized
  }
  return null
}

export function toRelationSummary(
  resource: JsonApiResourceObject | null
): {
  id: number
  type: string
  attributes: Record<string, unknown>
  raw: JsonApiResourceObject
} | null {
  if (!resource) return null

  const id = toOptionalNumber(resource.id)
  if (id === null || id === undefined) return null

  return {
    id,
    type: resource.type,
    attributes: (resource.attributes ?? {}) as Record<string, unknown>,
    raw: resource,
  }
}
