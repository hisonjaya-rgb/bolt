import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShippingRecord {
  id: string;
  date: string;
  packing_list?: string;
  remarks?: string;
  total_quantity: number;
  article?: {
    id: string;
    name: string;
    code: string;
  };
}

interface VendorShippingTableProps {
  vendorId: string;
}

export default function VendorShippingTable({ vendorId }: VendorShippingTableProps) {
  const [shippingRecords, setShippingRecords] = useState<ShippingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchShippingRecords();
  }, [vendorId]);

  const fetchShippingRecords = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('shipping')
        .select(`
          id,
          date,
          packing_list,
          remarks,
          article_id
        `)
        .eq('vendor_id', vendorId)
        .order('date', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch shipping records",
          variant: "destructive"
        });
        return;
      }

      // Fetch shipping list items separately to calculate total quantities
      const shippingIds = data?.map(s => s.id) || [];
      let shippingListData: any[] = [];
      
      if (shippingIds.length > 0) {
        const { data: listData, error: listError } = await supabase
          .from('shipping_list')
          .select(`
            shipping_id,
            total_shipping
          `)
          .in('shipping_id', shippingIds);

        if (!listError) {
          shippingListData = listData || [];
        }
      }

      // Fetch articles data separately if needed
      const articleIds = [...new Set(data?.map(s => s.article_id).filter(Boolean))];
      
      let articlesData: any[] = [];
      if (articleIds.length > 0) {
        const { data: articles, error: articlesError } = await supabase
          .from('articles')
          .select('id, name, code')
          .in('id', articleIds);
        
        if (!articlesError) {
          articlesData = articles || [];
        }
      }

      const processedRecords: ShippingRecord[] = data?.map(shipping => {
        let totalQuantity = 0;
        
        const shippingItems = shippingListData.filter(item => item.shipping_id === shipping.id);
        
        shippingItems.forEach((item: any) => {
          totalQuantity += item.total_shipping;
        });

        const article = articlesData.find(a => a.id === shipping.article_id);

        return {
          id: shipping.id,
          date: shipping.date,
          packing_list: shipping.packing_list,
          remarks: shipping.remarks,
          total_quantity: totalQuantity,
          article: article ? {
            id: article.id,
            name: article.name,
            code: article.code
          } : undefined
        };
      }) || [];

      setShippingRecords(processedRecords);
    } catch (error) {
      console.error('Error fetching shipping records:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div>Loading shipping records...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Records</CardTitle>
        <CardDescription>
          Shipping history for this vendor ({shippingRecords.length} records)
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {shippingRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No shipping records found for this vendor
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Article</TableHead>
                <TableHead>Total Qty</TableHead>
                <TableHead>Packing List</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shippingRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(new Date(record.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {record.article ? (
                      <div className="inline-flex items-center px-2 py-1 rounded-md border border-border bg-secondary/50 text-sm">
                        <span className="font-medium">{record.article.name}</span>
                        <span className="text-muted-foreground ml-1">({record.article.code})</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{record.total_quantity}</TableCell>
                  <TableCell className="max-w-32 truncate">
                    {record.packing_list || '-'}
                  </TableCell>
                  <TableCell className="max-w-32 truncate">
                    {record.remarks || '-'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/shipping/${record.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}