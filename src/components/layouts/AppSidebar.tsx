"use client"

import * as React from "react"

import { NavMain } from "@/components/layouts/NavMain"
import { AppLogo } from "@/components/layouts/AppLogo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/Sidebar"
import {
  LayoutDashboardIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Admin",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: <UsersIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              {/* The logo carries its own dark tile; the ring keeps it
                  visible against the sidebar in dark mode. size-8! overrides
                  the menu button's blanket [&_svg]:size-4 rule. */}
              <AppLogo className="size-8! shrink-0 rounded-lg ring-1 ring-sidebar-border/60" />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">CRM Dashboard</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Admin" className="pointer-events-none">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <UserIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{data.user.name}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
