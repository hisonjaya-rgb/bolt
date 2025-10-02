import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Progress } from "./progress";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  name: string;
  code: string;
  pic?: string;
  application1?: string;
  application2?: string;
  due_date?: string;
  total_order?: number;
  fabric?: string;
  accs?: string;
  pps?: string;
  ppm?: string;
  photoshoot?: string;
  sewing?: number;
  vendor?: { name: string };
  collection?: { collection_name: string };
}

interface StandardArticleCardProps {
  article: Article;
  progressValue: number;
  onCardClick: (articleId: string) => void;
  hideCollection?: boolean;
  hideVendor?: boolean;
}

const getStatusColor = (label: string, value: any, article: Article) => {
  switch (label) {
    case 'FABRIC':
    case 'ACCS':
      if (value === 'Matched') return 'bg-blue-500';
      if (value === 'Shortage') return 'bg-red-500';
      if (value === 'Excess') return 'bg-orange-500';
      if (value === 'Receiving 0') return 'bg-gray-500';
      return 'bg-gray-500';
    case 'PPS':
    case 'PPM':
    case 'PHOTOSHOOT':
      if (value === 'Done') return 'bg-blue-500';
      if (value === 'In Progress') return 'bg-green-500';
      if (value === 'To Do') return 'bg-gray-500';
      return 'bg-gray-500';
    case 'SEWING':
      if (value === article.total_order) return 'bg-blue-500';
      if (value > 0) return 'bg-green-500';
      if (value === 0) return 'bg-gray-500';
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

export function StandardArticleCard({ article, progressValue, onCardClick, hideCollection, hideVendor }: StandardArticleCardProps) {
  const tags = [
    { label: 'FABRIC', value: article.fabric },
    { label: 'ACCS', value: article.accs },
    { label: 'PPS', value: article.pps },
    { label: 'PPM', value: article.ppm },
    { label: 'PHOTOSHOOT', value: article.photoshoot },
    { label: 'SEWING', value: article.sewing },
  ].filter(tag => tag.value);

  return (
    <Card onClick={() => onCardClick(article.id)} className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-lg font-bold">{article.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-bold">{Math.round(progressValue)}%</span>
          </div>
          <Progress value={progressValue} />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="font-medium">Total:</span> {article.total_order || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Due Date:</span> {article.due_date ? new Date(article.due_date).toLocaleDateString() : 'N/A'}
          </div>
          {!hideCollection && (
            <div>
              <span className="font-medium">Collection:</span> {article.collection?.collection_name || 'N/A'}
            </div>
          )}
          {!hideVendor && (
          <div>
            <span className="font-medium">Vendor:</span> {article.vendor?.name || 'N/A'}
          </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge key={tag.label} className={cn('text-white', getStatusColor(tag.label, tag.value, article))}>{tag.label}</Badge>
          ))}
        </div>
        <div>
          <span className="font-medium">Applications:</span>
          {article.application1 && <Badge variant="secondary">{article.application1}</Badge>}
          {article.application2 && <Badge variant="secondary">{article.application2}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}