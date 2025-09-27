import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, Eye, Trash2, Pencil } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
interface ShippingWithVendor {
  id: string;
  date: string;
  vendor_id: string;
  article_id: string | null;
  packing_list: string | null;
  remarks: string | null;
  created_at: string;
  vendors: {
    name: string;
  } | null;
  articles: {
    name: string;
    code: string;
  } | null;
}
interface Shipping {
  id: string;
  date: string;
  vendor_name: string;
  article_name?: string;
  article_code?: string;
  packing_list: string | null;
  remarks: string | null;
  created_at: string;
  total_quantity: number;
}
export default function Shipping() {
  const {
    toast
  } = useToast();
  const [shippingList, setShippingList] = useState<Shipping[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchShipping();
  }, []);
  const fetchShipping = async () => {
    try {
      setLoading(true);

      // First fetch shipping records
      const {
        data: shippingData,
        error
      } = await supabase.from('shipping').select(`
          id,
          date,
          vendor_id,
          article_id,
          packing_list,
          remarks,
          created_at
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      if (!shippingData || shippingData.length === 0) {
        setShippingList([]);
        return;
      }

      // Get unique vendor IDs
      const vendorIds = [...new Set(shippingData.map(shipping => shipping.vendor_id))];

      // Fetch vendors data separately
      const {
        data: vendorsData,
        error: vendorsError
      } = await supabase.from('vendors').select('id, name').in('id', vendorIds);
      if (vendorsError) throw vendorsError;

      // Get unique article IDs (excluding nulls)
      const articleIds = [...new Set(shippingData.map(shipping => shipping.article_id).filter(Boolean))];

      // Fetch articles data separately if there are any
      let articlesData: any[] = [];
      if (articleIds.length > 0) {
        const {
          data: articlesResult,
          error: articlesError
        } = await supabase.from('articles').select('id, name, code').in('id', articleIds);
        if (articlesError) throw articlesError;
        articlesData = articlesResult || [];
      }

      // Fetch shipping list totals for each shipping record
      const shippingIds = shippingData.map(shipping => shipping.id);
      const {
        data: shippingListData,
        error: shippingListError
      } = await supabase.from('shipping_list').select('shipping_id, total_shipping').in('shipping_id', shippingIds);
      if (shippingListError) throw shippingListError;

      // Calculate totals per shipping record
      const totalsByShipping = new Map<string, number>();
      shippingListData?.forEach(item => {
        totalsByShipping.set(item.shipping_id, (totalsByShipping.get(item.shipping_id) || 0) + (item.total_shipping || 0));
      });

      // Transform the data
      const transformedData: Shipping[] = shippingData.map(shipping => {
        const vendor = vendorsData?.find(v => v.id === shipping.vendor_id);
        const article = articlesData?.find(a => a.id === shipping.article_id);
        const totalQuantity = totalsByShipping.get(shipping.id) || 0;
        return {
          ...shipping,
          vendor_name: vendor?.name || 'Unknown Vendor',
          article_name: article?.name,
          article_code: article?.code,
          total_quantity: totalQuantity
        };
      });
      setShippingList(transformedData);
    } catch (error) {
      console.error('Error fetching shipping records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shipping records",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteShipping = async (shippingId: string) => {
    try {
      // First, get shipping list items to subtract from article variations
      const {
        data: shippingListItems
      } = await supabase.from('shipping_list').select('article_id, color, size, total_shipping').eq('shipping_id', shippingId);

      // Delete shipping list items
      await supabase.from('shipping_list').delete().eq('shipping_id', shippingId);

      // Delete the shipping record
      const {
        error
      } = await supabase.from('shipping').delete().eq('id', shippingId);
      if (error) throw error;

      // Update article variations shipping totals
      if (shippingListItems && shippingListItems.length > 0) {
        // Group by article_id
        const articleIds = [...new Set(shippingListItems.map(item => item.article_id))];
        for (const articleId of articleIds) {
          // Get all remaining shipping list items for this article
          const {
            data: remainingShippingItems
          } = await supabase.from('shipping_list').select('color, size, total_shipping').eq('article_id', articleId);

          // Calculate new totals
          const shippingTotals = new Map<string, number>();
          remainingShippingItems?.forEach(item => {
            const key = `${item.color}-${item.size}`;
            shippingTotals.set(key, (shippingTotals.get(key) || 0) + (item.total_shipping || 0));
          });

          // Get article variations to update
          const {
            data: variations
          } = await supabase.from('article_variations').select('id, color, size').eq('article_id', articleId);

          // Update each variation's shipping total
          if (variations) {
            for (const variation of variations) {
              const key = `${variation.color}-${variation.size}`;
              const shippingTotal = shippingTotals.get(key) || 0;
              await supabase.from('article_variations').update({
                shipping: shippingTotal
              }).eq('id', variation.id);
            }
          }
        }
      }
      toast({
        title: "Success",
        description: "Shipping record deleted successfully"
      });

      // Refresh the list
      fetchShipping();
    } catch (error) {
      console.error('Error deleting shipping record:', error);
      toast({
        title: "Error",
        description: "Failed to delete shipping record",
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return <div className="flex justify-center items-center py-8">
        <div>Loading shipping records...</div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shipping</h1>
        <Button asChild>
          <Link to="/add-shipping">
            <Plus className="mr-2 h-4 w-4" />
            Add Shipping
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Shipping Records</CardTitle>
        </CardHeader>
        <CardContent>
          {shippingList.length === 0 ? <div className="text-center py-8">
              <p className="text-muted-foreground">No shipping records found.</p>
              <Button asChild className="mt-4">
                <Link to="/add-shipping">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Shipping Record
                </Link>
              </Button>
            </div> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Total Quantity</TableHead>
                  <TableHead>Packing List</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingList.map(shipping => <TableRow 
                  key={shipping.id}
                  className="interactive-row"
                  onClick={() => window.location.href = `/shipping/${shipping.id}`}
                >
                    <TableCell>
                      {format(new Date(shipping.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{shipping.vendor_name}</TableCell>
                    <TableCell>
                      {shipping.article_name ? <div className="inline-flex items-center px-2 py-1 rounded-md border border-border bg-secondary/50 text-sm">
                          <span className="font-medium">{shipping.article_name}</span>
                          
                        </div> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>{shipping.total_quantity}</TableCell>
                    <TableCell>
                      {shipping.packing_list ? <Badge variant="secondary">Uploaded</Badge> : <Badge variant="outline">No file</Badge>}
                    </TableCell>
                    <TableCell>
                      {shipping.remarks ? <div className="max-w-xs truncate" title={shipping.remarks}>
                          {shipping.remarks}
                        </div> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link to={`/edit-shipping/${shipping.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Shipping Record</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this shipping record? This will also remove all shipping list items associated with it, and update the article variation shipping totals accordingly.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteShipping(shipping.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>}
        </CardContent>
      </Card>
    </div>;
}