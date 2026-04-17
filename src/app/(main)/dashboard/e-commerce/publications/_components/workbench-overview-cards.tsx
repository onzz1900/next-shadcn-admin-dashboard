import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { PublicationWorkbenchTableRow } from "./workbench-table/schema";

interface WorkbenchOverviewCardsProps {
  rows: PublicationWorkbenchTableRow[];
}

const overviewCards = [
  {
    key: "in_review",
    title: "审核中",
    description: "字段已保存，等待渠道审核的任务",
  },
  {
    key: "missing_fields",
    title: "待补字段",
    description: "保存字段后仍未补齐的任务",
  },
  {
    key: "sync_error",
    title: "同步异常",
    description: "字段已保存，但渠道同步仍失败",
  },
  {
    key: "ready_to_list",
    title: "待上架",
    description: "字段已齐备，等待进一步动作",
  },
  {
    key: "rejected",
    title: "已驳回",
    description: "已被渠道驳回，等待重新处理",
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
            <CardContent className="pt-0 text-muted-foreground text-sm">{card.description}</CardContent>
          </Card>
        );
      })}
    </div>
  );
}
