"use client"

import * as React from "react"
import { Drawer, DrawerTrigger } from "@/components/ui/drawer"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent
} from "@/components/ui/tabs"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { IconChevronsLeft, IconChevronLeft, IconChevronRight, IconChevronsRight } from "@tabler/icons-react"

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
})

type SearchableColumnConfig<T> = {
  id: keyof T & string | string
  label?: string
  getValue?: (row: T) => unknown
}

type NormalizedSearchColumn<T> = {
  id: string
  label: string
  getValue?: (row: T) => unknown
}

function formatList(values: string[]) {
  if (values.length === 0) return ""
  if (values.length === 1) return values[0]
  if (values.length === 2) return `${values[0]} e ${values[1]}`
  return `${values.slice(0, -1).join(", ")}, e ${values[values.length - 1]}`
}

function toSearchableString(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "bigint") return value.toString()
  if (typeof value === "boolean") return value ? "true" : "false"
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(toSearchableString).filter(Boolean).join(" ")
  return String(value)
}

function normalizeSearch(value: unknown) {
  return toSearchableString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function DraggableRow<T extends { id: number }>({
  row,
  withDragHandle = false,
}: {
  row: Row<T>
  withDragHandle?: boolean
}) {
  const {
    transform,
    transition,
    setNodeRef,
    isDragging,
    attributes,
    listeners,
  } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {withDragHandle && (
        <TableCell className="w-8 p-0 align-middle">
          <button
            type="button"
            aria-label="Reordenar linha"
            className="flex h-8 w-8 items-center justify-center cursor-grab touch-none"
            {...attributes}
            {...listeners}
            data-dragging={isDragging}
          >
            <GripVertical className="h-4 w-4 opacity-60" />
          </button>
        </TableCell>
      )}
      {row.getVisibleCells().map((cell) => {
        const meta = (cell.column.columnDef.meta as any) || {}
        const shouldTruncate = !!meta.truncate
        const content = flexRender(cell.column.columnDef.cell, cell.getContext())
        return (
          <TableCell key={cell.id} className={cn(meta.className)} style={meta.style}>
            {shouldTruncate ? (
              <div className="truncate" title={typeof cell.getValue?.() === "string" ? (cell.getValue() as string) : undefined}>
                {content}
              </div>
            ) : (
              content
            )}
          </TableCell>
        )
      })}
    </TableRow>
  )
}

