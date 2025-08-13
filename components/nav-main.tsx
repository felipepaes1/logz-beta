"use client"

import { type Icon } from "@tabler/icons-react"

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

type Item = {
  title: string
  url?: string
  icon?: Icon
  items?: Item[]    
}

export function NavMain({ items }: { items: Item[] }) {
  const pathname = usePathname()

  const renderItem = (item: Item) =>
    item.items ? (
      <Collapsible
        key={item.title}
        defaultOpen
        className="w-full"
      >
         <CollapsibleTrigger asChild>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith(item.url ?? "")}>
              <Link href={item.url ?? "#"} className="flex items-center gap-2">
                {item.icon && <item.icon className="h-4 w-4" />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </CollapsibleTrigger>

        <CollapsibleContent asChild>
          <SidebarMenu className="pl-4">
            {item.items.map(renderItem)}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    ) : (
      /* -------- Item SIMPLES -------- */
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={pathname === item.url}>
          <Link href={item.url ?? "#"} className="flex items-center gap-2">
            {item.icon && <item.icon className="h-4 w-4" />}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>{items.map(renderItem)}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
