import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
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
  size: z.string().min(1, "Size is required"),
  uom: z.string().min(1, "Unit is required"),
  total: z.number().min(0, "Quantity must be 0 or greater"),
  consump: z.number().min(0, "Consumption must be 0 or greater"),
  receiving: z.number().min(0, "Receiving must be 0 or greater"),
});

type FormData = z.infer<typeof formSchema>;

interface AddBOMLineDialogProps {
  articleId: string;
  onSuccess: () => void;
}

export default function AddBOMLineDialog({ articleId, onSuccess }: AddBOMLineDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
      size: "",
      uom: "PCS",
      total: 0,
      consump: 0,
      receiving: 0,
    },
  });

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

  // Watch color and size changes to auto-populate qty
  const watchColor = form.watch("color");
  const watchSize = form.watch("size");

  useEffect(() => {
    if (watchColor && watchSize) {
      const variation = articleVariations.find(v => v.color === watchColor && v.size === watchSize);
      if (variation) {
        form.setValue("total", variation.qty_order);
      }
    }
  }, [watchColor, watchSize, articleVariations]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const needed = data.total * data.consump;
      const balance = needed - data.receiving;

      const { error } = await supabase
        .from('boms')
        .insert({
          article_id: articleId,
          category: data.category,
          item_name: data.item_name,
          color: data.color,
          size: data.size,
          uom: data.uom,
          total: data.total,
          consump: data.consump,
          needed: needed,
          receiving: data.receiving,
          balance: balance,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add BOM line",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "BOM line added successfully"
      });

      form.reset();
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding BOM line:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add BOM Line
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New BOM Line</DialogTitle>
          <DialogDescription>
            Add a new material line to the Bill of Materials
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input placeholder="e.g., BABY TERRY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableSizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qty</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consump"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consump</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="receiving"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receiving</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                {loading ? "Adding..." : "Add BOM Line"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}