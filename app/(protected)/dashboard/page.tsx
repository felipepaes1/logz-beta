"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { PageSpinner } from "@/components/ui/page-spinner"

const SectionCards = dynamic(
  () => import("@/components/section-cards").then((m) => m.SectionCards),
  { suspense: true }
)
const ChartLineMultiple = dynamic(
  () =>
    import("@/components/graficos/chart-line-multiple").then(
      (m) => m.ChartLineMultiple
    ),
  { suspense: true }
)
const SectionGraphCards = dynamic(
  () =>
    import("@/components/section-graph-cards").then(
      (m) => m.SectionGraphCards
    ),
  { suspense: true }
)

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <React.Suspense fallback={<PageSpinner />}>
            <SectionCards />
          </React.Suspense>
          <div className="px-4 lg:px-6">
            <React.Suspense fallback={<PageSpinner />}>
              <ChartLineMultiple />
            </React.Suspense>
          </div>
          <React.Suspense fallback={<PageSpinner />}>
            <SectionGraphCards />
          </React.Suspense>
        </div>
      </div>
    </div>
  )
}
