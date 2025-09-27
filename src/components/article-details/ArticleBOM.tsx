import { useState, useEffect } from "react";
import { Plus, Filter, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddBOMLineDialog from "./bom/AddBOMLineDialog";
import BulkAddBOMDialog from "./bom/BulkAddBOMDialog";

interface BOMLine {
  id: string;
  article_id: string;
  category: string;
  item_name: string;
  color: string;
  size: string;
  uom: string;
  consump: number;
  total: number; // qty
  needed: number;
  receiving: number;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface ArticleBOMProps {
  articleId: string;
  onBOMUpdate?: () => void;
}

const CATEGORIES = ["Main Material", "Accessories", "Packing", "Other"];
const SIZES = ["F", "XS", "S", "M", "L", "XL", "S/M", "L/XL"];

export default function ArticleBOM({ articleId, onBOMUpdate }: ArticleBOMProps) {
  const [bomLines, setBomLines] = useState<BOMLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [itemFilter, setItemFilter] = useState<string>("");
  const [editingCell, setEditingCell] = useState<{row: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchBOMLines();
  }, [articleId]);

  const fetchBOMLines = async () => {
    try {
      const { data, error } = await supabase
        .from('boms')
        .select('*')
        .eq('article_id', articleId)
        .order('category', { ascending: true })
        .order('item_name', { ascending: true })
        .order('size', { ascending: true });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch BOM lines",
          variant: "destructive"
        });
        return;
      }

      setBomLines(data || []);
    } catch (error) {
      console.error('Error fetching BOM lines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCell = async (id: string, field: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    
    try {
      const bomLine = bomLines.find(line => line.id === id);
      if (!bomLine) return;

      let updateData: any = { [field]: numericValue };
      
      // Recalculate needed and balance
      if (field === 'consump' || field === 'total') {
        const newConsump = field === 'consump' ? numericValue : bomLine.consump;
        const newTotal = field === 'total' ? numericValue : bomLine.total;
        updateData.needed = newTotal * newConsump;
        updateData.balance = updateData.needed - bomLine.receiving;
      } else if (field === 'receiving') {
        updateData.balance = bomLine.needed - numericValue;
      }

      const { error } = await supabase
        .from('boms')
        .update(updateData)
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update BOM line",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setBomLines(prev => prev.map(line => 
        line.id === id 
          ? { ...line, ...updateData }
          : line
      ));

      toast({
        title: "Success",
        description: "BOM line updated successfully"
      });
      
      // Trigger BOM update callback to recalculate fabric/accs status
      onBOMUpdate?.();
    } catch (error) {
      console.error('Error updating BOM line:', error);
    }
    
    setEditingCell(null);
  };

  const handleDeleteBOMLine = async (id: string) => {
    try {
      const { error } = await supabase
        .from('boms')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete BOM line",
          variant: "destructive"
        });
        return;
      }

      setBomLines(prev => prev.filter(line => line.id !== id));
      toast({
        title: "Success",
        description: "BOM line deleted successfully"
      });
      
      // Trigger BOM update callback to recalculate fabric/accs status
      onBOMUpdate?.();
    } catch (error) {
      console.error('Error deleting BOM line:', error);
    }
  };

  const startEdit = (rowId: string, field: string, currentValue: string) => {
    setEditingCell({ row: rowId, field });
    setEditValue(currentValue);
  };

  const filteredBOMLines = bomLines.filter(line => {
    const categoryMatch = categoryFilter === "all" || line.category === categoryFilter;
    const itemMatch = itemFilter === "" || line.item_name.toLowerCase().includes(itemFilter.toLowerCase());
    return categoryMatch && itemMatch;
  });

  // Group by item name for summary
  const itemSummary = filteredBOMLines.reduce((acc, line) => {
    if (!acc[line.item_name]) {
      acc[line.item_name] = { needed: 0, receiving: 0, balance: 0 };
    }
    acc[line.item_name].needed += line.needed;
    acc[line.item_name].receiving += line.receiving;
    acc[line.item_name].balance += line.balance;
    return acc;
  }, {} as Record<string, { needed: number; receiving: number; balance: number }>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bill of Materials (BOM)</CardTitle>
          <CardDescription>Material requirements and inventory tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div>Loading BOM lines...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">BOM Lines (Bill of Materials)</h2>
          <p className="text-sm text-muted-foreground">Material requirements and inventory tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <BulkAddBOMDialog articleId={articleId} onSuccess={() => { fetchBOMLines(); onBOMUpdate?.(); }} />
          <AddBOMLineDialog articleId={articleId} onSuccess={() => { fetchBOMLines(); onBOMUpdate?.(); }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filter by category:</span>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Item name:</span>
          <Input
            placeholder="Search items..."
            value={itemFilter}
            onChange={(e) => setItemFilter(e.target.value)}
            className="w-48"
          />
        </div>
        {(categoryFilter !== "all" || itemFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCategoryFilter("all");
              setItemFilter("");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Summary by Item */}
      {Object.keys(itemSummary).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Summary by Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(itemSummary).map(([itemName, summary]) => (
                <div key={itemName} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{itemName}</h4>
                  <div className="space-y-1 text-sm">
                    <div>Needed: <span className="font-medium">{summary.needed.toFixed(2)}</span></div>
                    <div>Receiving: <span className="font-medium">{summary.receiving.toFixed(2)}</span></div>
                    <div className="flex items-center gap-2">
                      Balance: 
                      <Badge variant={summary.balance >= 0 ? "default" : "destructive"} className="text-xs">
                        {summary.balance.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* BOM Lines Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Consump</TableHead>
                <TableHead>Needed</TableHead>
                <TableHead>Receiving</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBOMLines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No BOM lines found. Add some materials to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBOMLines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      <Badge variant="outline">{line.category}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{line.item_name}</TableCell>
                    <TableCell>{line.size}</TableCell>
                    <TableCell>{line.color}</TableCell>
                    <TableCell>{line.uom}</TableCell>
                    <TableCell>
                      {editingCell?.row === line.id && editingCell?.field === 'total' ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleUpdateCell(line.id, 'total', editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateCell(line.id, 'total', editValue);
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          className="w-20"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                          onClick={() => startEdit(line.id, 'total', line.total.toString())}
                        >
                          {line.total}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingCell?.row === line.id && editingCell?.field === 'consump' ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleUpdateCell(line.id, 'consump', editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateCell(line.id, 'consump', editValue);
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          className="w-20"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                          onClick={() => startEdit(line.id, 'consump', line.consump.toString())}
                        >
                          {line.consump.toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{line.needed.toFixed(2)}</TableCell>
                    <TableCell>
                      {editingCell?.row === line.id && editingCell?.field === 'receiving' ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleUpdateCell(line.id, 'receiving', editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateCell(line.id, 'receiving', editValue);
                            } else if (e.key === 'Escape') {
                              setEditingCell(null);
                            }
                          }}
                          className="w-20"
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:bg-muted px-2 py-1 rounded"
                          onClick={() => startEdit(line.id, 'receiving', line.receiving.toString())}
                        >
                          {line.receiving.toFixed(2)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={line.balance >= 0 ? "default" : "destructive"}>
                        {line.balance.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBOMLine(line.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}