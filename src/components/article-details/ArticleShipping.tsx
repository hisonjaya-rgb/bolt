import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShippingData {
  id: string;
  date: string;
  packing_list?: string;
  remarks?: string;
  shipping_list: Array<{
    id: string;
    color: string;
    size: string;
    ok: number;
    r5: number;
    r10: number;
    total_shipping: number;
  }>;
}

interface ArticleShippingProps {
  articleId: string;
}

export default function ArticleShipping({ articleId }: ArticleShippingProps) {
  const [shippingData, setShippingData] = useState<ShippingData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchShippingData();
  }, [articleId]);

  const fetchShippingData = async () => {
    try {
      setLoading(true);
      
      // First get shipping records that match this article
      const { data: shippingRecords, error: shippingError } = await supabase
        .from('shipping')
        .select('id, date, packing_list, remarks')
        .eq('article_id', articleId)
        .order('date', { ascending: false });

      if (shippingError) {
        throw shippingError;
      }

      if (!shippingRecords || shippingRecords.length === 0) {
        setShippingData([]);
        return;
      }

      // Then get shipping list items for these shipping records
      const shippingIds = shippingRecords.map(s => s.id);
      const { data, error } = await supabase
        .from('shipping_list')
        .select(`
          shipping_id,
          color,
          size,
          ok,
          r5,
          r10,
          total_shipping
        `)
        .in('shipping_id', shippingIds)
        .eq('article_id', articleId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch shipping data",
          variant: "destructive"
        });
        return;
      }

      // Group shipping list items by shipping record
      const processedData: ShippingData[] = shippingRecords.map(shipping => {
        const shippingListItems = data?.filter(item => item.shipping_id === shipping.id) || [];
        
        return {
          id: shipping.id,
          date: shipping.date,
          packing_list: shipping.packing_list,
          remarks: shipping.remarks,
          shipping_list: shippingListItems.map(item => ({
            id: item.shipping_id,
            color: item.color,
            size: item.size,
            ok: item.ok,
            r5: item.r5,
            r10: item.r10,
            total_shipping: item.total_shipping
          }))
        };
      });

      setShippingData(processedData);
    } catch (error) {
      console.error('Error fetching shipping data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div>Loading shipping data...</div>
      </div>
    );
  }

  if (shippingData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shipping Records</CardTitle>
          <CardDescription>No shipping records found for this article</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Shipping Records</h3>
        <Badge variant="outline">{shippingData.length} shipments</Badge>
      </div>

      {shippingData.map((shipping) => (
        <Card key={shipping.id}>
          <CardHeader>
            <CardTitle className="text-base">
              Shipment - {format(new Date(shipping.date), 'MMM dd, yyyy')}
            </CardTitle>
            {shipping.packing_list && (
              <CardDescription>Packing List: {shipping.packing_list}</CardDescription>
            )}
            {shipping.remarks && (
              <CardDescription>Remarks: {shipping.remarks}</CardDescription>
            )}
          </CardHeader>
          
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Color</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>OK</TableHead>
                  <TableHead>R5</TableHead>
                  <TableHead>R10</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipping.shipping_list.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.color}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.ok}</TableCell>
                    <TableCell>{item.r5}</TableCell>
                    <TableCell>{item.r10}</TableCell>
                    <TableCell className="font-medium">{item.total_shipping}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-medium bg-muted/50">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell>
                    {shipping.shipping_list.reduce((sum, item) => sum + item.ok, 0)}
                  </TableCell>
                  <TableCell>
                    {shipping.shipping_list.reduce((sum, item) => sum + item.r5, 0)}
                  </TableCell>
                  <TableCell>
                    {shipping.shipping_list.reduce((sum, item) => sum + item.r10, 0)}
                  </TableCell>
                  <TableCell>
                    {shipping.shipping_list.reduce((sum, item) => sum + item.total_shipping, 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}