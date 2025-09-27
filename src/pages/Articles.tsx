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
  vendors?: {
    name: string;
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
          *,
          vendors (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
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
          {filteredArticles.map((article) => (
            <Card 
              key={article.id} 
              className="interactive-card shadow-[var(--shadow-elegant)]"
              onClick={() => navigate(`/articles/${article.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{article.name}</CardTitle>
                    <CardDescription>{article.code}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor</p>
                    <Badge variant="outline">{article.vendors?.name}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="text-sm">{article.due_date ? new Date(article.due_date).toLocaleDateString('id-ID') : '-'}</p>
                  </div>
                </div>
                
                {article.style && (
                  <div>
                    <p className="text-sm text-muted-foreground">Style</p>
                    <p className="text-sm">{article.style}</p>
                  </div>
                )}

                {(article.application1 || article.application2) && (
                  <div>
                    <p className="text-sm text-muted-foreground">Applications</p>
                    <div className="flex gap-1 flex-wrap">
                      {article.application1 && (
                        <Badge variant="outline" className="text-xs">{article.application1}</Badge>
                      )}
                      {article.application2 && (
                        <Badge variant="outline" className="text-xs">{article.application2}</Badge>
                      )}
                    </div>
                  </div>
                )}

                {article.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm line-clamp-2">{article.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}