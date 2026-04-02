"use client";
"use no memo";

import * as React from "react";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { publicationWorkbenchTableColumns } from "./columns";
import { type PublicationWorkbenchTableRow, publicationWorkbenchRowSchema } from "./schema";

export function PublicationWorkbenchTable({ rows }: { rows: PublicationWorkbenchTableRow[] }) {
  const parsedRows = React.useMemo(() => publicationWorkbenchRowSchema.array().parse(rows), [rows]);

  const table = useReactTable({
    data: parsedRows,
    columns: publicationWorkbenchTableColumns,
    getRowId: (row) => `${row.productId}:${row.channel}`,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>待处理任务</CardTitle>
        <CardDescription>
          当前工作台共 <span className="font-medium text-foreground">{rows.length}</span> 条待处理发布任务。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableCaption className="sr-only">发布工作台任务列表</TableCaption>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
