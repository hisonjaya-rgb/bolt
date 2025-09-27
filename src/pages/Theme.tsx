import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Theme() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Theme</h1>
        <p className="text-muted-foreground">Manage application themes and appearance settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>Customize the appearance of your application</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Theme configuration will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}