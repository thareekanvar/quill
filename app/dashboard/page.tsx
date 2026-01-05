import type { Metadata } from "next";
import { DashboardPageClient } from "@/components/dashboard/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Quill Dashboard - Browse and manage your PostgreSQL database tables. View, edit, and delete records with an intuitive interface.",
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
