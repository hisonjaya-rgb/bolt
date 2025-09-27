import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ArticleSampleProps {
  articleId: string;
}

export default function ArticleSample({ articleId }: ArticleSampleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sample & Pattern</CardTitle>
        <CardDescription>Sample development and pattern management</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p>Sample and pattern management functionality will be implemented here.</p>
          <p className="text-sm mt-2">Article ID: {articleId}</p>
        </div>
      </CardContent>
    </Card>
  );
}