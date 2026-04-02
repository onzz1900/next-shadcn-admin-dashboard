import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Publication Workbench</CardTitle>
          <CardDescription>Prepare, review, and publish omni-channel content with a focused workspace.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This route is ready for publication workflow tooling to be added next.
        </CardContent>
      </Card>
    </div>
  );
}
