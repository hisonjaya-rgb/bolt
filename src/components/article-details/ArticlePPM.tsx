import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ArticlePPMProps {
  articleId: string;
}

export default function ArticlePPM({ articleId }: ArticlePPMProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Production Meeting (PPM)</CardTitle>
        <CardDescription>Quality checkpoints and production meeting management</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p>PPM management functionality will be implemented here.</p>
          <p className="text-sm mt-2">Article ID: {articleId}</p>
        </div>
      </CardContent>
    </Card>
  );
}