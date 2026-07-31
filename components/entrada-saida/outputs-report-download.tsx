"use client"

import * as React from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  COMPONENT_OUTPUTS_REPORT_PERIOD_OPTIONS,
  type ComponentOutputsReportPeriod,
} from "@/resources/Report/component-outputs-report.resource"
import {
  getContentDisposition,
  saveComponentOutputsReport,
} from "@/services/component-outputs-report-download"
import { inventoryApiClient } from "@/services/inventory-api.client"

function resolveErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error
  if (typeof error !== "object" || error === null) {
    return "Não foi possível gerar o relatório de saídas."
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
    : "Não foi possível gerar o relatório de saídas."
}

export function OutputsReportDownload() {
  const [period, setPeriod] =
    React.useState<ComponentOutputsReportPeriod>("7_days")
  const [isDownloading, setIsDownloading] = React.useState(false)
  const downloadInProgressRef = React.useRef(false)

  const handleDownload = React.useCallback(async () => {
    if (downloadInProgressRef.current) return

    downloadInProgressRef.current = true
    setIsDownloading(true)

    const toastId = "download-component-outputs-report"
    toast.loading("Gerando relatório...", { id: toastId })

    try {
      const response =
        await inventoryApiClient.downloadComponentOutputsReport(period)

      saveComponentOutputsReport(
        response.data,
        getContentDisposition(response.headers)
      )
      toast.success("Relatório de saídas gerado.", { id: toastId })
    } catch (error: unknown) {
      toast.error(resolveErrorMessage(error), { id: toastId })
    } finally {
      downloadInProgressRef.current = false
      setIsDownloading(false)
    }
  }, [period])

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="component-outputs-report-period" className="sr-only">
        Período do relatório
      </Label>
      <Select
        value={period}
        disabled={isDownloading}
        onValueChange={(value) =>
          setPeriod(value as ComponentOutputsReportPeriod)
        }
      >
        <SelectTrigger
          id="component-outputs-report-period"
          size="sm"
          className="w-[130px]"
          aria-label="Período do relatório"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COMPONENT_OUTPUTS_REPORT_PERIOD_OPTIONS.map((option) => (
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
        {isDownloading ? "Gerando..." : "Gerar relatório"}
      </Button>
    </div>
  )
}
