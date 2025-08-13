"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

type Mark = {
  value: number
  label?: string
  className?: string
  variant?: "dot" | "line"
}

type Segment = {
  from: number
  to: number
  className?: string
}

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  rangeClassName?: string
  marks?: Mark[]
  segments?: Segment[]
  showMarkLabels?: boolean
}

function Slider({
  className,
  rangeClassName,
  defaultValue,
  value,
  min = 0,
  max = 100,
  marks,
  segments,
  showMarkLabels = false,
  ...props
}: SliderProps) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  const pct = React.useCallback(
    (v: number) => {
      const clamped = Math.min(Math.max(v, min), max)
      const span = max - min || 1
      return ((clamped - min) / span) * 100
    },
    [min, max]
  )

  return (
    <div className="relative w-full">
      <SliderPrimitive.Root
        data-slot="slider"
        defaultValue={defaultValue}
        value={value}
        min={min}
        max={max}
        className={cn(
          "relative flex w-full touch-none items-center select-none data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
          )}
        >
          {/* Segmentos */}
          {segments?.map((s, i) => {
            const left = pct(s.from)
            const width = Math.max(pct(s.to) - left, 0)
            return (
              <div
                key={`seg-${i}`}
                aria-hidden
                className={cn(
                  "absolute inset-y-0 z-0 pointer-events-none",
                  s.className ?? "bg-foreground/10"
                )}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            )
          })}

          <SliderPrimitive.Range
            data-slot="slider-range"
            className={cn(
              "absolute z-10 data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
              rangeClassName ?? "bg-primary"
            )}
          />

          {/* Marcas */}
          {marks?.map((m, i) => {
            const left = pct(m.value)
            const variant = m.variant ?? "line"
            const base =
              variant === "dot"
                ? "size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                : "w-px h-2 -translate-x-1/2 -translate-y-1/2"
            return (
              <span
                key={`mark-${i}-${m.value}`}
                aria-hidden
                className={cn(
                  "absolute top-1/2 z-20 pointer-events-none bg-foreground/60",
                  base,
                  m.className
                )}
                style={{ left: `${left}%` }}
                title={m.label}
              />
            )
          })}
        </SliderPrimitive.Track>

        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-30 block size-4 shrink-0 rounded-full",
              "bg-gray-400 border border-gray",
              "shadow-none ring-0 hover:ring-0 focus-visible:ring-0 opacity-100"
            )}
          />
        ))}
      </SliderPrimitive.Root>

      {showMarkLabels && marks?.length ? (
        <div className="relative mt-2 h-4">
          {marks.map((m, i) => (
            <span
              key={`mark-label-${i}-${m.value}`}
              className={cn(
                "absolute -translate-x-1/2 text-[10px] text-muted-foreground",
                m.value === 100 ? "ml-2" : ""
              )}
              style={{ left: `${pct(m.value)}%` }}
            >
              {m.label ?? `${m.value}`}
            </span>
              ))}
            </div>
            ) : null}
    </div>
  )
}

export { Slider }
