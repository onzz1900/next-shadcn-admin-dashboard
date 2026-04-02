import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { PublicationWorkbenchTableRow } from "./workbench-table/schema";

interface WorkbenchOverviewCardsProps {
  rows: PublicationWorkbenchTableRow[];
}

const overviewCards = [
  {
    key: "in_review",
    title: "审核中",
    description: "等待渠道审核的任务",
  },
  {
    key: "missing_fields",
    title: "待补字段",
    description: "仍需补齐必填信息",
  },
  {
    key: "sync_error",
    title: "同步异常",
    description: "渠道同步失败或中断",
  },
  {
    key: "ready_to_list",
    title: "待上架",
    description: "内容已齐，等待发布",
  },
  {
    key: "rejected",
    title: "已驳回",
    description: "渠道驳回后等待重新处理",
  },
] as const;

export function WorkbenchOverviewCards({ rows }: WorkbenchOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-5">
      {overviewCards.map((card) => {
        const count = rows.filter((row) => row.publicationStatus === card.key).length;

        return (
          <Card key={card.key}>
            <CardHeader className="space-y-1">
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{count}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">{card.description}</CardContent>
          </Card>
        );
      })}
    </div>
  );
}
