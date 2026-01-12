"use client"

import React from "react"
import { toast } from "sonner"

import {
  DashboardPanoramaAttributes,
  DashboardPanoramaResource,
} from "@/resources/Dashboard/dashboard.resource"

type DateRangeParams = { date_from?: string | null; date_to?: string | null }
type DashboardPanoramaContextValue = {
  data: DashboardPanoramaAttributes | null
  loading: boolean
  range: { from?: string | null; to?: string | null }
  availableMonths: string[]
  applyRange: (params: DateRangeParams) => Promise<void>
  refresh: () => Promise<void>
  lastUpdatedAt?: string | null
  hasData: boolean
}

const DashboardPanoramaContext = React.createContext<
  DashboardPanoramaContextValue | undefined
>(undefined)

function normalizeDateInput(value?: string | null) {
  const raw = (value ?? "").trim()
  return raw.length ? raw : null
}

function monthKey(value?: string | null) {
  if (!value) return null
  const sanitized = value.trim().slice(0, 7)
  const [y, m] = sanitized.split("-").map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null
  const mm = String(m).padStart(2, "0")
  return `${String(y).padStart(4, "0")}-${mm}`
}

function monthSorter(a: string, b: string) {
  return new Date(`${a}-01`).getTime() - new Date(`${b}-01`).getTime()
}

export function DashboardPanoramaProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [data, setData] = React.useState<DashboardPanoramaAttributes | null>(
    null
  )
  const [loading, setLoading] = React.useState(true)
  const [range, setRange] = React.useState<{ from?: string | null; to?: string | null }>({})
  const dataRef = React.useRef<DashboardPanoramaAttributes | null>(null)
  const lastParamsKeyRef = React.useRef<string>("__none__")
  const lastParamsRef = React.useRef<DateRangeParams>({})
  const requestIdRef = React.useRef(0)

  const fetchPanorama = React.useCallback(
    async (params: DateRangeParams = {}) => {
      const normalized = {
        date_from: normalizeDateInput(params.date_from),
        date_to: normalizeDateInput(params.date_to),
      }
      const requestParams: DateRangeParams = {}
      if (normalized.date_from) requestParams.date_from = normalized.date_from
      if (normalized.date_to) requestParams.date_to = normalized.date_to
      const key = JSON.stringify(normalized)

      const cachedData = dataRef.current
      if (key === lastParamsKeyRef.current && cachedData) {
        setRange({
          from: cachedData.period?.from ?? normalized.date_from ?? null,
          to: cachedData.period?.to ?? normalized.date_to ?? null,
        })
        return cachedData
      }

      const myRequestId = ++requestIdRef.current
      setLoading(true)
      try {
        const res = await DashboardPanoramaResource.panorama(requestParams)
        if (myRequestId !== requestIdRef.current) return res
        setData(res)
        setRange({
          from: res?.period?.from ?? normalized.date_from ?? null,
          to: res?.period?.to ?? normalized.date_to ?? null,
        })
        lastParamsKeyRef.current = key
        lastParamsRef.current = normalized
        return res
      } catch (err: unknown) {
        const typedErr = err as { response?: { status?: number }; axiosResponse?: { status?: number } }
        if (myRequestId === requestIdRef.current) {
          const status = typedErr?.response?.status ?? typedErr?.axiosResponse?.status
          const message =
            status === 422
              ? "Intervalo de datas inválido. Ajuste o período e tente novamente."
              : "Não foi possível carregar o panorama do dashboard."
          toast.error(message)
        }
        return null
      } finally {
        if (myRequestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    []
  )

  React.useEffect(() => {
    dataRef.current = data
  }, [data])

  const applyRange = React.useCallback(
    async (params: DateRangeParams) => {
      const normalized = {
        date_from: normalizeDateInput(params.date_from),
        date_to: normalizeDateInput(params.date_to),
      }

      const fromDate = normalized.date_from
        ? new Date(normalized.date_from)
        : null
      const toDate = normalized.date_to ? new Date(normalized.date_to) : null

      if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
        toast.error("A data final deve ser igual ou posterior à data inicial.")
        return
      }

      await fetchPanorama(normalized)
    },
    [fetchPanorama]
  )

  const refresh = React.useCallback(async () => {
    await fetchPanorama(lastParamsRef.current)
  }, [fetchPanorama])

  React.useEffect(() => {
    fetchPanorama({}).catch(() => {})
  }, [fetchPanorama])

  const availableMonths = React.useMemo(() => {
    const months =
      data?.filters?.available_months ??
      data?.period?.months ??
      []
    const normalized = months
      .map(monthKey)
      .filter(Boolean) as string[]
    const unique = Array.from(new Set(normalized))
    return unique.sort(monthSorter)
  }, [data])

  const hasData = React.useMemo(() => {
    if (!data) return false
    const hasSeries = (data.series?.consumo_x_compras ?? []).length > 0
    const hasCards =
      (data.cards?.compras?.total ?? 0) > 0 ||
      (data.cards?.consumos?.total ?? 0) > 0 ||
      (data.cards?.estoque_sem_movimentacao?.total ?? 0) > 0
    const hasTops = (data.tops_mes_atual?.items_top5 ?? []).length > 0
    return hasSeries || hasCards || hasTops
  }, [data])

  const ctxValue = React.useMemo(
    () => ({
      data,
      loading,
      range,
      availableMonths,
      applyRange,
      refresh,
      lastUpdatedAt: data?.generated_at ?? null,
      hasData,
    }),
    [applyRange, availableMonths, data, hasData, loading, range, refresh]
  )

  return (
    <DashboardPanoramaContext.Provider value={ctxValue}>
      {children}
    </DashboardPanoramaContext.Provider>
  )
}

export function useDashboardPanorama() {
  const ctx = React.useContext(DashboardPanoramaContext)
  if (!ctx) {
    throw new Error(
      "useDashboardPanorama deve ser usado dentro de DashboardPanoramaProvider"
    )
  }
  return ctx
}
