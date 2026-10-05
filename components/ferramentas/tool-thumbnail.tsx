"use client"

/* Native img is intentional: it preserves browser lazy loading and supports
 * the authenticated blob fallback for protected attachment endpoints. */
/* eslint-disable @next/next/no-img-element */

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { IconPhotoOff, IconX } from "@tabler/icons-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { buildAttachmentMediaUrl } from "@/resources/Attachment/attachment.resourse"
import type { ItemResource } from "@/resources/Item/item.resource"

type ToolThumbnailProps = {
  name: string
  resource?: ItemResource
}

type ImageStatus = "empty" | "loading" | "loaded" | "retrying" | "error"

type ImageState = {
  resolvedSrc: string
  status: ImageStatus
}

type CachedMedia = {
  promise: Promise<Blob | null>
  lastUsedAt: number
}

const MAX_AUTHENTICATED_MEDIA_CACHE_ENTRIES = 50
const authenticatedMediaCache = new Map<string, CachedMedia>()

const getBrowserAuthToken = () => {
  if (typeof window === "undefined") return ""

  const directToken = window.localStorage.getItem("@token")
  if (directToken && directToken !== "undefined") return directToken

  const userResponse = window.localStorage.getItem("@user_response")
  if (userResponse) {
    try {
      const parsed = JSON.parse(userResponse)
      const token = parsed?.axiosResponse?.data?.data?.attributes?.token
      if (token) return String(token)
    } catch {
      // The cookie fallback below is enough when the local response is stale.
    }
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("token="))

  return cookie ? decodeURIComponent(cookie.slice("token=".length)) : ""
}

const fetchAuthenticatedMedia = async (url: string): Promise<Blob | null> => {
  const token = getBrowserAuthToken()

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        credentials: "same-origin",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (response.ok) {
        const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""
        if (!contentType || contentType.startsWith("image/")) {
          return await response.blob()
        }
      }
    } catch {
      // A second attempt handles short-lived connection failures.
    }

    if (attempt === 0) {
      await new Promise((resolve) => window.setTimeout(resolve, 150))
    }
  }

  return null
}

const getAuthenticatedMedia = (url: string) => {
  const cached = authenticatedMediaCache.get(url)
  if (cached) {
    cached.lastUsedAt = Date.now()
    return cached.promise
  }

  const promise = fetchAuthenticatedMedia(url).then((blob) => {
    if (!blob && authenticatedMediaCache.get(url)?.promise === promise) {
      authenticatedMediaCache.delete(url)
    }
    return blob
  })

  authenticatedMediaCache.set(url, { promise, lastUsedAt: Date.now() })

  if (authenticatedMediaCache.size > MAX_AUTHENTICATED_MEDIA_CACHE_ENTRIES) {
    const oldestEntry = [...authenticatedMediaCache.entries()].sort(
      ([, left], [, right]) => left.lastUsedAt - right.lastUsedAt
    )[0]
    if (oldestEntry) authenticatedMediaCache.delete(oldestEntry[0])
  }

  return promise
}

