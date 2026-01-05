"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { RowDetails } from "@/components/dashboard/row-details";
import type { PageProps } from "@/types";

export default function RowDetailsPage({ params }: PageProps & {
  params: Promise<{
    tableName: string;
    rowId: string;
  }>;
}) {
  const { tableName, rowId } = use(params);
  const searchParams = useSearchParams();
  const schemaName = searchParams.get("schema") || "public";
  
  // Decode the rowId (which is the primary key value)
  const primaryKeyValue = decodeURIComponent(rowId);

  return (
    <RowDetails
      tableName={tableName}
      schemaName={schemaName}
      primaryKeyValue={primaryKeyValue}
    />
  );
}

