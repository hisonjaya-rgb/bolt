import { useState, useEffect } from "react";
import { Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Collection {
  id: string;
  collection_name: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Article {
  id: string;
  name: string;
  code: string;
  collection: string | null; // Now stores collection UUID, not name
  vendor: {
    name: string;
  };
}

export default function Collections() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCollection, setNewCollection] = useState({
    collection_name: "",
    due_date: null as Date | null,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCollections();
    fetchArticles();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast({
        title: "Error",
        description: "Failed to fetch collections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          id,
          name,
          code,
          collection,
          vendors!inner(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform data to match interface
      const transformedData = (data || []).map(article => ({
        ...article,
        vendor: article.vendors
      }));
      
      setArticles(transformedData);
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollection.collection_name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a collection name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("collections")
        .insert([
          {
            collection_name: newCollection.collection_name.trim(),
            due_date: newCollection.due_date?.toISOString().split('T')[0] || null,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Collection created successfully",
      });

      setNewCollection({ collection_name: "", due_date: null });
      setIsDialogOpen(false);
      fetchCollections();
    } catch (error) {
      console.error("Error creating collection:", error);
      toast({
        title: "Error",
        description: "Failed to create collection",
        variant: "destructive",
      });
    }
  };

  const getArticlesInCollection = (collectionId: string) => {
    return articles.filter(article => article.collection === collectionId);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Collections</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="collection_name">Collection Name</Label>
                <Input
                  id="collection_name"
                  value={newCollection.collection_name}
                  onChange={(e) =>
                    setNewCollection({
                      ...newCollection,
                      collection_name: e.target.value,
                    })
                  }
                  placeholder="Enter collection name"
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newCollection.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newCollection.due_date ? (
                        format(newCollection.due_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newCollection.due_date}
                      onSelect={(date) =>
                        setNewCollection({
                          ...newCollection,
                          due_date: date || null,
                        })
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={handleCreateCollection} className="w-full">
                Create Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {collections.map((collection) => {
          const articlesInCollection = getArticlesInCollection(collection.id);
          
          return (
            <Card 
              key={collection.id}
              className="interactive-card shadow-[var(--shadow-elegant)]"
              onClick={() => navigate(`/collections/${collection.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{collection.collection_name}</CardTitle>
                    {collection.due_date && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Due Date: {format(new Date(collection.due_date), "PPP")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {articlesInCollection.length} articles
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {articlesInCollection.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Article Code</TableHead>
                        <TableHead>Article Name</TableHead>
                        <TableHead>Vendor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {articlesInCollection.slice(0, 5).map((article) => (
                        <TableRow key={article.id}>
                          <TableCell className="font-medium">{article.code}</TableCell>
                          <TableCell>{article.name}</TableCell>
                          <TableCell>{article.vendor.name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No articles in this collection yet
                  </p>
                )}
                {articlesInCollection.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    +{articlesInCollection.length - 5} more articles
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

        {collections.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No collections created yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first collection to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}