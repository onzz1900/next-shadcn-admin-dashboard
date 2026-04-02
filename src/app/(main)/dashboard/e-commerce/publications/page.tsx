import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="@container/main flex min-h-[calc(100vh-8rem)] items-center justify-center p-4 md:p-6">
      <Card className="w-full max-w-2xl">
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
