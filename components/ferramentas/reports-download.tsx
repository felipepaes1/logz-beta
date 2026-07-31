"use client"

import * as React from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  STOCK_REPLENISHMENT_PERIOD_OPTIONS,
  type StockReplenishmentPeriod,
} from "@/resources/Report/stock-replenishment-report.resource"
import { inventoryApiClient } from "@/services/inventory-api.client"
import { saveStockReplenishmentReport } from "@/services/stock-replenishment-report-download"
import { saveToolPurchaseRequestReport } from "@/services/tool-purchase-request-report-download"
import { getContentDisposition } from "@/services/xlsx-report-download"

export const TOOL_REPORT_OPTIONS = [
  {
    label: "Relatório p/ Solicitação de Compra",
    value: "purchase_request",
  },
  {
    label: "Relatório de Reposição",
    value: "stock_replenishment",
  },
] as const

export type ToolReportType = (typeof TOOL_REPORT_OPTIONS)[number]["value"]

function resolveErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error
  if (typeof error !== "object" || error === null) {
    return "Não foi possível gerar o relatório."
  }

  const candidate = error as {
    message?: unknown
    response?: { data?: unknown }
  }
  const responseData = candidate.response?.data

  if (
    typeof responseData === "object" &&
    responseData !== null &&
    "message" in responseData &&
    typeof responseData.message === "string" &&
    responseData.message.trim()
  ) {
    return responseData.message
  }

  return typeof candidate.message === "string" && candidate.message.trim()
    ? candidate.message
    : "Não foi possível gerar o relatório."
}

export function ToolsReportsDownload() {
  const [reportType, setReportType] =
    React.useState<ToolReportType>("purchase_request")
  const [stockPeriod, setStockPeriod] =
    React.useState<StockReplenishmentPeriod>("daily")
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = React.useState(false)
  const [isDownloading, setIsDownloading] = React.useState(false)
  const downloadInProgressRef = React.useRef(false)

  const performDownload = React.useCallback(
    async (
      request: () => Promise<{
        data: Blob
        headers: Parameters<typeof getContentDisposition>[0]
      }>,
      save: (data: Blob, disposition: string | null) => void
    ): Promise<boolean> => {
      if (downloadInProgressRef.current) return false

      downloadInProgressRef.current = true
      setIsDownloading(true)

      const toastId = "download-tool-report"
      toast.loading("Gerando relatório...", { id: toastId })

      try {
        const response = await request()
        save(response.data, getContentDisposition(response.headers))

        toast.success("Relatório gerado.", { id: toastId })
        return true
      } catch (error: unknown) {
        toast.error(resolveErrorMessage(error), { id: toastId })
        return false
      } finally {
        downloadInProgressRef.current = false
        setIsDownloading(false)
      }
    },
    []
  )

  const handleDownload = React.useCallback(async () => {
    if (reportType === "stock_replenishment") {
      setIsPeriodDialogOpen(true)
      return
    }

    await performDownload(
      () => inventoryApiClient.downloadToolPurchaseRequestReport(),
      saveToolPurchaseRequestReport
    )
  }, [performDownload, reportType])

  const handleStockReplenishmentDownload = React.useCallback(async () => {
    const downloaded = await performDownload(
      () => inventoryApiClient.downloadStockReplenishmentReport(stockPeriod),
      saveStockReplenishmentReport
    )

    if (downloaded) {
      setIsPeriodDialogOpen(false)
    }
  }, [performDownload, stockPeriod])

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Label htmlFor="tool-report-type" className="sr-only">
          Tipo de relatório
        </Label>
        <Select
          value={reportType}
          disabled={isDownloading}
          onValueChange={(value) => setReportType(value as ToolReportType)}
        >
          <SelectTrigger
            id="tool-report-type"
            size="sm"
            className="w-[260px]"
            aria-label="Tipo de relatório"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TOOL_REPORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isDownloading}
          aria-busy={isDownloading}
          onClick={handleDownload}
        >
          {isDownloading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Download className="size-4" aria-hidden />
          )}
          {isDownloading ? "Gerando..." : "Gerar Relatórios"}
        </Button>
      </div>

      <AlertDialog
        open={isPeriodDialogOpen}
        onOpenChange={(open) => {
          if (!isDownloading) setIsPeriodDialogOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Relatório de Reposição</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione o período que será considerado no relatório.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-2 py-2">
            <Label htmlFor="stock-replenishment-period">Período</Label>
            <Select
              value={stockPeriod}
              disabled={isDownloading}
              onValueChange={(value) =>
                setStockPeriod(value as StockReplenishmentPeriod)
              }
            >
              <SelectTrigger
                id="stock-replenishment-period"
                aria-label="Período do relatório de reposição"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STOCK_REPLENISHMENT_PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDownloading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDownloading}
              onClick={(event) => {
                event.preventDefault()
                void handleStockReplenishmentDownload()
              }}
            >
              {isDownloading ? "Gerando..." : "Gerar relatório"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
