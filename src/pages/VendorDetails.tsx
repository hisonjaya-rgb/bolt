import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Edit, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  ppm?: string;
  photoshoot?: string;
  collection?: string;
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
          collection
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
          {filteredArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow min-w-0">
              <CardHeader className="p-2 sm:p-4">
                <div className="flex items-start justify-between gap-1">
                  <div className="space-y-1 min-w-0">
                    <CardTitle 
                      className="text-xs sm:text-base cursor-pointer hover:text-primary truncate leading-tight"
                      onClick={() => navigate(`/articles/${article.id}`)}
                    >
                      {article.name}
                    </CardTitle>
                    <CardDescription className="text-xs truncate">
                      {article.code}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => navigate(`/articles/${article.id}`)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
               <CardContent className="p-2 sm:p-4 pt-0 space-y-2">
                <div className="grid grid-cols-1 gap-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-semibold">{article.total_order}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Due:</span>
                    <span className="truncate">{article.due_date ? format(new Date(article.due_date), 'MMM dd') : '-'}</span>
                  </div>
                </div>

                {article.collection && (
                  <div className="border-t pt-1">
                    <p className="text-xs text-muted-foreground">Collection</p>
                    <p className="text-xs font-medium truncate">{article.collection}</p>
                  </div>
                )}
                 
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="min-w-0">
                    <p className="text-muted-foreground truncate">Fabric</p>
                    <p className="truncate">{article.fabric || 'OK'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-muted-foreground truncate">Accs</p>
                    <p className="truncate">{article.accs || 'OK'}</p>
                  </div>
                </div>

                <div className="flex gap-1 flex-wrap">
                  <Badge variant={article.ppm === 'Done' ? 'default' : 'secondary'} className="text-xs px-1 py-0">
                    PPM
                  </Badge>
                  <Badge variant={article.photoshoot === 'Done' ? 'default' : 'secondary'} className="text-xs px-1 py-0">
                    Photo
                  </Badge>
                </div>

                {article.pic && (
                  <div className="border-t pt-1">
                    <p className="text-xs text-muted-foreground">PIC</p>
                    <p className="text-xs truncate">{article.pic}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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