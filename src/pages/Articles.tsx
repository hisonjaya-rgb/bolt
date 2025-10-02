import { useState, useEffect } from "react";
import { Plus, Search, Edit, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AddArticleDialog } from "@/components/AddArticleDialog";
import { StandardArticleCard } from "@/components/ui/StandardArticleCard";

interface Article {
  id: string;
  code: string;
  name: string;
  vendor_id: string;
  style?: string;
  pic?: string;
  application1?: string;
  application2?: string;
  due_date?: string;
  sizes: string[];
  notes?: string;
  total_order?: number;
  shipping?: number;
  fabric?: string;
  accs?: string;
  pps?: string;
  ppm?: string;
  photoshoot?: string;
  vendors?: {
    name: string;
  };
  collections?: {
    collection_name: string;
  };
}

export default function Articles() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id, code, name, vendor_id, style, pic, application1, application2, due_date, sizes, notes, fabric, accs, pps, ppm, photoshoot,
          vendors (name),
          collections (collection_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const articleIds = data.map(article => article.id);
      const { data: variationsData, error: variationsError } = await supabase
        .from('article_variations')
        .select('article_id, qty_order, shipping')
        .in('article_id', articleIds);

      if (variationsError) throw variationsError;

      const articlesWithTotals = data.map(article => {
        const variations = variationsData.filter(variation => variation.article_id === article.id);
        const total_order = variations.reduce((acc, variation) => acc + variation.qty_order, 0);
        const total_shipping = variations.reduce((acc, variation) => acc + (variation.shipping || 0), 0);
        return { ...article, total_order, shipping: total_shipping };
      });

      setArticles(articlesWithTotals || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(article =>
    article.name.toLowerCase().includes(search.toLowerCase()) ||
    (article.vendors?.name?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Articles</h1>
          <p className="text-muted-foreground">Manage article catalog and specifications</p>
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Article
        </Button>
        
        <AddArticleDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={fetchArticles}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div>Loading articles...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredArticles.map((article) => {
            // Calculate the progress
            const progressValue = article.total_order && article.total_order > 0
              ? (article.shipping / article.total_order) * 100
              : 0;

            return (
              <StandardArticleCard
                key={article.id}
                article={{
                  ...article,
                  vendor: article.vendors,
                  collection: article.collections,
                }}
                progressValue={progressValue}
                onCardClick={(articleId) => navigate(`/articles/${articleId}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}