import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sortBySizeProperty } from "@/lib/sizeUtils";

interface Article {
  id: string;
  code: string;
  name: string;
  sizes: string[];
  application1?: string;
  application2?: string;
}

interface ArticleVariation {
  id: string;
  article_id: string;
  color: string;
  size: string;
  qty_order: number;
  cutting: number;
  application1: number;
  application2: number;
  sewing: number;
  finishing: number;
  qc: number;
  ready_to_shipping: number;
  shipping: number;
}

interface ArticleVariationsProps {
  article: Article;
  variations: ArticleVariation[];
  onUpdateVariations: (variations: ArticleVariation[]) => void;
}

const sizeOptions = ["F", "XS", "S", "M", "L", "XL", "S/M", "L/XL"];

export default function ArticleVariations({ article, variations, onUpdateVariations }: ArticleVariationsProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newVariation, setNewVariation] = useState({
    color: "",
    sizes: [] as string[],
    quantities: {} as Record<string, number>
  });

  const handleSizeChange = (size: string, checked: boolean) => {
    if (checked) {
      setNewVariation(prev => ({
        ...prev,
        sizes: [...prev.sizes, size],
        quantities: { ...prev.quantities, [size]: 0 }
      }));
    } else {
      setNewVariation(prev => ({
        ...prev,
        sizes: prev.sizes.filter(s => s !== size),
        quantities: Object.fromEntries(
          Object.entries(prev.quantities).filter(([key]) => key !== size)
        )
      }));
    }
  };

  const handleQuantityChange = (size: string, quantity: number) => {
    setNewVariation(prev => ({
      ...prev,
      quantities: { ...prev.quantities, [size]: quantity }
    }));
  };

  const handleAddVariation = async () => {
    if (!newVariation.color.trim()) {
      toast({
        title: "Error",
        description: "Color is required",
        variant: "destructive"
      });
      return;
    }

    if (newVariation.sizes.length === 0) {
      toast({
        title: "Error",
        description: "At least one size must be selected",
        variant: "destructive"
      });
      return;
    }

    const variationsToAdd = newVariation.sizes.map(size => ({
      article_id: article.id,
      color: newVariation.color.trim(),
      size,
      qty_order: newVariation.quantities[size] || 0,
      cutting: 0,
      application1: 0,
      application2: 0,
      sewing: 0,
      finishing: 0,
      qc: 0,
      ready_to_shipping: 0,
      shipping: 0
    }));

    try {
      const { data, error } = await supabase
        .from('article_variations')
        .insert(variationsToAdd)
        .select();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add variations",
          variant: "destructive"
        });
        return;
      }

      onUpdateVariations([...variations, ...data]);
      setIsAddDialogOpen(false);
      setNewVariation({
        color: "",
        sizes: [],
        quantities: {}
      });

      toast({
        title: "Success",
        description: `Added ${data.length} variation(s)`,
      });
    } catch (error) {
      console.error('Error adding variations:', error);
    }
  };

  const handleInlineUpdate = async (variationId: string, field: string, value: number) => {
    try {
      const { data, error } = await supabase
        .from('article_variations')
        .update({ [field]: value })
        .eq('id', variationId)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update variation",
          variant: "destructive"
        });
        return;
      }

      const updatedVariations = variations.map(v => 
        v.id === variationId ? data : v
      );
      onUpdateVariations(updatedVariations);
    } catch (error) {
      console.error('Error updating variation:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Article Variations</CardTitle>
          <CardDescription>Manage color and size combinations with quantities</CardDescription>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Variation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Variation</DialogTitle>
              <DialogDescription>Create color and size combinations</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  value={newVariation.color}
                  onChange={(e) => setNewVariation({ ...newVariation, color: e.target.value })}
                  placeholder="e.g., Blue Denim"
                  required
                />
              </div>

              <div>
                <Label>Sizes * (Select multiple)</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {sizeOptions.map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox
                        id={`size-${size}`}
                        checked={newVariation.sizes.includes(size)}
                        onCheckedChange={(checked) => handleSizeChange(size, !!checked)}
                      />
                      <Label htmlFor={`size-${size}`} className="text-sm">{size}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {newVariation.sizes.length > 0 && (
                <div>
                  <Label>Quantity Order (per size)</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {newVariation.sizes.map((size) => (
                      <div key={size} className="flex items-center gap-2">
                        <Badge variant="outline" className="w-12 justify-center">{size}</Badge>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={newVariation.quantities[size] || ''}
                          onChange={(e) => handleQuantityChange(size, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This quantity will be applied to each selected size
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVariation}>
                  Create Variations ({newVariation.sizes.length})
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <div className="overflow-x-auto">
          <div className="min-w-[700px] sm:min-w-full">
            {/* Header */}
            <div className="grid gap-1 text-xs font-medium mb-3 p-2 bg-muted rounded text-center" 
                 style={{ 
                   gridTemplateColumns: `60px 50px 70px 60px ${article.application1 ? '50px ' : ''}${article.application2 ? '50px ' : ''}60px 70px 50px 80px 60px 90px`
                 }}>
              <div>Color</div>
              <div>Size</div>
              <div>Qty Order</div>
              <div>Cutting</div>
              {article.application1 && <div>App1</div>}
              {article.application2 && <div>App2</div>}
              <div>Sewing</div>
              <div>Finishing</div>
              <div>QC</div>
              <div>Ready to Ship</div>
              <div>Shipping</div>
              <div>Balance</div>
            </div>
            
            {/* Data Rows */}
            {sortBySizeProperty(variations).map((variation) => {
              const balance = variation.shipping - variation.cutting;
              const balancePercentage = variation.cutting > 0 ? Math.round((balance / variation.cutting) * 100) : 0;
              
              return (
                <div key={variation.id} 
                     className="grid gap-1 text-xs p-2 border-b hover:bg-muted/50 items-center text-center"
                     style={{ 
                       gridTemplateColumns: `60px 50px 70px 60px ${article.application1 ? '50px ' : ''}${article.application2 ? '50px ' : ''}60px 70px 50px 80px 60px 90px`
                     }}>
                  <div>
                    <Badge variant="secondary" className="text-xs">{variation.color}</Badge>
                  </div>
                  <div>
                    <Badge variant="outline" className="text-xs">{variation.size}</Badge>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={variation.qty_order}
                      onChange={(e) => handleInlineUpdate(variation.id, 'qty_order', parseInt(e.target.value) || 0)}
                      className="w-full h-6 text-xs text-center p-1"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={variation.cutting}
                      onChange={(e) => handleInlineUpdate(variation.id, 'cutting', parseInt(e.target.value) || 0)}
                      className="w-full h-6 text-xs text-center p-1"
                    />
                  </div>
                  {article.application1 && (
                    <div>
                      <Input
                        type="number"
                        min="0"
                        value={variation.application1}
                        onChange={(e) => handleInlineUpdate(variation.id, 'application1', parseInt(e.target.value) || 0)}
                        className="w-full h-6 text-xs text-center p-1"
                      />
                    </div>
                  )}
                  {article.application2 && (
                    <div>
                      <Input
                        type="number"
                        min="0"
                        value={variation.application2}
                        onChange={(e) => handleInlineUpdate(variation.id, 'application2', parseInt(e.target.value) || 0)}
                        className="w-full h-6 text-xs text-center p-1"
                      />
                    </div>
                  )}
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={variation.sewing}
                      onChange={(e) => handleInlineUpdate(variation.id, 'sewing', parseInt(e.target.value) || 0)}
                      className="w-full h-6 text-xs text-center p-1"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={variation.finishing}
                      onChange={(e) => handleInlineUpdate(variation.id, 'finishing', parseInt(e.target.value) || 0)}
                      className="w-full h-6 text-xs text-center p-1"
                    />
                  </div>
                  <div className="font-medium">{variation.qc || "-"}</div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={variation.ready_to_shipping}
                      onChange={(e) => handleInlineUpdate(variation.id, 'ready_to_shipping', parseInt(e.target.value) || 0)}
                      className="w-full h-6 text-xs text-center p-1"
                    />
                  </div>
                  <div className="font-medium">{variation.shipping || "-"}</div>
                  <div className="font-medium text-center">
                    <div>{balance}</div>
                    <div className="text-xs text-muted-foreground">({balancePercentage}%)</div>
                  </div>
                </div>
              );
            })}

            {variations.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No variations added yet. Click "Add Variation" to get started.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}