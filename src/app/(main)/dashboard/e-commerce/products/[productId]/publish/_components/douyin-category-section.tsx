import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { publishMock } from "../../../../_lib/publish/publish.mock";

export function DouyinCategorySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>抖店类目与属性</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        这里承接 {publishMock.douyin.categoryName} 的类目属性、销售属性和动态必填项。
      </CardContent>
    </Card>
  );
}
