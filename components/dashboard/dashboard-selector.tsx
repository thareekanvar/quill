"use client";

import * as React from "react";
import { Plus, Pencil, Trash, SquaresFour } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useDashboardStore } from "@/lib/stores/dashboard-store";
import {
  createDashboard,
  updateDashboard,
  deleteDashboard,
  type Dashboard,
} from "@/lib/db";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useTranslation } from "@/contexts/translation-context";
import { trackSettingsChange } from "@/lib/utils/settings-export";

export function DashboardSelector() {
  const { t } = useTranslation();
  const { connectionId } = useAuthStore();
  const {
    dashboardId,
    dashboards,
    isLoading,
    setDashboardId,
    loadDashboards,
    initializeDashboard,
    refreshDashboards,
  } = useDashboardStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editingDashboard, setEditingDashboard] =
    React.useState<Dashboard | null>(null);
  const [dashboardName, setDashboardName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize dashboard when connection changes
  React.useEffect(() => {
    if (connectionId) {
      initializeDashboard(connectionId);
    }
  }, [connectionId, initializeDashboard]);

  // Load dashboards when connection changes
  React.useEffect(() => {
    if (connectionId) {
      loadDashboards(connectionId);
    }
  }, [connectionId, loadDashboards]);

  const handleCreateDashboard = async () => {
    if (!connectionId || !dashboardName.trim()) return;

    setIsSubmitting(true);
    try {
      const newDashboardId = await createDashboard(
        connectionId,
        dashboardName.trim()
      );
      await refreshDashboards();
      setDashboardId(newDashboardId);
      setIsCreateDialogOpen(false);
      setDashboardName("");
      trackSettingsChange();
    } catch (error) {
      console.error("Failed to create dashboard:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDashboard = async () => {
    if (!editingDashboard || !dashboardName.trim()) return;

    setIsSubmitting(true);
    try {
      await updateDashboard(editingDashboard.id, {
        name: dashboardName.trim(),
      });
      await refreshDashboards();
      setIsEditDialogOpen(false);
      setEditingDashboard(null);
      setDashboardName("");
      trackSettingsChange();
    } catch (error) {
      console.error("Failed to update dashboard:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDashboard = async () => {
    if (!editingDashboard) return;

    setIsSubmitting(true);
    try {
      await deleteDashboard(editingDashboard.id);
      await refreshDashboards();

      // Select another dashboard if available
      const remainingDashboards = dashboards.filter(
        (d) => d.id !== editingDashboard.id
      );
      if (remainingDashboards.length > 0) {
        setDashboardId(remainingDashboards[0].id);
      } else if (connectionId) {
        // Create default dashboard if none remain
        const defaultId = await createDashboard(
          connectionId,
          "Default Dashboard"
        );
        await refreshDashboards();
        setDashboardId(defaultId);
      } else {
        setDashboardId(null);
      }

      setIsDeleteDialogOpen(false);
      setEditingDashboard(null);
      trackSettingsChange();
    } catch (error) {
      console.error("Failed to delete dashboard:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard);
    setDashboardName(dashboard.name);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading || !connectionId) {
    return null;
  }

  const currentDashboard = dashboards.find((d) => d.id === dashboardId);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={dashboardId || ""}
          onValueChange={(value) => setDashboardId(value)}
        >
          <SelectTrigger className="w-full sm:w-[200px] min-w-[150px]">
            <div className="flex items-center gap-2">
              <SquaresFour className="size-4 shrink-0" />
              <SelectValue placeholder="Select dashboard">
                {currentDashboard?.name || "Select dashboard"}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            {dashboards.map((dashboard) => (
              <SelectItem key={dashboard.id} value={dashboard.id}>
                {dashboard.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          {currentDashboard && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(currentDashboard)}
                title="Edit dashboard"
                className="shrink-0"
              >
                <Pencil className="size-4" />
              </Button>
              {dashboards.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteDialog(currentDashboard)}
                  title="Delete dashboard"
                  className="shrink-0"
                >
                  <Trash className="size-4" />
                </Button>
              )}
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDashboardName("");
              setIsCreateDialogOpen(true);
            }}
            title="Create dashboard"
            className="shrink-0"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Dashboard</DialogTitle>
            <DialogDescription>
              Create a new dashboard for this connection
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Dashboard Name</FieldLabel>
              <Input
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="Enter dashboard name"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && dashboardName.trim()) {
                    handleCreateDashboard();
                  }
                }}
                autoFocus
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDashboard}
              disabled={!dashboardName.trim() || isSubmitting}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Dashboard</DialogTitle>
            <DialogDescription>
              Update the dashboard name
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Dashboard Name</FieldLabel>
              <Input
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="Enter dashboard name"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && dashboardName.trim()) {
                    handleEditDashboard();
                  }
                }}
                autoFocus
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditDashboard}
              disabled={!dashboardName.trim() || isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dashboard</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{editingDashboard?.name}"? This
              will also delete all cards and charts in this dashboard. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDashboard}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

