import { useState } from "react";
import { Search, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data
const variationsData = [
  {
    id: 1,
    articleCode: "T-SHIRT-001",
    articleName: "Classic Cotton Tee",
    buyer: "Nike",
    color: "White",
    size: "M",
    qtyOrder: 250,
    cutting: 200,
    application1: 180,
    application2: 160,
    sewing: 150,
    finishing: 100,
    qc: 90,
    shipping: 50,
    hasApplication1: true,
    hasApplication2: true
  },
  {
    id: 2,
    articleCode: "T-SHIRT-001",
    articleName: "Classic Cotton Tee",
    buyer: "Nike",
    color: "Black",
    size: "L",
    qtyOrder: 300,
    cutting: 250,
    application1: 220,
    application2: 200,
    sewing: 180,
    finishing: 120,
    qc: 100,
    shipping: 80,
    hasApplication1: true,
    hasApplication2: true
  },
  {
    id: 3,
    articleCode: "POLO-002",
    articleName: "Sport Polo Shirt",
    buyer: "Adidas",
    color: "Navy",
    size: "M",
    qtyOrder: 200,
    cutting: 200,
    application1: 0,
    application2: 0,
    sewing: 150,
    finishing: 100,
    qc: 80,
    shipping: 60,
    hasApplication1: false,
    hasApplication2: false
  },
];

export default function Variations() {
  const [search, setSearch] = useState("");
  const [filterArticle, setFilterArticle] = useState<string>("all");
  const [filterBuyer, setFilterBuyer] = useState<string>("all");

  const filteredVariations = variationsData.filter(variation => {
    const matchesSearch = 
      variation.articleCode.toLowerCase().includes(search.toLowerCase()) ||
      variation.color.toLowerCase().includes(search.toLowerCase()) ||
      variation.buyer.toLowerCase().includes(search.toLowerCase());
    
    const matchesArticle = filterArticle === "all" || variation.articleCode === filterArticle;
    const matchesBuyer = filterBuyer === "all" || variation.buyer === filterBuyer;
    
    return matchesSearch && matchesArticle && matchesBuyer;
  });

  const articles = [...new Set(variationsData.map(v => v.articleCode))];
  const vendors = [...new Set(variationsData.map(v => v.buyer))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Article Variations</h1>
          <p className="text-muted-foreground">Manage production quantities by color and size</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search variations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterArticle} onValueChange={setFilterArticle}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by article" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Articles</SelectItem>
            {articles.map((article) => (
              <SelectItem key={article} value={article}>{article}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterBuyer} onValueChange={setFilterBuyer}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by buyer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vendors</SelectItem>
            {vendors.map((vendor) => (
              <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Tracking</CardTitle>
          <CardDescription>Track quantities through each production stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Header */}
              <div className="grid gap-2 text-sm font-medium mb-4 p-3 bg-muted rounded" 
                   style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 100px" }}>
                <div>Article</div>
                <div>Buyer</div>
                <div>Color</div>
                <div>Size</div>
                <div>Qty Order</div>
                <div>Cutting</div>
                <div>App1</div>
                <div>App2</div>
                <div>Sewing</div>
                <div>Finishing</div>
                <div>QC</div>
                <div>Shipping</div>
                <div>Actions</div>
              </div>
              
              {/* Data Rows */}
              {filteredVariations.map((variation) => (
                <div key={variation.id} 
                     className="grid gap-2 text-sm p-3 border-b hover:bg-muted/50 items-center"
                     style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 100px" }}>
                  <div>
                    <div className="font-medium">{variation.articleCode}</div>
                    <div className="text-xs text-muted-foreground">{variation.articleName}</div>
                  </div>
                  <div>
                    <Badge variant="outline">{variation.buyer}</Badge>
                  </div>
                  <div>
                    <Badge variant="secondary">{variation.color}</Badge>
                  </div>
                  <div>
                    <Badge variant="outline">{variation.size}</Badge>
                  </div>
                  <div className="font-medium">
                    <Button variant="ghost" className="p-0 h-auto font-medium text-left justify-start">
                      {variation.qtyOrder}
                    </Button>
                  </div>
                  <div>{variation.cutting}</div>
                  <div>
                    {variation.hasApplication1 ? variation.application1 : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>
                    {variation.hasApplication2 ? variation.application2 : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>{variation.sewing}</div>
                  <div>{variation.finishing}</div>
                  <div>{variation.qc}</div>
                  <div>{variation.shipping}</div>
                  <div>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredVariations.length}</div>
            <p className="text-xs text-muted-foreground">Color-Size combinations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Ordered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredVariations.reduce((sum, v) => sum + v.qtyOrder, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Pieces ordered</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">In Production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredVariations.reduce((sum, v) => sum + v.sewing, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Pieces in sewing</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ready to Ship</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredVariations.reduce((sum, v) => sum + v.shipping, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Pieces completed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}