import React, { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Main Material", "Accessories", "Packing", "Other"];
const UNITS = ["YD", "MTR", "PCS", "KG", "M", "CM"];

const formSchema = z.object({
  category: z.string().min(1, "Category is required"),
  item_name: z.string().min(1, "Item name is required"),
  color: z.string().min(1, "Color is required"),
  uom: z.string().min(1, "Unit is required"),
  sizes: z.array(z.string()).min(1, "At least one size must be selected"),
  note: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SizeDetail {
  size: string;
  qty: number;
  consump: number;
}

interface BulkAddBOMDialogProps {
  articleId: string;
  onSuccess: () => void;
}

export default function BulkAddBOMDialog({ articleId, onSuccess }: BulkAddBOMDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sizeDetails, setSizeDetails] = useState<SizeDetail[]>([]);
  const [articleVariations, setArticleVariations] = useState<{color: string, size: string, qty_order: number}[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      item_name: "",
      color: "",
      uom: "PCS",
      sizes: [],
      note: "",
    },
  });

  const watchedSizes = form.watch("sizes");
  const watchedColor = form.watch("color");

  // Fetch article variations when dialog opens
  useEffect(() => {
    if (open) {
      fetchArticleVariations();
    }
  }, [open]);

  const fetchArticleVariations = async () => {
    try {
      const { data, error } = await supabase
        .from('article_variations')
        .select('color, size, qty_order')
        .eq('article_id', articleId);

      if (error) {
        console.error('Error fetching article variations:', error);
        return;
      }

      setArticleVariations(data || []);
      
      // Extract unique colors and sizes
      const colors = [...new Set(data?.map(v => v.color) || [])];
      const sizes = [...new Set(data?.map(v => v.size) || [])];
      
      setAvailableColors(colors);
      setAvailableSizes(sizes);
    } catch (error) {
      console.error('Error fetching article variations:', error);
    }
  };

  // Update size details when selected sizes or color change
  useEffect(() => {
    const newSizeDetails = watchedSizes.map(size => {
      const existing = sizeDetails.find(detail => detail.size === size);
      if (existing) {
        return existing;
      }
      
      // Auto-populate qty based on article variation
      let qty = 10; // default
      if (watchedColor) {
        const variation = articleVariations.find(v => v.color === watchedColor && v.size === size);
        if (variation) {
          qty = variation.qty_order;
        }
      }
      
      return { size, qty, consump: 1 };
    });
    setSizeDetails(newSizeDetails);
  }, [watchedSizes, watchedColor, articleVariations]);

  const updateSizeDetail = (size: string, field: 'qty' | 'consump', value: number) => {
    setSizeDetails(prev => prev.map(detail => 
      detail.size === size 
        ? { ...detail, [field]: value }
        : detail
    ));
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
        const bomLines = sizeDetails.map(detail => {
        const needed = detail.qty * detail.consump;
        return {
          article_id: articleId,
          category: data.category,
          item_name: data.item_name,
          color: data.color,
          size: detail.size,
          uom: data.uom,
          total: detail.qty,
          consump: detail.consump,
          needed: needed,
          receiving: 0,
          balance: needed,
        };
      });

      const { error } = await supabase
        .from('boms')
        .insert(bomLines);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add BOM lines",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Created ${bomLines.length} BOM lines successfully`
      });

      form.reset();
      setSizeDetails([]);
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding BOM lines:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Package className="h-4 w-4 mr-2" />
          Bulk Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Add BOM Lines</DialogTitle>
          <DialogDescription>
            Add multiple BOM lines for different sizes of the same item
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="item_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., main label" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableColors.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="uom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sizes"
              render={() => (
                <FormItem>
                  <FormLabel>Sizes * (Select multiple)</FormLabel>
                  <div className="grid grid-cols-4 gap-3">
                    {availableSizes.map((size) => (
                      <FormField
                        key={size}
                        control={form.control}
                        name="sizes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={size}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(size)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, size])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== size
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {size}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Size Details */}
            {sizeDetails.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Size Details</h4>
                <div className="space-y-3">
                  {sizeDetails.map((detail) => (
                    <div key={detail.size} className="grid grid-cols-3 gap-4 items-center p-3 border rounded-lg">
                      <div className="font-medium text-sm">{detail.size}</div>
                      <div>
                        <label className="text-xs text-muted-foreground">Qty</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={detail.qty}
                          onChange={(e) => updateSizeDetail(detail.size, 'qty', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Consump</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={detail.consump}
                          onChange={(e) => updateSizeDetail(detail.size, 'consump', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : `Create ${sizeDetails.length} BOM Lines`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}