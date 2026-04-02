import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { SKUItem } from "../../../_lib/product-center.types";

interface SkuTableProps {
  skus: SKUItem[];
}

export function SkuTable({ skus }: SkuTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SKU 列表</CardTitle>
        <CardDescription>
          当前 SPU 共 <span className="font-medium text-foreground">{skus.length}</span> 个销售规格。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableCaption className="sr-only">商品 SKU 列表</TableCaption>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>SKU 名称</TableHead>
                <TableHead>商家编码</TableHead>
                <TableHead>售价</TableHead>
                <TableHead className="text-right">库存</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skus.map((sku) => (
                <TableRow key={sku.id}>
                  <TableCell className="font-medium">{sku.name}</TableCell>
                  <TableCell className="text-muted-foreground">{sku.sellerSku}</TableCell>
                  <TableCell>{sku.priceLabel}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{sku.inventory}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
