import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { publishMock } from "../../../../_lib/publish/publish.mock";

export function DouyinRuleSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>抖店发布规则</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        这里承接 getProductUpdateRule 返回的限制，例如 {publishMock.douyin.ruleHighlights.join("、")}。
      </CardContent>
    </Card>
  );
}
