import { useState, useEffect } from "react";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface Collection {
  id: string;
  collection_name: string;
}

interface ArticleInformationProps {
  article: Article;
  totals: Totals;
  onUpdateArticle: (updatedArticle: Article) => void;
  onArticleRefetch: () => void;
}

export default function ArticleInformation({ article, totals, onUpdateArticle, onArticleRefetch }: ArticleInformationProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added isLoading state
  const [editData, setEditData] = useState({
    name: article.name,
    style: article.style || "",
    pic: article.pic || "",
    application1: article.application1 || "",
    application2: article.application2 || "",
    due_date: article.due_date || "",
    fabric: article.fabric,
    accs: article.accs,
    low_stock: article.low_stock,
    overstock: article.overstock,
    check_pattern: article.check_pattern,
    ppm: article.ppm,
    pps: article.pps,
    photoshoot: article.photoshoot,
    collection: article.collection?.id || "", // Use collection.id
  });
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCollection, setCustomCollection] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    setEditData({
      name: article.name,
      style: article.style || "",
      pic: article.pic || "",
      application1: article.application1 || "",
      application2: article.application2 || "",
      due_date: article.due_date || "",
      fabric: article.fabric,
      accs: article.accs,
      low_stock: article.low_stock,
      overstock: article.overstock,
      check_pattern: article.check_pattern,
      ppm: article.ppm,
      pps: article.pps,
      photoshoot: article.photoshoot,
      collection: article.collection?.id || "", // Use collection.id
    });
  }, [article]);

  useEffect(() => {
    fetchCollections();
    calculateFabricAndAccsStatus();
  }, [article.id]);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('id, collection_name')
        .order('collection_name');

      if (error) {
        console.error('Error fetching collections:', error);
        return;
      }

      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const calculateFabricAndAccsStatus = async () => {
    try {
      const { data: bomData, error } = await supabase
        .from('boms')
        .select('category, needed, receiving')
        .eq('article_id', article.id);

      if (error) {
        console.error('Error fetching BOM data:', error);
        return;
      }

      // Calculate fabric status (main material)
      const mainMaterials = bomData?.filter(item => 
        item.category.toLowerCase() === 'main material'
      ) || [];
      
      // Calculate accs status (accessories)  
      const accessories = bomData?.filter(item => 
        item.category.toLowerCase() === 'accessories'
      ) || [];

      const calculateStatus = (items: any[]) => {
        if (items.length === 0) return 'Matched';
        
        const hasShortage = items.some(item => item.needed > item.receiving);
        const hasExcess = items.some(item => item.needed < item.receiving);
        
        if (hasShortage && hasExcess) return 'Shortage'; // Prioritize shortage
        if (hasShortage) return 'Shortage';
        if (hasExcess) return 'Excess';
        return 'Matched';
      };

      const newFabricStatus = calculateStatus(mainMaterials);
      const newAccsStatus = calculateStatus(accessories);

      // Update article if status changed
      if (newFabricStatus !== article.fabric || newAccsStatus !== article.accs) {
        const { data: updatedArticle, error: updateError } = await supabase
          .from('articles')
          .update({
            fabric: newFabricStatus,
            accs: newAccsStatus
          })
          .eq('id', article.id)
          .select(`
            *,
            vendors (
              name
            )
          `)
          .single();

        if (updateError) {
          console.error('Error updating fabric/accs status:', updateError);
          return;
        }

        onUpdateArticle(updatedArticle);
      }
    } catch (error) {
      console.error('Error calculating fabric/accs status:', error);
    }
  };

  const handleCollectionChange = (value: string) => {
    if (value === "custom") {
      setShowCustomInput(true);
      setEditData({ ...editData, collection: null });
    } else {
      setShowCustomInput(false);
      setCustomCollection("");
      const selectedCollection = collections.find(c => c.id === value);
      setEditData({ ...editData, collection: selectedCollection || null });
    }
  };

  const handleCustomCollectionSubmit = async () => {
    if (customCollection.trim()) {
      try {
        // Create new collection in database
        const { data, error } = await supabase
          .from('collections')
          .insert([{ collection_name: customCollection.trim() }])
          .select()
          .single();

        if (error) {
          toast({
            title: "Error",
            description: "Failed to create new collection",
            variant: "destructive"
          });
          return;
        }

        // Add to local collections state
        setCollections(prev => [...prev, data]);
        setEditData({ ...editData, collection: data }); // Set the full object
        setShowCustomInput(false);
        setCustomCollection("");
        
        toast({
          title: "Success",
          description: "New collection created successfully"
        });
      } catch (error) {
        console.error('Error creating collection:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .update({
          due_date: editData.due_date ? new Date(editData.due_date).toISOString().split('T')[0] : null,
          application1: editData.application1,
          application2: editData.application2,
          low_stock: editData.low_stock,
          overstock: editData.overstock,
          check_pattern: editData.check_pattern,
          ppm: editData.ppm,
          pps: editData.pps,
          photoshoot: editData.photoshoot,
          collection: editData.collection ? editData.collection.id : null, // Send only the ID
        })
        .eq('id', article.id)
        .select(`
          *,
          vendors (
            name
          )
        `)
        .single();

      if (error) {
        console.error("Error updating article:", error);
        toast({
          title: "Error",
          description: "Failed to update article",
          variant: "destructive",
        });
        return;
      }

      onArticleRefetch();
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Article updated successfully"
      });
    } catch (error) {
      console.error('Error updating article:', error);
    }
  };

  const handleUpdateArticle = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .update({
          name: editData.name,
          style: editData.style || null,
          pic: editData.pic || null,
          application1: editData.application1 || null,
          application2: editData.application2 || null,
          due_date: editData.due_date ? new Date(editData.due_date).toISOString().split('T')[0] : null,
          fabric: editData.fabric,
          accs: editData.accs,
          low_stock: editData.low_stock,
          overstock: editData.overstock,
          check_pattern: editData.check_pattern,
          ppm: editData.ppm,
          pps: editData.pps,
          photoshoot: editData.photoshoot,
          collection_id: editData.collection || null, // Ensure collection is updated as ID
        })
        .eq('id', article.id)
        .select(
          `
          id, code, name, style, pic, application1, application2, due_date, sizes, notes, fabric, accs, low_stock, overstock, check_pattern, pps, ppm, photoshoot, created_at, vendor_id,
          vendors (
            name
          ),
          collections (
            id,
            collection_name
          )
          `
        )
        .single();

      if (error) {
        console.error("Error updating article:", error);
        toast({
          title: "Error",
          description: "Failed to update article",
          variant: "destructive"
        });
        return;
      }

      onUpdateArticle(data);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Article updated successfully",
      });
    } catch (error) {
      console.error('Error updating article:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the article",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Article Information Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Article Information</CardTitle>
            <CardDescription>Basic information and dates</CardDescription>
          </div>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Article Information</DialogTitle>
                <DialogDescription>Update article details and dates</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editData.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editData.due_date ? format(editData.due_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editData.due_date ? new Date(editData.due_date) : undefined}
                        onSelect={(date) => setEditData({ ...editData, due_date: date ? format(date, "yyyy-MM-dd") : "" })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="collection">Collection</Label>
                  <Select value={editData.collection || (showCustomInput ? "custom" : "")} onValueChange={handleCollectionChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select collection">
                        {editData.collection
                          ? collections.find((c) => c.id === editData.collection)?.collection_name
                          : "Select collection"}
                    </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>{collection.collection_name}</SelectItem>
                      ))}
                      <SelectItem value="custom">+ Add New Collection</SelectItem>
                    </SelectContent>
                  </Select>
                  {showCustomInput && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={customCollection}
                        onChange={(e) => setCustomCollection(e.target.value)}
                        placeholder="Enter new collection name"
                        onKeyPress={(e) => e.key === 'Enter' && handleCustomCollectionSubmit()}
                      />
                      <Button type="button" onClick={handleCustomCollectionSubmit} size="sm">
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="application1">Application 1</Label>
                    <Input
                      id="application1"
                      value={editData.application1}
                      onChange={(e) => setEditData({ ...editData, application1: e.target.value })}
                      placeholder="e.g., Heat Transfer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="application2">Application 2</Label>
                    <Input
                      id="application2"
                      value={editData.application2}
                      onChange={(e) => setEditData({ ...editData, application2: e.target.value })}
                      placeholder="e.g., Embroidery"
                    />
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      id="low_stock"
                      checked={editData.low_stock}
                      onChange={(e) => setEditData({ ...editData, low_stock: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="low_stock">Low Stock</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox"
                      id="overstock"
                      checked={editData.overstock}
                      onChange={(e) => setEditData({ ...editData, overstock: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="overstock">Overstock</Label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Check Pattern</Label>
                    <Select 
                      value={editData.check_pattern} 
                      onValueChange={(value) => setEditData({ ...editData, check_pattern: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>PPM</Label>
                    <Select 
                      value={editData.ppm} 
                      onValueChange={(value) => setEditData({ ...editData, ppm: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>PPS</Label>
                    <Select 
                      value={editData.pps} 
                      onValueChange={(value) => setEditData({ ...editData, pps: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Photoshoot</Label>
                    <Select 
                      value={editData.photoshoot} 
                      onValueChange={(value) => setEditData({ ...editData, photoshoot: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">
                {article.due_date ? new Date(article.due_date).toLocaleDateString('id-ID') : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(article.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>
            {article.collection && (
              <div>
                <p className="text-sm text-muted-foreground">Collection</p>
                <p className="text-xl font-bold">
                  {article.collection?.collection_name || 'N/A'}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Fabric</p>
              <p className="font-medium">
                <span className={`px-2 py-1 rounded text-sm ${
                  article.fabric === 'Matched' ? 'bg-green-100 text-green-800' :
                  article.fabric === 'Shortage' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {article.fabric}
                </span>
                <span className="text-xs text-muted-foreground ml-2">(Auto-calculated from BOM)</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accs</p>
              <p className="font-medium">
                <span className={`px-2 py-1 rounded text-sm ${
                  article.accs === 'Matched' ? 'bg-green-100 text-green-800' :
                  article.accs === 'Shortage' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {article.accs}
                </span>
                <span className="text-xs text-muted-foreground ml-2">(Auto-calculated from BOM)</span>
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock Status</p>
              <p className="font-medium">
                {article.low_stock ? 'Low Stock' : article.overstock ? 'Overstock' : 'Normal'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Check Pattern</p>
              <p className="font-medium">{article.check_pattern}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PPM</p>
              <p className="font-medium">{article.ppm}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PPS</p>
              <p className="font-medium">{article.pps}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Photoshoot</p>
              <p className="font-medium">{article.photoshoot}</p>
            </div>
            {(article.application1 || article.application2) && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Applications</p>
                <div className="flex gap-2 flex-wrap">
                  {article.application1 && (
                    <span className="text-sm bg-secondary px-2 py-1 rounded">{article.application1}</span>
                  )}
                  {article.application2 && (
                    <span className="text-sm bg-secondary px-2 py-1 rounded">{article.application2}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quantity Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quantity Information</CardTitle>
          <CardDescription>Production totals calculated from variations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Order</p>
              <p className="text-xl font-bold">{totals.totalOrder}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Cutting</p>
              <p className="text-xl font-bold">{totals.totalCutting}</p>
            </div>
            {article.application1 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total App 1</p>
                <p className="text-xl font-bold">{totals.totalApplication1}</p>
              </div>
            )}
            {article.application2 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total App 2</p>
                <p className="text-xl font-bold">{totals.totalApplication2}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Sewing</p>
              <p className="text-xl font-bold">{totals.totalSewing}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Finishing</p>
              <p className="text-xl font-bold">{totals.totalFinishing}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total QC</p>
              <p className="text-xl font-bold">{totals.totalQC}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Shipping</p>
              <p className="text-xl font-bold">{totals.totalShipping}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}