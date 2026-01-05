"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTables } from "@/hooks/use-postgres-query";
import {
  useTableForeignKeys,
  useCreateForeignKey,
  useDeleteForeignKey,
  useTableColumnsForSchema,
} from "@/hooks/use-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/translation-context";
import { PasswordModal } from "@/components/dashboard/password-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEFAULT_SCHEMA } from "@/lib/constants";

interface ForeignKeyManagerProps {
  selectedTable: { tableName: string; schemaName: string } | null;
  onTableSelect: (table: { tableName: string; schemaName: string } | null) => void;
}

export function ForeignKeyManager({ selectedTable, onTableSelect }: ForeignKeyManagerProps) {
  const { t } = useTranslation();
  const { connectionId } = useAuthStore();
  const { data: tablesData } = useTables();
  const createForeignKeyMutation = useCreateForeignKey();
  const deleteForeignKeyMutation = useDeleteForeignKey();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [createForeignKeyDialogOpen, setCreateForeignKeyDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "create" | "delete";
    data?: any;
  } | null>(null);

  const [newForeignKey, setNewForeignKey] = useState({
    name: "",
    columnName: "",
    foreignTableSchema: "",
    foreignTableName: "",
    foreignColumnName: "",
    onDelete: "NO ACTION" as "NO ACTION" | "CASCADE" | "SET NULL" | "RESTRICT",
  });

  const tableName = selectedTable?.tableName;
  const schemaName = selectedTable?.schemaName || DEFAULT_SCHEMA;

  const { data: foreignKeysData } = useTableForeignKeys(tableName, schemaName);
  const foreignKeys = foreignKeysData?.foreignKeys || [];

  // Get columns for the selected table
  const { data: columnsData } = useTableColumnsForSchema(tableName, schemaName);
  const columns = columnsData?.columns || [];

  const handleCreateForeignKey = () => {
    if (!selectedTable) {
      toast.error(t.schema.selectTableFirst);
      return;
    }
    setCreateForeignKeyDialogOpen(true);
  };

  const handleSubmitCreateForeignKey = () => {
    if (
      !newForeignKey.name ||
      !newForeignKey.columnName ||
      !newForeignKey.foreignTableSchema ||
      !newForeignKey.foreignTableName ||
      !newForeignKey.foreignColumnName
    ) {
      toast.error(t.schema.allFieldsRequired);
      return;
    }
    setPendingAction({ type: "create", data: newForeignKey });
    setPasswordModalOpen(true);
  };

  const handleDeleteForeignKey = (constraintName: string) => {
    setPendingAction({ type: "delete", data: { constraintName } });
    setPasswordModalOpen(true);
  };

  const handlePasswordConfirm = async (confirmedPassword: string) => {
    if (!connectionId || !selectedTable) {
      toast.error(t.schema.noConnection);
      return;
    }

    try {
      if (pendingAction?.type === "create") {
        await createForeignKeyMutation.mutateAsync({
          schemaName: selectedTable.schemaName,
          tableName: selectedTable.tableName,
          foreignKey: pendingAction.data,
          password: confirmedPassword,
        });

        toast.success(t.schema.foreignKeyCreatedSuccess);
        setCreateForeignKeyDialogOpen(false);
        setNewForeignKey({
          name: "",
          columnName: "",
          foreignTableSchema: "",
          foreignTableName: "",
          foreignColumnName: "",
          onDelete: "NO ACTION",
        });
        setPasswordModalOpen(false);
        setPendingAction(null);
      } else if (pendingAction?.type === "delete") {
        await deleteForeignKeyMutation.mutateAsync({
          schemaName: selectedTable.schemaName,
          constraintName: pendingAction.data.constraintName,
          password: confirmedPassword,
        });

        toast.success(t.schema.foreignKeyDeletedSuccess);
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
      <div className="space-y-4">
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
            <Button onClick={handleCreateForeignKey} disabled={createForeignKeyMutation.isPending}>
              <Plus className="size-4 mr-2" />
              {t.schema.createForeignKey}
            </Button>
          )}
        </div>

        {selectedTable && foreignKeys.length > 0 && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.schema.constraintName}</TableHead>
                  <TableHead>{t.schema.columnName}</TableHead>
                  <TableHead>{t.schema.references}</TableHead>
                  <TableHead>{t.schema.onDelete}</TableHead>
                  <TableHead className="w-24">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {foreignKeys.map((fk: any) => (
                  <TableRow key={fk.constraintName}>
                    <TableCell>{fk.constraintName}</TableCell>
                    <TableCell>{fk.columnName}</TableCell>
                    <TableCell>
                      {fk.foreignTableSchema}.{fk.foreignTableName}.{fk.foreignColumnName}
                    </TableCell>
                    <TableCell>{fk.onDelete}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteForeignKey(fk.constraintName)}
                        disabled={deleteForeignKeyMutation.isPending}
                      >
                        <Trash className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedTable && foreignKeys.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            {t.schema.noForeignKeysFound}
          </p>
        )}
      </div>

      <Dialog open={createForeignKeyDialogOpen} onOpenChange={setCreateForeignKeyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.schema.createForeignKey}</DialogTitle>
            <DialogDescription>{t.schema.createForeignKeyDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FieldGroup>
              <Field>
                <Label>{t.schema.constraintName}</Label>
                <Input
                  value={newForeignKey.name}
                  onChange={(e) => setNewForeignKey({ ...newForeignKey, name: e.target.value })}
                  placeholder="fk_users_role_id"
                />
              </Field>
              <Field>
                <Label>{t.schema.columnName}</Label>
                <Select
                  value={newForeignKey.columnName}
                  onValueChange={(value) =>
                    setNewForeignKey({ ...newForeignKey, columnName: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.schema.selectColumn} />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column: any) => (
                      <SelectItem key={column.columnName} value={column.columnName}>
                        {column.columnName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <Label>{t.schema.foreignTableSchema}</Label>
                <Input
                  value={newForeignKey.foreignTableSchema}
                  onChange={(e) =>
                    setNewForeignKey({ ...newForeignKey, foreignTableSchema: e.target.value })
                  }
                  placeholder="public"
                />
              </Field>
              <Field>
                <Label>{t.schema.foreignTableName}</Label>
                <Select
                  value={newForeignKey.foreignTableName}
                  onValueChange={(value) =>
                    setNewForeignKey({ ...newForeignKey, foreignTableName: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.schema.selectTable} />
                  </SelectTrigger>
                  <SelectContent>
                    {tablesData?.tables.map((table) => (
                      <SelectItem
                        key={`${table.schemaName}.${table.tableName}`}
                        value={table.tableName}
                      >
                        {table.schemaName}.{table.tableName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <Field>
              <Label>{t.schema.foreignColumnName}</Label>
              <Input
                value={newForeignKey.foreignColumnName}
                onChange={(e) =>
                  setNewForeignKey({ ...newForeignKey, foreignColumnName: e.target.value })
                }
                placeholder="id"
              />
            </Field>
            <Field>
              <Label>{t.schema.onDelete}</Label>
              <Select
                value={newForeignKey.onDelete}
                onValueChange={(value: any) =>
                  setNewForeignKey({ ...newForeignKey, onDelete: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NO ACTION">NO ACTION</SelectItem>
                  <SelectItem value="CASCADE">CASCADE</SelectItem>
                  <SelectItem value="SET NULL">SET NULL</SelectItem>
                  <SelectItem value="RESTRICT">RESTRICT</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateForeignKeyDialogOpen(false);
                  setNewForeignKey({
                    name: "",
                    columnName: "",
                    foreignTableSchema: "",
                    foreignTableName: "",
                    foreignColumnName: "",
                    onDelete: "NO ACTION",
                  });
                }}
              >
                {t.common.cancel}
              </Button>
              <Button onClick={handleSubmitCreateForeignKey} disabled={createForeignKeyMutation.isPending}>
                {t.schema.createForeignKey}
              </Button>
            </div>
          </div>
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

