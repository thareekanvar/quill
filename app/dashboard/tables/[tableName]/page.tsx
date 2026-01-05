"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { TableViewer } from "@/components/dashboard/table-viewer";
import type { PageProps } from "@/types";

export default function TableDetailPage({ params }: PageProps) {
  const { tableName } = use(params);
  const searchParams = useSearchParams();
  const schemaName = searchParams.get("schema") || "public";

  return (
    <div className="space-y-6">
      <TableViewer tableName={tableName} schemaName={schemaName} />
    </div>
  );
}
