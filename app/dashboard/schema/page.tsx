import type { Metadata } from "next";
import { SchemaManagementClient } from "@/components/dashboard/schema-management-client";

export const metadata: Metadata = {
  title: "Schema Management",
  description: "Manage database schema - create tables, add columns, manage indexes and foreign keys",
};

export default function SchemaManagementPage() {
  return <SchemaManagementClient />;
}

