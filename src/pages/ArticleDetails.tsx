import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import ArticleInformation from "@/components/article-details/ArticleInformation";
import ArticleVariations from "@/components/article-details/ArticleVariations";
import ArticleBOM from "@/components/article-details/ArticleBOM";
import ArticleGarmentSheet from "@/components/article-details/ArticleGarmentSheet";
import ArticleSample from "@/components/article-details/ArticleSample";
import ArticlePPM from "@/components/article-details/ArticlePPM";
import ArticleMeasurementDetails from "@/components/article-details/ArticleMeasurementDetails";
import ArticleShipping from "@/components/article-details/ArticleShipping";
import ArticleImages from "@/components/article-details/ArticleImages";

interface Article {
  id: string;
  code: string;
  name: string;
  style?: string;
  pic?: string;
  application1?: string;
  application2?: string;
  sizes: string[];
  notes?: string;
  due_date?: string;
  fabric: string;
  accs: string;
  low_stock: boolean;
  overstock: boolean;
  check_pattern: string;
  ppm: string;
  pps: string;
  photoshoot: string;
  created_at: string;
  vendor_id: string;
  vendors?: {
    name: string;
  };
}

interface ArticleVariation {
  id: string;
  article_id: string;
  color: string;
  size: string;
  qty_order: number;
  cutting: number;
  application1: number;
  application2: number;
  sewing: number;
  finishing: number;
  qc: number;
  ready_to_shipping: number;
  shipping: number;
}

interface Totals {
  totalOrder: number;
  totalCutting: number;
  totalApplication1: number;
  totalApplication2: number;
  totalSewing: number;
  totalFinishing: number;
  totalQC: number;
  totalShipping: number;
}

export default function ArticleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [variations, setVariations] = useState<ArticleVariation[]>([]);
  const [totals, setTotals] = useState<Totals>({
    totalOrder: 0,
    totalCutting: 0,
    totalApplication1: 0,
    totalApplication2: 0,
    totalSewing: 0,
    totalFinishing: 0,
    totalQC: 0,
    totalShipping: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchArticleDetails();
      fetchArticleVariations();
    }
  }, [id]);

  useEffect(() => {
    calculateTotals();
  }, [variations]);

  const fetchArticleDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          *,
          vendors (
            name
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch article details",
          variant: "destructive"
        });
        return;
      }

      setArticle(data);
    } catch (error) {
      console.error('Error fetching article:', error);
    }
  };

  const fetchArticleVariations = async () => {
    try {
      const { data, error } = await supabase
        .from('article_variations')
        .select('*')
        .eq('article_id', id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch article variations",
          variant: "destructive"
        });
        return;
      }

      setVariations(data || []);
    } catch (error) {
      console.error('Error fetching variations:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const newTotals = variations.reduce(
      (acc, variation) => ({
        totalOrder: acc.totalOrder + (variation.qty_order || 0),
        totalCutting: acc.totalCutting + (variation.cutting || 0),
        totalApplication1: acc.totalApplication1 + (variation.application1 || 0),
        totalApplication2: acc.totalApplication2 + (variation.application2 || 0),
        totalSewing: acc.totalSewing + (variation.sewing || 0),
        totalFinishing: acc.totalFinishing + (variation.finishing || 0),
        totalQC: acc.totalQC + (variation.qc || 0),
        totalShipping: acc.totalShipping + (variation.shipping || 0)
      }),
      {
        totalOrder: 0,
        totalCutting: 0,
        totalApplication1: 0,
        totalApplication2: 0,
        totalSewing: 0,
        totalFinishing: 0,
        totalQC: 0,
        totalShipping: 0
      }
    );
    setTotals(newTotals);
  };

  const handleUpdateArticle = (updatedArticle: Article) => {
    setArticle(updatedArticle);
  };

  const handleUpdateVariations = (updatedVariations: ArticleVariation[]) => {
    setVariations(updatedVariations);
  };

  const handleBOMUpdate = () => {
    // Refresh article data to recalculate fabric/accs status
    fetchArticleDetails();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Article not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/articles')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Articles
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{article.name}</h1>
          <p className="text-muted-foreground">{article.style || '-'}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {article.vendors?.name}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Fabric Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={
              article.fabric === 'Matched' ? 'default' :
              article.fabric === 'Shortage' ? 'destructive' : 'secondary'
            }>
              {article.fabric}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Accs Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={
              article.accs === 'Matched' ? 'default' :
              article.accs === 'Shortage' ? 'destructive' : 'secondary'
            }>
              {article.accs}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">PPM</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={
              article.ppm === 'Done' ? 'default' :
              article.ppm === 'In Progress' ? 'secondary' : 'outline'
            }>
              {article.ppm}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Photoshoot</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={
              article.photoshoot === 'Done' ? 'default' :
              article.photoshoot === 'In Progress' ? 'secondary' : 'outline'
            }>
              {article.photoshoot}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="information" className="space-y-6">
        <TabsList className="grid grid-cols-6 lg:w-[1200px] overflow-x-auto">
          <TabsTrigger value="information">Article Information</TabsTrigger>
          <TabsTrigger value="bom">BOM</TabsTrigger>
          <TabsTrigger value="form-sample">Form Sample</TabsTrigger>
          <TabsTrigger value="measurements">Measurement Details</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="information" className="space-y-6">
          <ArticleInformation 
            article={article}
            totals={totals}
            onUpdateArticle={handleUpdateArticle}
          />
          <ArticleVariations 
            article={article}
            variations={variations}
            onUpdateVariations={handleUpdateVariations}
          />
        </TabsContent>

        <TabsContent value="bom">
          <ArticleBOM articleId={article.id} onBOMUpdate={handleBOMUpdate} />
        </TabsContent>

        <TabsContent value="form-sample">
          <ArticleGarmentSheet articleId={article.id} />
        </TabsContent>

        <TabsContent value="measurements">
          <ArticleMeasurementDetails 
            articleId={article.id} 
            variations={variations}
          />
        </TabsContent>

        <TabsContent value="shipping">
          <ArticleShipping articleId={article.id} />
        </TabsContent>

        <TabsContent value="images">
          <ArticleImages articleId={article.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}