function useResilientImage(src: string, reloadKey = 0) {
  const objectUrlRef = React.useRef<string | null>(null)
  const requestIdRef = React.useRef(0)
  const fallbackAttemptedRef = React.useRef(false)
  const [state, setState] = React.useState<ImageState>(() => ({
    resolvedSrc: src,
    status: src ? "loading" : "empty",
  }))

  React.useEffect(() => {
    const requestId = ++requestIdRef.current
    fallbackAttemptedRef.current = false

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    setState({
      resolvedSrc: src,
      status: src ? "loading" : "empty",
    })

    return () => {
      if (requestIdRef.current === requestId) requestIdRef.current += 1
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [src, reloadKey])

  const handleLoad = React.useCallback(() => {
    setState((current) => ({ ...current, status: "loaded" }))
  }, [])

  const handleError = React.useCallback(() => {
    if (!src) return

    if (fallbackAttemptedRef.current) {
      setState((current) => ({ ...current, status: "error" }))
      return
    }

    fallbackAttemptedRef.current = true

    const requestId = requestIdRef.current
    setState((current) => ({ ...current, status: "retrying" }))

    void getAuthenticatedMedia(src).then((blob) => {
      if (requestIdRef.current !== requestId) return

      if (!blob) {
        setState((current) => ({ ...current, status: "error" }))
        return
      }

      const objectUrl = URL.createObjectURL(blob)
      objectUrlRef.current = objectUrl
      setState({ resolvedSrc: objectUrl, status: "loading" })
    })
  }, [src])

  return { ...state, handleLoad, handleError }
}

const getAvatarRelation = (resource?: ItemResource) =>
  resource?.getRelation?.("avatar") ??
  resource?.getAttribute?.("avatar") ??
  null

const getPhotoUrls = (resource?: ItemResource) => {
  const avatar = getAvatarRelation(resource)
  if (!avatar) return { thumbnailUrl: "", previewUrl: "" }

  const thumbnailUrl = avatar.getThumbnailUrl?.()
  const previewUrl = avatar.getPreviewUrl?.()

  const token =
    avatar.getToken?.() ??
    avatar.getAttribute?.("token") ??
    avatar.attributes?.token ??
    avatar.token ??
    null

  return {
    thumbnailUrl:
      thumbnailUrl || buildAttachmentMediaUrl(token, "thumbnail"),
    previewUrl:
      previewUrl || buildAttachmentMediaUrl(token, "preview"),
  }
}

function ToolThumbnailComponent({ name, resource }: ToolThumbnailProps) {
  const { thumbnailUrl, previewUrl } = getPhotoUrls(resource)
  const [previewReloadKey, setPreviewReloadKey] = React.useState(0)
  const thumbnailImage = useResilientImage(thumbnailUrl)
  const previewImage = useResilientImage(previewUrl, previewReloadKey)
  const label = thumbnailUrl
    ? `Foto da ferramenta ${name}`
    : `Sem foto cadastrada para ${name}`

  const thumbnail = (
    <Avatar
      aria-label={label}
      title={label}
      className="size-10 rounded-lg border bg-muted/40 shadow-xs"
    >
      {thumbnailUrl && thumbnailImage.status !== "error" ? (
        <img
          src={thumbnailImage.resolvedSrc}
          alt={label}
          loading="lazy"
          decoding="async"
          onLoad={thumbnailImage.handleLoad}
          onError={thumbnailImage.handleError}
          className={`absolute inset-0 size-full object-cover transition-opacity transition-transform duration-200 group-hover:scale-105 ${
            thumbnailImage.status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}
      {thumbnailImage.status !== "loaded" ? (
        <AvatarFallback className="rounded-lg text-muted-foreground">
          <IconPhotoOff aria-hidden size={17} stroke={1.6} />
        </AvatarFallback>
      ) : null}
    </Avatar>
  )

  if (!previewUrl) return thumbnail

  return (
    <DialogPrimitive.Root
      onOpenChange={(open) => {
        if (open) setPreviewReloadKey((current) => current + 1)
      }}
    >
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={`Ampliar foto da ferramenta ${name}`}
          title="Clique para ampliar"
          className="group shrink-0 cursor-zoom-in rounded-lg outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {thumbnail}
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border bg-background shadow-2xl outline-none duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="flex h-14 items-center border-b px-5 pr-16">
            <DialogPrimitive.Title className="truncate text-sm font-semibold sm:text-base">
              {name}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Visualização ampliada da foto da ferramenta {name}.
            </DialogPrimitive.Description>
          </div>

          <DialogPrimitive.Close
            aria-label="Fechar visualização"
            className="absolute top-2.5 right-3 z-10 inline-flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <IconX aria-hidden size={21} />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>

          <div className="relative flex h-[70svh] max-h-[44rem] min-h-64 items-center justify-center bg-muted/30 p-4 sm:p-6">
            {previewImage.status !== "loaded" && previewImage.status !== "error" ? (
              <div
                aria-hidden
                className="absolute inset-4 animate-pulse rounded-lg bg-muted sm:inset-6"
              />
            ) : null}

            {previewImage.status === "error" ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <IconPhotoOff aria-hidden size={34} stroke={1.5} />
                <span className="text-sm">Não foi possível carregar a foto.</span>
              </div>
            ) : (
              <img
                src={previewImage.resolvedSrc}
                alt={`Foto ampliada da ferramenta ${name}`}
                loading="eager"
                decoding="async"
                onLoad={previewImage.handleLoad}
                onError={previewImage.handleError}
                className={`absolute inset-0 h-full w-full object-contain p-4 transition-opacity duration-200 sm:p-6 ${
                  previewImage.status === "loaded" ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export const ToolThumbnail = React.memo(ToolThumbnailComponent)
