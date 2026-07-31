"use client"

import * as React from "react"
import Image from "next/image"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { IconPhotoOff, IconX } from "@tabler/icons-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buildAttachmentMediaUrl } from "@/resources/Attachment/attachment.resourse"
import type { ItemResource } from "@/resources/Item/item.resource"

type ToolThumbnailProps = {
  name: string
  resource?: ItemResource
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

export function ToolThumbnail({ name, resource }: ToolThumbnailProps) {
  const { thumbnailUrl, previewUrl } = getPhotoUrls(resource)
  const [previewLoaded, setPreviewLoaded] = React.useState(false)
  const [previewFailed, setPreviewFailed] = React.useState(false)
  const label = thumbnailUrl
    ? `Foto da ferramenta ${name}`
    : `Sem foto cadastrada para ${name}`

  const thumbnail = (
    <Avatar
      aria-label={label}
      title={label}
      className="size-10 rounded-lg border bg-muted/40 shadow-xs"
    >
      {thumbnailUrl ? (
        <AvatarImage
          src={thumbnailUrl}
          alt={label}
          loading="lazy"
          decoding="async"
          className="object-cover transition-transform duration-200 group-hover:scale-105"
        />
      ) : null}
      <AvatarFallback className="rounded-lg text-muted-foreground">
        <IconPhotoOff aria-hidden size={17} stroke={1.6} />
      </AvatarFallback>
    </Avatar>
  )

  if (!previewUrl) return thumbnail

  return (
    <DialogPrimitive.Root
      onOpenChange={(open) => {
        if (open) {
          setPreviewLoaded(false)
          setPreviewFailed(false)
        }
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
            {!previewLoaded && !previewFailed ? (
              <div
                aria-hidden
                className="absolute inset-4 animate-pulse rounded-lg bg-muted sm:inset-6"
              />
            ) : null}

            {previewFailed ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <IconPhotoOff aria-hidden size={34} stroke={1.5} />
                <span className="text-sm">Não foi possível carregar a foto.</span>
              </div>
            ) : (
              <Image
                src={previewUrl}
                alt={`Foto ampliada da ferramenta ${name}`}
                fill
                unoptimized
                sizes="(max-width: 1024px) 90vw, 1024px"
                onLoad={() => setPreviewLoaded(true)}
                onError={() => setPreviewFailed(true)}
                className={`object-contain p-4 transition-opacity duration-200 sm:p-6 ${
                  previewLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
