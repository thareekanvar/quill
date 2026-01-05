"use client"

import * as React from "react"
import { Database, Plus, CaretUpDown, CaretDown } from "@phosphor-icons/react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { getAllConnections } from "@/lib/db"
import type { ConnectionMetadata } from "@/types/database"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { AddConnectionModal } from "@/components/dashboard/add-connection-modal"

export function DatabaseSwitcher() {
  const { isMobile } = useSidebar()
  const { connectionId, password, login } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [connections, setConnections] = React.useState<ConnectionMetadata[]>([])
  const [activeConnection, setActiveConnection] = React.useState<ConnectionMetadata | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false)

  // Load connections on mount and when connectionId changes
  React.useEffect(() => {
    loadConnections()
  }, [])

  // Reload connections when connectionId changes (e.g., after adding a new connection)
  React.useEffect(() => {
    if (connectionId) {
      loadConnections()
    }
  }, [connectionId])

  // Update active connection when connectionId or connections change
  React.useEffect(() => {
    if (connectionId && connections.length > 0) {
      const active = connections.find(conn => conn.id === connectionId) || connections[0]
      setActiveConnection(active)
    } else if (connections.length > 0 && !connectionId) {
      // If no active connection but we have connections, set the first one
      setActiveConnection(connections[0])
    }
  }, [connectionId, connections])

  const loadConnections = async () => {
    try {
      setIsLoading(true)
      const allConnections = await getAllConnections()
      setConnections(allConnections)
      
      // Set active connection
      if (connectionId) {
        const active = allConnections.find(conn => conn.id === connectionId) || allConnections[0]
        setActiveConnection(active)
      } else if (allConnections.length > 0) {
        setActiveConnection(allConnections[0])
      }
    } catch (error) {
      console.error('Failed to load connections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectionSwitch = async (connection: ConnectionMetadata) => {
    if (connection.id === connectionId) {
      return // Already active
    }

    try {
      // Get the connection details (we need password to decrypt)
      const { getConnection } = await import('@/lib/db')
      if (!password) {
        // If no password in store, redirect to login
        router.push('/login')
        return
      }

      const decrypted = await getConnection(connection.id, password)
      if (!decrypted) {
        throw new Error('Failed to decrypt connection')
      }

      // Switch to the new connection
      login(connection.id, password)
      
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries()
      
      // Reload connections to update UI
      await loadConnections()
      
      // Refresh the page to reload all data
      router.refresh()
    } catch (error) {
      console.error('Failed to switch connection:', error)
      // If password is invalid, redirect to login
      router.push('/login')
    }
  }

  const handleAddConnection = () => {
    setIsAddModalOpen(true)
  }

  const handleAddConnectionSuccess = async (newConnectionId: string) => {
    // Reload connections list
    await loadConnections()
    
    // Optionally switch to the new connection
    // You can uncomment this if you want to auto-switch:
    // if (password) {
    //   login(newConnectionId, password)
    //   queryClient.invalidateQueries()
    //   router.refresh()
    // }
  }

  if (isLoading || !activeConnection) {
    return null
  }

  // Generate display name from connection
  const getDisplayName = (conn: ConnectionMetadata) => {
    return conn.name || `Connection ${conn.id.slice(-8)}`
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Database className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {getDisplayName(activeConnection)}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {connections.length} {connections.length === 1 ? 'connection' : 'connections'}
                </span>
              </div>
              <CaretDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Databases
            </DropdownMenuLabel>
            {connections.map((connection, index) => (
              <DropdownMenuItem
                key={connection.id}
                onClick={() => handleConnectionSwitch(connection)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Database className="size-3.5 shrink-0" />
                </div>
                {getDisplayName(connection)}
                {connection.id === connectionId && (
                  <DropdownMenuShortcut>✓</DropdownMenuShortcut>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2" onClick={handleAddConnection}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-3.5 shrink-0" />
              </div>
              <div className="text-muted-foreground font-medium">Add database</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <AddConnectionModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={handleAddConnectionSuccess}
      />
    </SidebarMenu>
  )
}