export function DataTable<T extends { id: number }>({
  data,
  columns,
  addButtonLabel = "Adicionar",
  renderAddForm,
  headerActions,
  onDataChange,
  isLoading = false,
  withDragHandle = false,
  searchableColumns,
  searchPlaceholder,
  emptyMessage = "Nenhum registro encontrado.",
}: {
  data: T[]
  columns: ColumnDef<T>[]
  addButtonLabel?: string
  renderAddForm?: React.ReactNode
  headerActions?: React.ReactNode
  onDataChange?: (rows: T[]) => void
  isLoading?: boolean
  withDragHandle?: boolean
  searchableColumns?: SearchableColumnConfig<T>[]
  searchPlaceholder?: string
  emptyMessage?: string
}) {

  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, {})
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const [addOpen, setAddOpen] = React.useState(false)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const addFocusRestoreRef = React.useRef<HTMLButtonElement>(null)

  const renderAddFormWithClose = React.useMemo(() => {
    if (!renderAddForm) return null
    if (React.isValidElement(renderAddForm)) {
      return React.cloneElement(renderAddForm, {
        onRequestClose: () => {
          setAddOpen(false)
          requestAnimationFrame(() => addFocusRestoreRef.current?.focus())
        },
      } as any)
    }
    return renderAddForm
  }, [renderAddForm])

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const normalizedSearchColumns = React.useMemo<NormalizedSearchColumn<T>[]>(() => {
    if (!searchableColumns?.length) return []
    const seen = new Set<string>()
    return searchableColumns
      .map((column) => {
        const columnId = String(column.id)
        if (!columnId.trim()) return null
        if (seen.has(columnId)) return null
        seen.add(columnId)
        return {
          id: columnId,
          label: column.label ?? columnId,
          getValue: column.getValue,
        }
      })
      .filter((column): column is NormalizedSearchColumn<T> => !!column)
  }, [searchableColumns])

  const hasSearch = normalizedSearchColumns.length > 0

  const searchPlaceholderText = React.useMemo(() => {
    if (searchPlaceholder) return searchPlaceholder
    if (!hasSearch) return "Buscar..."
    const labels = normalizedSearchColumns.map((column) => column.label)
    return `Buscar por ${formatList(labels)}`
  }, [normalizedSearchColumns, searchPlaceholder])

  const searchAriaLabel = React.useMemo(() => {
    if (!hasSearch) return "Buscar"
    const labels = normalizedSearchColumns.map((column) => column.label)
    return `Buscar por ${formatList(labels)}`
  }, [hasSearch, normalizedSearchColumns])

  const globalFilterFn = React.useCallback<FilterFn<T>>(
    (row, _columnId, filterValue) => {
      if (!hasSearch) return true
      const normalizedTokens = normalizeSearch(filterValue)
        .split(/\s+/)
        .filter(Boolean)
      if (!normalizedTokens.length) return true

      const values = normalizedSearchColumns
        .map((column) => {
          const rawValue = (() => {
            if (column.getValue) {
              return column.getValue(row.original)
            }

            const fromOriginal = (row.original as any)?.[column.id]
            if (fromOriginal !== undefined && fromOriginal !== null && fromOriginal !== "") {
              return fromOriginal
            }

            if (typeof (row as any)?.getValue === "function") {
              try {
                const value = row.getValue(column.id as any)
                if (value !== undefined && value !== null && value !== "") {
                  return value
                }
              } catch {

              }
            }

            if (typeof (row as any)?.getAllCells === "function") {
              const cell = row.getAllCells().find((cell: any) => cell.column?.id === column.id)
              if (cell) {
                const cellValue = cell.getValue?.()
                if (cellValue !== undefined && cellValue !== null && cellValue !== "") {
                  return cellValue
                }
              }
            }

            return undefined
          })()

          if (rawValue === undefined || rawValue === null || rawValue === "") {
            return ""
          }

          return normalizeSearch(rawValue)
        })
        .filter(Boolean)

      if (!values.length) return false
      return normalizedTokens.every((token) =>
        values.some((value) => value.includes(token))
      )
    },
    [hasSearch, normalizedSearchColumns]
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination, globalFilter },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: normalizedSearchColumns.length ? globalFilterFn : undefined,
  })

  const handleSearchChange = React.useCallback(
    (value: string) => {
      setGlobalFilter(value)
      table.setPageIndex(0)
    },
    [table]
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!onDataChange) return
    if (active && over && active.id !== over.id) {
      const oldIndex = dataIds.indexOf(active.id)
      const newIndex = dataIds.indexOf(over.id)
      const newData = arrayMove(data, oldIndex, newIndex)
      onDataChange(newData)
    }
  }

  const extraColCount = withDragHandle ? 1 : 0

  return (
    
    <Tabs defaultValue="outline" className="w-full flex-col justify-start gap-6">
      <div
        className={cn(
          "flex flex-col gap-2 px-4 lg:flex-row lg:items-center lg:gap-4 lg:px-6",
          !hasSearch && "lg:justify-end"
        )}
      >
        {hasSearch ? (
          <div className="w-full lg:w-auto lg:flex-1">
            <Input
              type="search"
              value={globalFilter}
              placeholder={searchPlaceholderText}
              aria-label={searchAriaLabel}
              onChange={(event) => handleSearchChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && globalFilter) {
                  event.preventDefault()
                  handleSearchChange("")
                }
              }}
              className="max-w-full"
            />
          </div>
        ) : (
          <span className="sr-only">Table header</span>
        )}

        <div className="flex w-full items-center justify-end gap-2 lg:w-auto">
          {headerActions ?? (
            renderAddForm ? (
              <>
                <button
                  ref={addFocusRestoreRef}
                  tabIndex={-1}
                  aria-hidden
                  className="sr-only"
                />
                <Drawer open={addOpen} onOpenChange={setAddOpen} direction="right">
                  <DrawerTrigger asChild>
                    <Button size="sm" variant="outline">{addButtonLabel}</Button>
                  </DrawerTrigger>
                  {/* renderiza o form exatamente como foi passado */}
                  {addOpen ? renderAddFormWithClose : null}
                </Drawer>
              </>
            ) : null
          )}
        </div>
      </div>

      <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            autoScroll={false}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {withDragHandle && <TableHead aria-hidden className="w-8 p-0" />}
                    {headerGroup.headers.map((header) => {
                      const meta = (header.column.columnDef.meta as any) || {}
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan} className={cn(meta.className)} style={meta.style}>
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="data-[slot=table-body]:[&>*]:data-[slot=table-cell]:first:w-8">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      {Array.from({ length: columns.length + extraColCount }).map((__, j) => (
                        <TableCell key={`sk-cell-${j}`}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length ? (
                  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow
                        key={row.id}
                        row={row}
                        withDragHandle={withDragHandle}
                      />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length + extraColCount} className="h-24 text-center text-sm text-muted-foreground">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} linha(s) selecionadas.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">Linhas por página</Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
              </div>

              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Ir para a primeira página</span>
                  <IconChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Ir para a página anterior</span>
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Ir para a próxima página</span>
                  <IconChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(Math.max(0, table.getPageCount() - 1))}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Ir para a última página</span>
                  <IconChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
           
          </div>
        </div>
      </TabsContent>

      <TabsContent value="past-performance" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="focus-documents" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}
