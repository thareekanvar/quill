import type { Metadata } from "next";
import { QueryHistory } from "@/components/dashboard/query-history";

export const metadata: Metadata = {
  title: "Query History",
  description: "View and manage your SQL query history and saved queries",
};

export default function QueriesPage() {
  return (
    <div className="space-y-4">
      <QueryHistory />
    </div>
  );
}

