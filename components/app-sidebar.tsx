"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconListDetails,
  IconTruck,
  IconUsers,
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
      icon: IconDashboard,
    },
    {
      title: "Colaboradores",
      url: "/colaboradores",
      icon: IconListDetails,
    },
    {
      title: "Ferramentas",
      url: "/ferramentas",
      icon: IconChartBar,
    },
    {
      title: "Fornecedores",
      url: "/fornecedores",
      icon: IconTruck,
    },
    {
      title: "Centro de Custos",
      url: "/centro-de-custos",
      icon: IconFolder,
    },
    {
      title: "Entrada/Saída",
      url: "/entrada-saida",
      icon: IconUsers,
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  const fallbackUser = {
    name: "Usuário",
    email: "usuario@email.com",
    avatar: "",
  }

  const resolvedUser = useAuthUser(fallbackUser)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <div className="h-24 w-full flex items-center justify-center" aria-label="Logz Tech Logo">
                {/* Logo claro (aparece no tema claro) */}
                <Image
                  src={logoLight}
                  alt="Logz Tech Logo (light)"
                  className="h-24 w-auto dark:hidden"
                  loading="lazy"
                  decoding="async"
                />
                {/* Logo escuro (aparece no tema escuro) */}
                <Image
                  src={logoDark}
                  alt="Logz Tech Logo (dark)"
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
        <NavMain items={sidebarData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
