import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StandardArticleCard } from "@/components/ui/StandardArticleCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArticleVariationsTable } from "@/components/ArticleVariationsTable";
import { AddArticleDialog } from "@/components/AddArticleDialog";
import VendorShippingTable from "@/components/VendorShippingTable";

interface Vendor {
  id: string;
  name: string;
  brand?: string;
  contact?: string;
  notes?: string;
}

interface Article {
  id: string;
  name: string;
  code: string;
  pic?: string;
  due_date?: string;
  total_order: number;
  has_app1: boolean;
  has_app2: boolean;
  fabric?: string;
  accs?: string;
  pps?: string;
  ppm?: string;
  photoshoot?: string;
  collection?: {
    id: string;
    collection_name: string;
  };
  cutting?: number;
  sewing?: number;
}

interface ArticleVariation {
  id: string;
  article_id: string;
  color: string;
  size: string;
  qty_order: number;
  application1: number;
  application2: number;
  finishing: number;
  qc: number;
  shipping: number;
  cutting: number; // Added missing property
  sewing: number; // Added missing property
}

interface GroupedVariations {
  [articleId: string]: {
    article: Article;
    variations: ArticleVariation[];
    totals: {
      qty_order: number;
      application1: number;
      application2: number;
      cutting: number; // Added missing property
      sewing: number; // Added missing property
      finishing: number;
      qc: number;
      shipping: number;
    };
  };
}

export default function VendorDetails() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [groupedVariations, setGroupedVariations] = useState<GroupedVariations>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false);

  useEffect(() => {
    if (vendorId) {
      fetchVendorData();
    }
  }, [vendorId]);

  const fetchVendorData = async () => {
    if (!vendorId) return;

    try {
      setLoading(true);
      
      // Fetch vendor info
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name, contact, notes')
        .eq('id', vendorId)
        .maybeSingle();

      if (vendorError) throw vendorError;
      setVendor(vendorData);

      // Fetch articles with aggregated totals
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select(`
          id,
          name,
          code,
          pic,
          due_date,
          application1,
          application2,
          fabric,
          accs,
          ppm,
          photoshoot,
          collection:collections!inner(id, collection_name)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (articlesError) throw articlesError;

      // Fetch variations for all articles
      const articleIds = articlesData?.map(a => a.id) || [];
      if (articleIds.length > 0) {
        const { data: variationsData, error: variationsError } = await supabase
          .from('article_variations')
          .select('*')
          .in('article_id', articleIds)
          .order('article_id, color, size');

        if (variationsError) throw variationsError;

        // Group variations by article and calculate totals
        const grouped: GroupedVariations = {};
        const articlesList: Article[] = [];

        articlesData?.forEach(article => {
          const articleVariations = variationsData?.filter(v => v.article_id === article.id) || [];
          
          const totals = articleVariations.reduce((acc, variation) => ({
            qty_order: acc.qty_order + (variation.qty_order || 0),
            application1: acc.application1 + (variation.application1 || 0),
            application2: acc.application2 + (variation.application2 || 0),
            finishing: acc.finishing + (variation.finishing || 0),
            qc: acc.qc + (variation.qc || 0),
            shipping: acc.shipping + (variation.shipping || 0),
          }), {
            qty_order: 0,
            application1: 0,
            application2: 0,
            finishing: 0,
            qc: 0,
            shipping: 0,
          });

          const articleWithTotals: Article = {
            ...article,
            total_order: totals.qty_order,
            has_app1: !!article.application1,
            has_app2: !!article.application2,
          };

          articlesList.push(articleWithTotals);

          grouped[article.id] = {
            article: articleWithTotals,
            variations: articleVariations,
            totals
          };
        });

        setArticles(articlesList);
        setGroupedVariations(grouped);
      } else {
        setArticles([]);
        setGroupedVariations({});
      }

    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendor details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article =>
    article.name.toLowerCase().includes(search.toLowerCase()) ||
    article.code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div>Loading vendor details...</div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex justify-center items-center py-8">
        <div>Vendor not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{vendor.name}</h1>
          <div className="text-muted-foreground text-sm space-y-1">
            {vendor.brand && <p>Brand: {vendor.brand}</p>}
            {vendor.contact && <p>Contact: {vendor.contact}</p>}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/add-daily-report', { state: { vendorId } })} 
            variant="outline" 
            className="w-full sm:w-auto shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Daily Report
          </Button>
          <Button onClick={() => setIsAddArticleOpen(true)} className="w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Article
          </Button>
        </div>
        
        <AddArticleDialog
          open={isAddArticleOpen}
          onOpenChange={setIsAddArticleOpen}
          onSuccess={fetchVendorData}
          preselectedVendorId={vendorId}
        />
      </div>

      {/* Search */}
      <div className="w-full">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search articles or colors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Article Cards Grid */}
      <div className="w-full min-w-0">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Articles ({articles.length})</h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          {filteredArticles.map((article) => {
            // Calculate the progress
            const articleTotals = groupedVariations[article.id]?.totals;
            const progressValue = articleTotals && articleTotals.qty_order > 0
              ? (articleTotals.shipping / articleTotals.qty_order) * 100
              : 0;

            return (
              <StandardArticleCard
                key={article.id}
                article={{
                  ...article,
                  vendor: vendor,
                  collection: article.collection,
                }}
                hideVendor={true}
                progressValue={progressValue}
                onCardClick={(articleId) => navigate(`/articles/${articleId}`)}
              />
            );
          })}
        </div>
      </div>

      {/* Article Variations Table */}
      <div className="w-full min-w-0">
        <ArticleVariationsTable 
          groupedVariations={groupedVariations} 
          searchTerm={search}
        />
      </div>

      {/* Vendor Shipping Table */}
      <div className="w-full min-w-0">
        <VendorShippingTable vendorId={vendorId!} />
      </div>
    </div>
  );
}