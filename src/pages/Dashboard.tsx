import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductionFlowItem {
  id: string;
  article: string;
  buyer: string;
  style: string;
  totalOrder: number;
  cutting: number;
  application1: number;
  application2: number;
  sewing: number;
  finishing: number;
  qc: number;
  shipping: number;
  progress: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [filterBuyer, setFilterBuyer] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [productionFlowData, setProductionFlowData] = useState<ProductionFlowItem[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalArticles: 0,
    totalOrders: 0,
    completed: 0,
    inProgress: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch vendors for filter
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('id, name')
        .order('name');

      setVendors(vendorsData || []);

      // Fetch articles with vendors
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select(`
          id,
          name,
          code,
          style,
          vendor_id
        `)
        .order('created_at', { ascending: false });

      if (articlesError) {
        console.error('Error fetching articles:', articlesError);
        toast({
          title: "Error",
          description: "Failed to fetch articles data",
          variant: "destructive"
        });
        return;
      }

      // Fetch vendors data separately
      const vendorIds = [...new Set(articlesData?.map(a => a.vendor_id) || [])];
      const { data: vendorDetails, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name')
        .in('id', vendorIds);

      if (vendorError) {
        console.error('Error fetching vendor details:', vendorError);
      }

      // Fetch variations for all articles
      const articleIds = articlesData?.map(a => a.id) || [];
      let variationsData: any[] = [];
      
      if (articleIds.length > 0) {
        const { data: variations, error: variationsError } = await supabase
          .from('article_variations')
          .select(`
            article_id,
            qty_order,
            cutting,
            application1,
            application2,
            sewing,
            finishing,
            qc,
            shipping
          `)
          .in('article_id', articleIds);

        if (variationsError) {
          console.error('Error fetching variations:', variationsError);
        } else {
          variationsData = variations || [];
        }
      }
      if (articlesData) {
        const flowData: ProductionFlowItem[] = articlesData.map((article: any) => {
          const variations = variationsData.filter(v => v.article_id === article.id);
          const vendor = vendorDetails?.find(v => v.id === article.vendor_id);
          
          const totals = variations.reduce((acc, v) => ({
            totalOrder: acc.totalOrder + (v.qty_order || 0),
            cutting: acc.cutting + (v.cutting || 0),
            application1: acc.application1 + (v.application1 || 0),
            application2: acc.application2 + (v.application2 || 0),
            sewing: acc.sewing + (v.sewing || 0),
            finishing: acc.finishing + (v.finishing || 0),
            qc: acc.qc + (v.qc || 0),
            shipping: acc.shipping + (v.shipping || 0),
          }), {
            totalOrder: 0,
            cutting: 0,
            application1: 0,
            application2: 0,
            sewing: 0,
            finishing: 0,
            qc: 0,
            shipping: 0,
          });

          const progress = totals.totalOrder > 0 
            ? Math.round((totals.shipping / totals.totalOrder) * 100) 
            : 0;

          return {
            id: article.id,
            article: article.code,
            buyer: vendor?.name || 'Unknown Vendor',
            style: article.style || article.name,
            ...totals,
            progress
          };
        });

        setProductionFlowData(flowData);

        // Calculate summary
        const totalArticles = flowData.length;
        const totalOrders = flowData.reduce((sum, item) => sum + item.totalOrder, 0);
        const completed = flowData.reduce((sum, item) => sum + item.shipping, 0);
        const inProgress = totalOrders - completed;

        setSummary({
          totalArticles,
          totalOrders,
          completed,
          inProgress
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = productionFlowData.filter(item => {
    const buyerMatch = filterBuyer === "all" || item.buyer.toLowerCase().includes(filterBuyer.toLowerCase());
    const statusMatch = filterStatus === "all" || 
      (filterStatus === "completed" && item.progress === 100) ||
      (filterStatus === "in-progress" && item.progress < 100);
    return buyerMatch && statusMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Production Dashboard</h1>
          <p className="text-muted-foreground">Monitor global production flow and progress</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filterBuyer} onValueChange={setFilterBuyer}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by buyer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {vendors.map(vendor => (
                <SelectItem key={vendor.id} value={vendor.name.toLowerCase()}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Flow Overview</CardTitle>
          <CardDescription>Track production progress across all stages</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div>Loading production data...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1000px]">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium mb-4 p-2 bg-muted rounded">
                  <div className="col-span-2">Article</div>
                  <div>Buyer</div>
                  <div>Style</div>
                  <div>Total</div>
                  <div>Cutting</div>
                  <div>App1</div>
                  <div>App2</div>
                  <div>Sewing</div>
                  <div>Finishing</div>
                  <div>QC</div>
                  <div>Ship</div>
                  <div>Progress</div>
                </div>
                
                {filteredData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {productionFlowData.length === 0 ? "No production data available" : "No data matches the current filters"}
                  </div>
                ) : (
                  filteredData.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 text-sm p-2 border-b hover:bg-muted/50">
                      <div className="col-span-2 font-medium">{item.article}</div>
                      <div>
                        <Badge variant="outline">{item.buyer}</Badge>
                      </div>
                      <div>{item.style}</div>
                      <div className="font-medium">{item.totalOrder}</div>
                      <div>{item.cutting}</div>
                      <div>{item.application1}</div>
                      <div>{item.application2}</div>
                      <div>{item.sewing}</div>
                      <div>{item.finishing}</div>
                      <div>{item.qc}</div>
                      <div>{item.shipping}</div>
                      <div className="flex items-center gap-2">
                        <Progress value={item.progress} className="w-12 h-2" />
                        <span className="text-xs">{item.progress}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalArticles}</div>
            <p className="text-xs text-muted-foreground">Active production</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Pieces in production</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Ready for shipping</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.inProgress.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Various stages</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}