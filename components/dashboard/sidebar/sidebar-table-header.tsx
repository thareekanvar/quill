"use client";

import { ArrowClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/translation-context";

interface SidebarTableHeaderProps {
  onRefresh: () => void;
}

export function SidebarTableHeader({ onRefresh }: SidebarTableHeaderProps) {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div
      className={cn(
        "flex items-center justify-between",
        !isCollapsed && "px-2"
      )}
    >
      <span className={cn("text-sm font-semibold text-muted-foreground")}>
        {t.sidebar.tables}
      </span>
      <div className="flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={onRefresh}
          title={t.sidebar.refreshTables}
        >
          <ArrowClockwise className="size-4" />
        </Button>
      </div>
    </div>
  );
}
