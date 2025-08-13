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

import { useTheme } from "next-themes"

export const sidebarData = {
  user: {
    name: "felipe.paes",
    email: "felippe@logztech.com.br",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      items: [
        { title: "Análise por Ferramentas",  url: "/dashboard/analise-por-ferramenta" },
        { title: "Análise por Operadores",         url: "/dashboard/analise-por-operador" },
        { title: "Análise por Centros de Custo",     url: "/dashboard/analise-por-centro-de-custo" },
      ],
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
  const { resolvedTheme } = useTheme()

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Image
                src={resolvedTheme && resolvedTheme == "dark" ? logoDark : logoLight}
                alt="Logz Tech Logo"
                className="h-24"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
