import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="@container/main flex min-h-[calc(100vh-8rem)] items-center justify-center p-4 md:p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Product Center</CardTitle>
          <CardDescription>
            Manage product catalog operations, listings, and related content in one place.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This route is ready for the product center workflow to be built out next.
        </CardContent>
      </Card>
    </div>
  );
}
