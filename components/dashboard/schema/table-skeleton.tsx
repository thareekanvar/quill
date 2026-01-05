"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TableSkeletonProps {
  headers: (string | React.ReactNode)[];
  columnConfigs: Array<{
    width?: string;
    className?: string;
  }>;
  rows?: number;
  hasStickyActions?: boolean;
  actionColumnClassName?: string;
}

export function TableSkeleton({
  headers,
  columnConfigs,
  rows = 5,
  hasStickyActions = false,
  actionColumnClassName,
}: TableSkeletonProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead
                key={index}
                className={
                  hasStickyActions && index === headers.length - 1
                    ? `w-24 bg-muted sticky right-0 z-10 border-l-2 border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${actionColumnClassName || ""}`
                    : undefined
                }
              >
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              {columnConfigs.map((config, j) => (
                <TableCell
                  key={j}
                  className={
                    hasStickyActions && j === columnConfigs.length - 1
                      ? `sticky right-0 z-10 bg-background border-l-2 border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${config.className || ""}`
                      : config.className
                  }
                >
                  {hasStickyActions && j === columnConfigs.length - 1 ? (
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ) : (
                    <Skeleton className={`h-4 ${config.width || "w-full"}`} />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

