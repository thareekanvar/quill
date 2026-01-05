"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTables } from "@/hooks/use-postgres-query";
import {
  useTableColumnsForSchema,
  useDeleteColumn,
  useModifyColumn,
} from "@/hooks/use-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash } from "@phosphor-icons/react";
import { Controller, useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/translation-context";
import { PasswordModal } from "@/components/dashboard/password-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DEFAULT_SCHEMA } from "@/lib/constants";

interface ColumnManagerProps {
  selectedTable: { tableName: string; schemaName: string } | null;
  onTableSelect: (table: { tableName: string; schemaName: string } | null) => void;
}

const POSTGRES_DATA_TYPES = [
  "VARCHAR",
  "TEXT",
  "INTEGER",
  "BIGINT",
  "SMALLINT",
  "DECIMAL",
  "NUMERIC",
  "REAL",
  "DOUBLE PRECISION",
  "BOOLEAN",
  "DATE",
  "TIME",
  "TIMESTAMP",
  "TIMESTAMPTZ",
  "JSON",
  "JSONB",
  "UUID",
  "BYTEA",
];

interface EditColumnFormData {
  newName: string;
  type: string;
  nullable: boolean;
  defaultValue: string;
}

export function ColumnManager({ selectedTable, onTableSelect }: ColumnManagerProps) {
  const { t } = useTranslation();
  const { connectionId } = useAuthStore();
  const { data: tablesData } = useTables();
  const deleteColumnMutation = useDeleteColumn();
  const modifyColumnMutation = useModifyColumn();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<{ columnName: string; column: any } | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: "add" | "modify" | "delete";
    data?: any;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditColumnFormData>();

  const tableName = selectedTable?.tableName;
  const schemaName = selectedTable?.schemaName || DEFAULT_SCHEMA;

  const { data: columnsData } = useTableColumnsForSchema(
    tableName,
    schemaName
  );

  const columns = columnsData?.columns || [];

  const handleAddColumn = () => {
    if (!selectedTable) {
      toast.error(t.schema.selectTableFirst);
      return;
    }
    setPendingAction({ type: "add" });
    setPasswordModalOpen(true);
  };

  const handleModifyColumn = (columnName: string) => {
    const column = columns.find((col) => col.columnName === columnName);
    if (!column) return;

    // Extract base type (e.g., "VARCHAR(255)" -> "VARCHAR")
    const baseType = column.dataType.split("(")[0].toUpperCase();
    const type = POSTGRES_DATA_TYPES.includes(baseType) ? baseType : column.dataType;

    setEditingColumn({ columnName, column });
    reset({
      newName: column.columnName,
      type: type,
      nullable: column.isNullable === "YES",
      defaultValue: column.columnDefault || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = (data: EditColumnFormData) => {
    if (!editingColumn || !selectedTable) return;

    // Check if anything changed
    const hasChanges =
      data.newName !== editingColumn.column.columnName ||
      data.type !== editingColumn.column.dataType ||
      data.nullable !== (editingColumn.column.isNullable === "YES") ||
      (data.defaultValue || "") !== (editingColumn.column.columnDefault || "");

    if (!hasChanges) {
      toast.info(t.schema.noChanges);
      setEditDialogOpen(false);
      setEditingColumn(null);
      return;
    }

    setPendingAction({
      type: "modify",
      data: {
        columnName: editingColumn.columnName,
        changes: {
          newName: data.newName !== editingColumn.column.columnName ? data.newName : undefined,
          type: data.type !== editingColumn.column.dataType ? data.type : undefined,
          nullable: data.nullable !== (editingColumn.column.isNullable === "YES") ? data.nullable : undefined,
          defaultValue: (data.defaultValue || "") !== (editingColumn.column.columnDefault || "") 
            ? (data.defaultValue || null) 
            : undefined,
        },
      },
    });
    setEditDialogOpen(false);
    setPasswordModalOpen(true);
  };

  const handleDeleteColumn = (columnName: string) => {
    setPendingAction({ type: "delete", data: { columnName } });
    setPasswordModalOpen(true);
  };

  const handlePasswordConfirm = async (confirmedPassword: string) => {
    if (!connectionId || !selectedTable) {
      toast.error(t.schema.noConnection);
      return;
    }

    try {
      if (pendingAction?.type === "add") {
        // In a real implementation, you'd open a dialog to add column details
        toast.info(t.schema.addColumnFeature);
        setPasswordModalOpen(false);
        setPendingAction(null);
      } else if (pendingAction?.type === "modify") {
        await modifyColumnMutation.mutateAsync({
          schemaName: selectedTable.schemaName,
          tableName: selectedTable.tableName,
          columnName: pendingAction.data.columnName,
          changes: pendingAction.data.changes,
          password: confirmedPassword,
        });

        toast.success(t.schema.columnModifiedSuccess);
        setPasswordModalOpen(false);
        setPendingAction(null);
        setEditingColumn(null);
      } else if (pendingAction?.type === "delete") {
        await deleteColumnMutation.mutateAsync({
          schemaName: selectedTable.schemaName,
          tableName: selectedTable.tableName,
          columnName: pendingAction.data.columnName,
          password: confirmedPassword,
        });

        toast.success(t.schema.columnDeletedSuccess);
        setPasswordModalOpen(false);
        setPendingAction(null);
      }
    } catch (error: any) {
      toast.error(error.message || t.schema.operationFailed);
      setPasswordModalOpen(false);
      setPendingAction(null);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="mb-2 block">{t.schema.selectTable}</Label>
            <Select
              value={selectedTable ? `${selectedTable.schemaName}.${selectedTable.tableName}` : ""}
              onValueChange={(value) => {
                if (value) {
                  const [schema, table] = value.split(".");
                  onTableSelect({ schemaName: schema, tableName: table });
                } else {
                  onTableSelect(null);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.schema.selectTablePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {tablesData?.tables.map((table) => (
                  <SelectItem
                    key={`${table.schemaName}.${table.tableName}`}
                    value={`${table.schemaName}.${table.tableName}`}
                  >
                    {table.schemaName}.{table.tableName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedTable && (
            <Button onClick={handleAddColumn}>
              <Plus className="size-4 mr-2" />
              {t.schema.addColumn}
            </Button>
          )}
        </div>

        {selectedTable && columns.length > 0 && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.schema.columnName}</TableHead>
                  <TableHead>{t.schema.columnType}</TableHead>
                  <TableHead>{t.schema.nullable}</TableHead>
                  <TableHead>{t.schema.defaultValue}</TableHead>
                  <TableHead className="w-24 bg-muted sticky right-0 z-10 border-l-2 border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((column) => (
                  <TableRow key={column.columnName}>
                    <TableCell>{column.columnName}</TableCell>
                    <TableCell>{column.dataType}</TableCell>
                    <TableCell>{column.isNullable === "YES" ? t.common.yes : t.common.no}</TableCell>
                    <TableCell>{column.columnDefault || "-"}</TableCell>
                    <TableCell className="sticky right-0 z-10 bg-background border-l-2 border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                      <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleModifyColumn(column.columnName)}
                            disabled={deleteColumnMutation.isPending}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteColumn(column.columnName)}
                            disabled={deleteColumnMutation.isPending}
                          >
                            <Trash className="size-4 text-destructive" />
                          </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedTable && columns.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            {t.schema.noColumnsFound}
          </p>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.schema.editColumn}</DialogTitle>
            <DialogDescription>{t.schema.editColumnDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleEditSubmit)} className="space-y-4">
            <FieldGroup>
              <Field>
                <Label>{t.schema.columnName}</Label>
                <Input
                  {...register("newName", { required: t.schema.columnNameRequired })}
                  placeholder="column_name"
                />
                {errors.newName && (
                  <p className="text-sm text-destructive mt-1">{errors.newName.message}</p>
                )}
              </Field>
              <Field>
                <Label>{t.schema.columnType}</Label>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: t.schema.columnTypeRequired }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POSTGRES_DATA_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
                )}
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <Label>{t.schema.defaultValue}</Label>
                <Input
                  {...register("defaultValue")}
                  placeholder="NULL or default value"
                />
              </Field>
              <Field>
                <Label className="mb-2 block">{t.schema.options}</Label>
                <Controller
                  name="nullable"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox
                        id="nullable"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label htmlFor="nullable" className="font-normal cursor-pointer">
                        {t.schema.nullable}
                      </Label>
                    </div>
                  )}
                />
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingColumn(null);
                }}
              >
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={modifyColumnMutation.isPending}>
                {modifyColumnMutation.isPending ? t.common.loading : t.common.save}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <PasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        onConfirm={handlePasswordConfirm}
        title={t.schema.confirmPassword}
        description={t.schema.confirmPasswordDescription}
      />
    </>
  );
}

