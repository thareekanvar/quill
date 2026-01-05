"use client";

import { useState } from "react";
import { useTranslation } from "@/contexts/translation-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateTableForm } from "@/components/dashboard/schema/create-table-form";
import { ColumnManager } from "@/components/dashboard/schema/column-manager";
import { IndexManager } from "@/components/dashboard/schema/index-manager";
import { ForeignKeyManager } from "@/components/dashboard/schema/foreign-key-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SchemaManagementClient() {
  const { t } = useTranslation();
  const [selectedTable, setSelectedTable] = useState<{ tableName: string; schemaName: string } | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">{t.schema.title}</h1>
        <p className="text-muted-foreground">
          {t.schema.description}
        </p>
      </div>

      <Tabs defaultValue="create-table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create-table">{t.schema.createTable}</TabsTrigger>
          <TabsTrigger value="columns">{t.schema.manageColumns}</TabsTrigger>
          <TabsTrigger value="indexes">{t.schema.manageIndexes}</TabsTrigger>
          <TabsTrigger value="foreign-keys">{t.schema.manageForeignKeys}</TabsTrigger>
        </TabsList>

        <TabsContent value="create-table" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.schema.createTable}</CardTitle>
              <CardDescription>{t.schema.createTableDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateTableForm onTableCreated={(tableName, schemaName) => {
                setSelectedTable({ tableName, schemaName });
              }} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="columns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.schema.manageColumns}</CardTitle>
              <CardDescription>{t.schema.manageColumnsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ColumnManager selectedTable={selectedTable} onTableSelect={setSelectedTable} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indexes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.schema.manageIndexes}</CardTitle>
              <CardDescription>{t.schema.manageIndexesDescription}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <IndexManager selectedTable={selectedTable} onTableSelect={setSelectedTable} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="foreign-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.schema.manageForeignKeys}</CardTitle>
              <CardDescription>{t.schema.manageForeignKeysDescription}</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <ForeignKeyManager selectedTable={selectedTable} onTableSelect={setSelectedTable} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

