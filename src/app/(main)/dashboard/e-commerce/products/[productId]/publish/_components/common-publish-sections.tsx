import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { PublishView } from "../../../../_lib/publish/publish.types";

interface CommonPublishSectionsProps {
  publishView: PublishView;
}

export function CommonPublishSections({ publishView }: CommonPublishSectionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>通用商品发布</CardTitle>
        <CardDescription>这里先放跨平台可复用的商品信息壳。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {publishView.common.sections.map((section) => (
          <div key={section.id} className="rounded-lg border bg-muted/20 p-4">
            <div className="font-medium text-sm">{section.title}</div>
            <div className="mt-1 text-muted-foreground text-xs">{section.description}</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {section.fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <div className="text-muted-foreground text-xs">{field.label}</div>
                  <div className="font-medium text-sm">{field.value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
