interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-muted-foreground">{title}</h1>
        <p className="text-muted-foreground max-w-md">{description}</p>
        <div className="text-sm text-muted-foreground">
          This page is under development
        </div>
      </div>
    </div>
  );
}