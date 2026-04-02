import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <Card>
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
