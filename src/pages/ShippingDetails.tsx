import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ShippingRecord {
  id: string;
  date: string;
  vendor_id: string;
  article_id: string | null;
  packing_list: string | null;
  remarks: string | null;
  vendors: {
    name: string;
  } | null;
  articles: {
    name: string;
    code: string;
  } | null;
}

interface Article {
  id: string;
  name: string;
  code: string;
}

interface ArticleVariation {
  id: string;
  color: string;
  size: string;
}

interface ShippingListItem {
  id: string;
  shipping_id: string;
  article_id: string;
  color: string;
  size: string;
  ok: number;
  r5: number;
  r10: number;
  total_shipping: number;
  articles: {
    name: string;
    code: string;
  } | null;
}

interface NewShippingListItem {
  article_id: string;
  selected_variations: string[];
  variations_data: { [key: string]: { color: string; size: string; ok: number; r5: number; r10: number } };
}

export default function ShippingDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [shipping, setShipping] = useState<ShippingRecord | null>(null);
  const [shippingList, setShippingList] = useState<ShippingListItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [variations, setVariations] = useState<ArticleVariation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShippingListItem | null>(null);

  const [newItem, setNewItem] = useState<NewShippingListItem>({
    article_id: "",
    selected_variations: [],
    variations_data: {},
  });

  useEffect(() => {
    if (id) {
      fetchShippingDetails();
      fetchArticles();
    }
  }, [id]);

  useEffect(() => {
    const articleId = shipping?.article_id || newItem.article_id;
    if (articleId) {
      fetchVariations(articleId);
    }
  }, [newItem.article_id, shipping?.article_id]);

  const fetchShippingDetails = async () => {
    try {
      setLoading(true);

      // Fetch shipping data
      const { data: shippingData, error } = await supabase
        .from('shipping')
        .select('id, date, vendor_id, article_id, packing_list, remarks')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch vendor data separately
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('name')
        .eq('id', shippingData.vendor_id)
        .single();

      if (vendorError) throw vendorError;

      // Fetch article data separately if article_id exists
      let articleData = null;
      if (shippingData.article_id) {
        const { data: artData, error: artError } = await supabase
          .from('articles')
          .select('name, code')
          .eq('id', shippingData.article_id)
          .single();
        
        if (!artError) {
          articleData = artData;
        }
      }

      setShipping({
        ...shippingData,
        vendors: vendorData,
        articles: articleData
      });

      // Fetch shipping list items
      const { data: shippingListData, error: shippingListError } = await supabase
        .from('shipping_list')
        .select('id, shipping_id, article_id, color, size, ok, r5, r10, total_shipping')
        .eq('shipping_id', id);

      if (shippingListError) throw shippingListError;

      // Fetch articles data separately if there are shipping list items
      if (shippingListData && shippingListData.length > 0) {
        const articleIds = [...new Set(shippingListData.map(item => item.article_id))];
        const { data: articlesData, error: articlesError } = await supabase
          .from('articles')
          .select('id, name, code')
          .in('id', articleIds);

        if (articlesError) throw articlesError;

        // Combine shipping list data with articles data
        const enrichedShippingList = shippingListData.map(item => {
          const article = articlesData?.find(a => a.id === item.article_id);
          return {
            ...item,
            articles: article ? { name: article.name, code: article.code } : null
          };
        });

        setShippingList(enrichedShippingList);
      } else {
        setShippingList([]);
      }

    } catch (error) {
      console.error('Error fetching shipping details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shipping details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, name, code')
        .order('name');

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const fetchVariations = async (articleId: string) => {
    try {
      const { data, error } = await supabase
        .from('article_variations')
        .select('id, color, size')
        .eq('article_id', articleId)
        .order('color, size');

      if (error) throw error;
      setVariations(data || []);
    } catch (error) {
      console.error('Error fetching variations:', error);
    }
  };

  const calculateTotalShipping = (ok: number, r5: number, r10: number) => {
    return ok + r5 + r10;
  };

  const handleVariationSelection = (variationId: string, checked: boolean) => {
    const variation = variations.find(v => v.id === variationId);
    if (!variation) return;

    setNewItem(prev => {
      const newSelected = checked 
        ? [...prev.selected_variations, variationId]
        : prev.selected_variations.filter(id => id !== variationId);
      
      const newVariationsData = { ...prev.variations_data };
      
      if (checked) {
        newVariationsData[variationId] = {
          color: variation.color,
          size: variation.size,
          ok: 0,
          r5: 0,
          r10: 0
        };
      } else {
        delete newVariationsData[variationId];
      }

      return {
        ...prev,
        selected_variations: newSelected,
        variations_data: newVariationsData
      };
    });
  };

  const handleQuantityChange = (variationId: string, field: 'ok' | 'r5' | 'r10', value: number) => {
    setNewItem(prev => ({
      ...prev,
      variations_data: {
        ...prev.variations_data,
        [variationId]: {
          ...prev.variations_data[variationId],
          [field]: value
        }
      }
    }));
  };

  const handleAddShippingListItems = async () => {
    try {
      // Create multiple shipping list items for each selected variation
      const itemsToInsert = newItem.selected_variations.map(variationId => {
        const varData = newItem.variations_data[variationId];
        const totalShipping = calculateTotalShipping(varData.ok, varData.r5, varData.r10);
        
        return {
          shipping_id: id,
          article_id: shipping?.article_id || newItem.article_id,
          color: varData.color,
          size: varData.size,
          ok: varData.ok,
          r5: varData.r5,
          r10: varData.r10,
          total_shipping: totalShipping,
        };
      });

      const { data, error } = await supabase
        .from('shipping_list')
        .insert(itemsToInsert)
        .select('id, shipping_id, article_id, color, size, ok, r5, r10, total_shipping');

      if (error) throw error;

      // Fetch article data for the new items
      const { data: articleData, error: articleError } = await supabase
        .from('articles')
        .select('name, code')
        .eq('id', shipping?.article_id || newItem.article_id)
        .single();

      if (articleError) throw articleError;

      // Update article variation shipping totals for each variation
      for (const variationId of newItem.selected_variations) {
        const varData = newItem.variations_data[variationId];
        await updateArticleVariationShipping(shipping?.article_id || newItem.article_id, varData.color, varData.size);
      }

      // Add enriched items to the list
      const enrichedItems = data.map(item => ({
        ...item,
        articles: articleData
      }));

      setShippingList(prev => [...prev, ...enrichedItems]);
      setNewItem({
        article_id: "",
        selected_variations: [],
        variations_data: {},
      });
      setDialogOpen(false);

      toast({
        title: "Success",
        description: `Added ${data.length} shipping list item(s) successfully`
      });
    } catch (error) {
      console.error('Error adding shipping list items:', error);
      toast({
        title: "Error",
        description: "Failed to add shipping list items",
        variant: "destructive"
      });
    }
  };

  const updateArticleVariationShipping = async (articleId: string, color: string, size: string) => {
    try {
      // Get all shipping list items for this article variation
      const { data: shippingItems } = await supabase
        .from('shipping_list')
        .select('total_shipping')
        .eq('article_id', articleId)
        .eq('color', color)
        .eq('size', size);

      // Calculate total shipping for this variation
      const totalShipping = shippingItems?.reduce((sum, item) => sum + (item.total_shipping || 0), 0) || 0;

      // Update the article variation
      await supabase
        .from('article_variations')
        .update({ shipping: totalShipping })
        .eq('article_id', articleId)
        .eq('color', color)
        .eq('size', size);
    } catch (error) {
      console.error('Error updating article variation shipping:', error);
    }
  };

  const handleUpdateShippingListItem = async (item: ShippingListItem) => {
    try {
      const totalShipping = calculateTotalShipping(item.ok, item.r5, item.r10);

      const { error } = await supabase
        .from('shipping_list')
        .update({
          ok: item.ok,
          r5: item.r5,
          r10: item.r10,
          total_shipping: totalShipping,
        })
        .eq('id', item.id);

      if (error) throw error;

      // Update article variation shipping total
      await updateArticleVariationShipping(item.article_id, item.color, item.size);

      // Update local state
      setShippingList(prev => prev.map(i => 
        i.id === item.id 
          ? { ...i, ok: item.ok, r5: item.r5, r10: item.r10, total_shipping: totalShipping }
          : i
      ));

      setEditingItem(null);

      toast({
        title: "Success",
        description: "Shipping list item updated successfully"
      });
    } catch (error) {
      console.error('Error updating shipping list item:', error);
      toast({
        title: "Error",
        description: "Failed to update shipping list item",
        variant: "destructive"
      });
    }
  };

  const handleDeleteShippingListItem = async (itemId: string, articleId: string, color: string, size: string) => {
    try {
      const { error } = await supabase
        .from('shipping_list')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Update article variation shipping total
      await updateArticleVariationShipping(articleId, color, size);

      setShippingList(prev => prev.filter(item => item.id !== itemId));

      toast({
        title: "Success",
        description: "Shipping list item deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting shipping list item:', error);
      toast({
        title: "Error",
        description: "Failed to delete shipping list item",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div>Loading shipping details...</div>
      </div>
    );
  }

  if (!shipping) {
    return (
      <div className="text-center py-8">
        <p>Shipping record not found</p>
        <Button onClick={() => navigate('/shipping')} className="mt-4">
          Back to Shipping
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/shipping')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Shipping Details</h1>
        </div>
      </div>

      {/* Shipping Information */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Date</Label>
              <p className="text-sm">{format(new Date(shipping.date), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <Label>Vendor</Label>
              <p className="text-sm">{shipping.vendors?.name || 'Unknown Vendor'}</p>
            </div>
            <div>
              <Label>Article</Label>
              {shipping.articles ? (
                <p className="text-sm">{shipping.articles.name} ({shipping.articles.code})</p>
              ) : (
                <p className="text-sm text-muted-foreground">No article selected</p>
              )}
            </div>
            <div>
              <Label>Packing List</Label>
              {shipping.packing_list ? (
                <div className="text-sm">
                  <a href={shipping.packing_list} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    View Image
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No file uploaded</p>
              )}
            </div>
          </div>
          {shipping.remarks && (
            <div>
              <Label>Remarks</Label>
              <p className="text-sm">{shipping.remarks}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Shipping List</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Shipping List Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {shipping.articles ? (
                    <div>
                      <Label>Article</Label>
                      <div className="p-3 border rounded-md bg-muted/50">
                        <p className="font-medium">{shipping.articles.name}</p>
                        <p className="text-sm text-muted-foreground">({shipping.articles.code})</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label>Article</Label>
                      <Select 
                        value={newItem.article_id} 
                        onValueChange={(value) => setNewItem(prev => ({ 
                          ...prev, 
                          article_id: value, 
                          selected_variations: [],
                          variations_data: {}
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select article" />
                        </SelectTrigger>
                        <SelectContent>
                          {articles.map((article) => (
                            <SelectItem key={article.id} value={article.id}>
                              {article.name} ({article.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {((shipping?.article_id || newItem.article_id) && variations.length > 0) && (
                    <div>
                      <Label>Article Variations (Select Multiple)</Label>
                      <div className="space-y-4 mt-2 max-h-[400px] overflow-y-auto border rounded-md p-4">
                        {variations.map((variation) => {
                          const isSelected = newItem.selected_variations.includes(variation.id);
                          const varData = newItem.variations_data[variation.id];
                          
                          return (
                            <div key={variation.id} className="space-y-3 p-3 border rounded-md">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`variation-${variation.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleVariationSelection(variation.id, !!checked)}
                                />
                                <Label htmlFor={`variation-${variation.id}`} className="font-medium">
                                  {variation.color} - {variation.size}
                                </Label>
                              </div>
                              
                              {isSelected && varData && (
                                <div className="ml-6 grid grid-cols-3 gap-3">
                                  <div>
                                    <Label className="text-xs">OK</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={varData.ok}
                                      onChange={(e) => handleQuantityChange(variation.id, 'ok', parseInt(e.target.value) || 0)}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">R5</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={varData.r5}
                                      onChange={(e) => handleQuantityChange(variation.id, 'r5', parseInt(e.target.value) || 0)}
                                      className="h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">R10</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={varData.r10}
                                      onChange={(e) => handleQuantityChange(variation.id, 'r10', parseInt(e.target.value) || 0)}
                                      className="h-8"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {isSelected && varData && (
                                <div className="ml-6 text-xs text-muted-foreground">
                                  Total: {calculateTotalShipping(varData.ok, varData.r5, varData.r10)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {newItem.selected_variations.length > 0 && (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <Label>Summary</Label>
                          <p className="text-sm text-muted-foreground">
                            {newItem.selected_variations.length} variation(s) selected
                          </p>
                        </div>
                        <div className="text-right">
                          <Label>Total Items</Label>
                          <p className="text-sm font-medium">
                            {Object.values(newItem.variations_data).reduce((sum, data) => 
                              sum + calculateTotalShipping(data.ok, data.r5, data.r10), 0
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddShippingListItems}
                          disabled={newItem.selected_variations.length === 0}
                        >
                          Add Items ({newItem.selected_variations.length})
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {shippingList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No shipping list items found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Article</TableHead>
                  <TableHead className="w-24 text-center">Color</TableHead>
                  <TableHead className="w-16 text-center">Size</TableHead>
                  <TableHead className="w-20 text-center">OK</TableHead>
                  <TableHead className="w-20 text-center">R5</TableHead>
                  <TableHead className="w-20 text-center">R10</TableHead>
                  <TableHead className="w-20 text-center">Total</TableHead>
                  <TableHead className="w-24 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{item.articles?.name}</div>
                        <div className="text-xs text-muted-foreground">{item.articles?.code}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">{item.color}</TableCell>
                    <TableCell className="text-center text-sm">{item.size}</TableCell>
                    <TableCell className="text-center">
                      {editingItem?.id === item.id ? (
                        <Input
                          type="number"
                          min="0"
                          value={editingItem.ok}
                          onChange={(e) => setEditingItem(prev => prev ? { ...prev, ok: parseInt(e.target.value) || 0 } : null)}
                          className="w-16 h-8 text-center"
                        />
                      ) : (
                        <span onClick={() => setEditingItem(item)} className="cursor-pointer hover:bg-muted p-2 rounded">
                          {item.ok}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingItem?.id === item.id ? (
                        <Input
                          type="number"
                          min="0"
                          value={editingItem.r5}
                          onChange={(e) => setEditingItem(prev => prev ? { ...prev, r5: parseInt(e.target.value) || 0 } : null)}
                          className="w-16 h-8 text-center"
                        />
                      ) : (
                        <span onClick={() => setEditingItem(item)} className="cursor-pointer hover:bg-muted p-2 rounded">
                          {item.r5}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingItem?.id === item.id ? (
                        <Input
                          type="number"
                          min="0"
                          value={editingItem.r10}
                          onChange={(e) => setEditingItem(prev => prev ? { ...prev, r10: parseInt(e.target.value) || 0 } : null)}
                          className="w-16 h-8 text-center"
                        />
                      ) : (
                        <span onClick={() => setEditingItem(item)} className="cursor-pointer hover:bg-muted p-2 rounded">
                          {item.r10}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium text-sm">{item.total_shipping}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        {editingItem?.id === item.id ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleUpdateShippingListItem(editingItem)}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                              ×
                            </Button>
                          </>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Shipping Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this shipping item? This will update the article variation shipping total.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteShippingListItem(item.id, item.article_id, item.color, item.size)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}