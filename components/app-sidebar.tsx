"use client"

import * as React from "react"
import {
  IconTruck,
  IconUsers,
  IconTool,
  IconTimeline,
  IconArrowsSort,
  IconBuildingFactory2,
  IconListCheck,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import Image from "next/image"
import logoDark from "@/assets/logo-logz-dark.svg"
import logoLight from "@/assets/logo-logz-light.svg"
import { useAuthUser } from "@/hooks/use-auth-user"

export const sidebarData = {
  navMain: [
    {
      title: "Panorama geral",
      url: "/dashboard",
      icon: IconTimeline,
    },
    {
      title: "Colaboradores",
      url: "/colaboradores",
      icon: IconUsers,
    },
    {
      title: "Ferramentas",
      url: "/ferramentas",
      icon: IconTool,
    },
    {
      title: "Fornecedores",
      url: "/fornecedores",
      icon: IconTruck,
    },
    {
      title: "Centro de Custos",
      url: "/centro-de-custos",
      icon: IconBuildingFactory2,
    },
        {
      title: "Ordens de Produção",
      url: "/ordens-de-producao",
      icon: IconListCheck,
    },
    {
      title: "Entrada/Saída",
      url: "/entrada-saida",
      icon: IconArrowsSort,
    },
    {
      title: "Matéria-prima e Consumíveis",
      url: "/materia-prima-e-consumiveis",
      icon: IconArrowsSort,
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  const fallbackUser = {
    name: "Usuário",
    email: "usuario@email.com",
    avatar: "",
    role_id: null,
    tenant_id: null,
  }

  const resolvedUser = useAuthUser(fallbackUser)
  const navItems = React.useMemo(() => {
    let items = sidebarData.navMain

    if (resolvedUser.tenant_id !== 4) {
      items = items.filter(
        (item) => item.url !== "/materia-prima-e-consumiveis"
      )
    }

    if (resolvedUser.role_id === 5) {
      const allowed = new Set(["/ordens-de-producao", "/entrada-saida"])
      return items.filter((item) => item.url && allowed.has(item.url))
    }

    return items
  }, [resolvedUser.role_id, resolvedUser.tenant_id])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <div className="h-24 w-full flex items-center justify-center" aria-label="Log Z Tech Logo">
                {/* Logo claro (aparece no tema claro) */}
                <Image
                  src={logoLight}
                  alt="Log Z Tech Logo (light)"
                  className="h-24 w-auto dark:hidden"
                  loading="lazy"
                  decoding="async"
                />
                {/* Logo escuro (aparece no tema escuro) */}
                <Image
                  src={logoDark}
                  alt="Log Z Tech Logo (dark)"
                  className="h-24 w-auto hidden dark:block"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
