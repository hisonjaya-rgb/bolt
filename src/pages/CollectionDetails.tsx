import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Plus, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StandardArticleCard } from "@/components/ui/StandardArticleCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArticleVariationsTable } from "@/components/ArticleVariationsTable";
import VendorShippingTable from "@/components/VendorShippingTable";

interface Collection {
  id: string;
  collection_name: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

interface Article {
  id: string;
  name: string;
  code: string;
  pic?: string;
  due_date?: string;
  total_order: number;
  shipping?: number;
  fabric?: string;
  accs?: string;
  ppm?: string;
  photoshoot?: string;
  application1?: string;
  application2?: string;
  vendor_id: string;
  vendor: {
    id: string;
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
  shipping: number;
}

interface GroupedVariations {
  [articleId: string]: {
    article: Article;
    variations: ArticleVariation[];
    totals: {
      qty_order: number;
      cutting: number;
      application1: number;
      application2: number;
      sewing: number;
      finishing: number;
      qc: number;
      shipping: number;
    };
  };
}

export default function CollectionDetails() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [groupedVariations, setGroupedVariations] = useState<GroupedVariations>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (collectionId) {
      fetchCollectionData();
    }
  }, [collectionId]);

  const fetchCollectionData = async () => {
    if (!collectionId) return;

    try {
      setLoading(true);
      
      // Fetch collection info
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .select('id, collection_name, due_date, created_at, updated_at')
        .eq('id', collectionId)
        .maybeSingle();

      if (collectionError) {
        console.error("Collection fetch error:", collectionError);
        throw collectionError;
      }
      setCollection(collectionData);

      // Fetch articles with vendor info
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
          vendor_id,
          vendor:vendors!inner(id, name)
        `)
        .eq('collection', collectionId)
        .order('created_at', { ascending: false });

      if (articlesError) {
        console.error("Articles fetch error:", articlesError);
        throw articlesError;
      }

      // Fetch variations for all articles
      const articleIds = articlesData?.map(a => a.id) || [];
      if (articleIds.length > 0) {
        const { data: variationsData, error: variationsError } = await supabase
          .from('article_variations')
          .select('*')
          .in('article_id', articleIds)
          .order('article_id, color, size');

        if (variationsError) {
          console.error("Variations fetch error:", variationsError);
          throw variationsError;
        }

        // Group variations by article and calculate totals
        const grouped: GroupedVariations = {};
        const articlesList: Article[] = [];

        articlesData?.forEach(article => {
          const articleVariations = variationsData?.filter(v => v.article_id === article.id) || [];
          
          const totals = articleVariations.reduce((acc, variation) => ({
            qty_order: acc.qty_order + (variation.qty_order || 0),
            cutting: acc.cutting + (variation.cutting || 0),
            application1: acc.application1 + (variation.application1 || 0),
            application2: acc.application2 + (variation.application2 || 0),
            sewing: acc.sewing + (variation.sewing || 0),
            finishing: acc.finishing + (variation.finishing || 0),
            qc: acc.qc + (variation.qc || 0),
            shipping: acc.shipping + (variation.shipping || 0),
          }), {
            qty_order: 0,
            cutting: 0,
            application1: 0,
            application2: 0,
            sewing: 0,
            finishing: 0,
            qc: 0,
            shipping: 0,
          });

          const articleWithTotals: Article = {
            ...article,
            total_order: totals.qty_order,
            shipping: totals.shipping, // Assign calculated shipping to article
            vendor_id: article.vendor_id,
            vendor: article.vendor
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
      console.error('Error fetching collection data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch collection details",
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

  // Get unique vendor IDs from articles in this collection for shipping table
  const uniqueVendors = [...new Set(articles.map(article => JSON.stringify({ id: article.vendor_id, name: article.vendor.name })))].map(v => JSON.parse(v));

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div>Loading collection details...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex justify-center items-center py-8">
        <div>Collection not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">{collection.collection_name}</h1>
          <div className="text-muted-foreground text-sm space-y-1">
            {collection.due_date && <p>Due Date: {format(new Date(collection.due_date), "PPP")}</p>}
            <p>Created: {format(new Date(collection.created_at), "PPP")}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/collections')} 
            variant="outline" 
            className="w-full sm:w-auto shrink-0"
          >
            Back to Collections
          </Button>
        </div>
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
                  collection: collection,
                }}
                hideCollection={true}
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

      {/* Collection Shipping Records */}
      <div className="w-full min-w-0">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Shipping Records</h2>
        {articles.length > 0 ? (
          <div className="space-y-4">
            {uniqueVendors.map((vendor) => (
              <div key={vendor.id}>
                <h3 className="text-md font-medium mb-2">Vendor: {vendor.name}</h3>
                <VendorShippingTable vendorId={vendor.id} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No articles in this collection yet
          </div>
        )}
      </div>
    </div>
  );
}