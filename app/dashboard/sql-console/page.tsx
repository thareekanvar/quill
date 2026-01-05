import type { Metadata } from "next";
import { SQLConsoleClient } from "@/components/dashboard/sql-console-client";

export const metadata: Metadata = {
  title: "SQL Console",
  description: "Execute SQL queries directly on your database",
};

export default function SQLConsolePage() {
  return <SQLConsoleClient />;
}

