"use client"

import { usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useTranslation } from "@/contexts/translation-context"

export function SiteHeader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  
  // Extract table name from pathname if on a table detail page
  const tableMatch = pathname?.match(/\/dashboard\/tables\/([^/]+)/)
  const tableName = tableMatch ? tableMatch[1] : null
  
  // Check if we're on a row details page (has a rowId after table name)
  const rowDetailsMatch = pathname?.match(/\/dashboard\/tables\/([^/]+)\/([^/]+)/)
  const isRowDetailsPage = !!rowDetailsMatch
  const rowId = rowDetailsMatch ? rowDetailsMatch[2] : null
  
  // Build table link with schema parameter if present
  const schemaParam = searchParams.get("schema")
  const tableLink = tableName 
    ? `/dashboard/tables/${tableName}${schemaParam && schemaParam !== "public" ? `?schema=${encodeURIComponent(schemaParam)}` : ""}`
    : "/dashboard"

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {tableName ? (
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">{t.common.tables}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{t.common.tables}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {tableName && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isRowDetailsPage ? (
                    <BreadcrumbLink asChild>
                      <Link href={tableLink}>
                        {tableName}
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{tableName}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </>
            )}
            {isRowDetailsPage && rowId && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t.common.rowDetails}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

