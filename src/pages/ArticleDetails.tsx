import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { StandardArticleCard } from "@/components/ui/StandardArticleCard";
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
  collection?: {
    id: string;
    collection_name: string;
  };
}

interface ArticleVariation {
  id: string;
  article_id: string;
  color: string;
  size: string;
  qty_order: number;
  application1: number;
  application2: number;
  cutting: number;
  sewing: number;
  finishing: number;
  qc: number;
  ready_to_shipping: number;
  shipping: number;
}

interface Totals {
  totalOrder: number;
  totalApplication1: number;
  totalApplication2: number;
  totalCutting: number;
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
    totalApplication1: 0,
        totalApplication2: 0,
        totalCutting: 0,
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
          id, code, name, style, pic, application1, application2, due_date, sizes, notes, fabric, accs, low_stock, overstock, check_pattern, pps, ppm, photoshoot, created_at, vendor_id,
          vendors (
            name
          ),
          collection:collections (
            id,
            collection_name
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error("Supabase error fetching article details:", error);
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
        totalApplication1: acc.totalApplication1 + (variation.application1 || 0),
        totalApplication2: acc.totalApplication2 + (variation.application2 || 0),
        totalCutting: acc.totalCutting + (variation.cutting || 0),
        totalSewing: acc.totalSewing + (variation.sewing || 0),
        totalFinishing: acc.totalFinishing + (variation.finishing || 0),
        totalQC: acc.totalQC + (variation.qc || 0),
        totalShipping: acc.totalShipping + (variation.shipping || 0)
      }),
      {
        totalOrder: 0,
        totalApplication1: 0,
        totalApplication2: 0,
        totalCutting: 0,
        totalSewing: 0,
        totalFinishing: 0,
        totalQC: 0,
        totalShipping: 0
      }
    );
    setTotals(newTotals);
    if (article) {
      setArticle(prevArticle => ({
        ...prevArticle!,
        total_order: newTotals.totalOrder,
        shipping: newTotals.totalShipping,
      }));
    }
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
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{article.name}</h1>
          <p className="text-muted-foreground">{article.style || '-'}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {article.vendors?.name}
        </Badge>
      </div>

      {/* Standard Article Card */}
      <div className="w-full">
        <StandardArticleCard
          article={{
            ...article,
            vendor: article.vendors,
          }}
          progressValue={totals.totalOrder > 0 ? Math.round((totals.totalShipping / totals.totalOrder) * 100) : 0}
          onCardClick={() => {}}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="information" className="space-y-6">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 lg:w-[1200px]">
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
            onArticleRefetch={fetchArticleDetails}
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