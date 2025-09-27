import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const statusOptions = [
  "Pattern Check",
  "PPS Check", 
  "Inline Cutting",
  "Inline Sewing",
  "Photoshoot Check",
  "Prefinal",
  "Final + Measurement",
  "Final"
];

const formSchema = z.object({
  date: z.date(),
  status: z.enum(["Pattern Check", "PPS Check", "Inline Cutting", "Inline Sewing", "Photoshoot Check", "Prefinal", "Final + Measurement", "Final"] as const),
  article_id: z.string().min(1, "Article is required"),
  article_variations: z.array(z.string()).min(1, "At least one variation is required"),
  measurement: z.boolean(),
  measurement_list: z.array(z.string()),
});

type FormData = z.infer<typeof formSchema>;

type DailyReportStatus = "Pattern Check" | "PPS Check" | "Inline Cutting" | "Inline Sewing" | "Photoshoot Check" | "Prefinal" | "Final + Measurement" | "Final";

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

interface MeasurementDetail {
  id: string;
  measurement: string;
}

export default function AddDailyReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get vendor ID from state if coming from vendor details
  const vendorId = location.state?.vendorId;
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [variations, setVariations] = useState<ArticleVariation[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementDetail[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      status: "Pattern Check",
      article_id: "",
      article_variations: [],
      measurement: false,
      measurement_list: [],
    },
  });

  const selectedArticleId = form.watch("article_id");
  const measurementEnabled = form.watch("measurement");

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    if (selectedArticleId) {
      fetchVariations(selectedArticleId);
      fetchMeasurements(selectedArticleId);
    }
  }, [selectedArticleId]);

  const fetchArticles = async () => {
    try {
      let query = supabase
        .from('articles')
        .select('id, name, code')
        .order('name');

      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch articles",
        variant: "destructive"
      });
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

  const fetchMeasurements = async (articleId: string) => {
    try {
      const { data, error } = await supabase
        .from('article_measurements')
        .select('id, measurement')
        .eq('article_id', articleId)
        .order('measurement');

      if (error) throw error;
      setMeasurements(data || []);
    } catch (error) {
      console.error('Error fetching measurements:', error);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      const { data: reportData, error } = await supabase
        .from('daily_reports')
        .insert({
          date: data.date.toISOString().split('T')[0],
          status: data.status,
          article_id: data.article_id,
          article_variations: data.article_variations,
          measurement: data.measurement,
          measurement_list: data.measurement_list,
          inspector: (await supabase.auth.getUser()).data.user?.email || '',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Daily report created successfully",
      });

      navigate(`/daily-reports/${reportData.id}`);
    } catch (error) {
      console.error('Error creating daily report:', error);
      toast({
        title: "Error",
        description: "Failed to create daily report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add Daily Report</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
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
                  name="article_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Article</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select article" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {articles.map((article) => (
                            <SelectItem key={article.id} value={article.id}>
                              {article.name} ({article.code})
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
                  name="measurement"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Measurement</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {selectedArticleId && variations.length > 0 && (
                <FormField
                  control={form.control}
                  name="article_variations"
                  render={() => (
                    <FormItem>
                      <FormLabel>Article Variations</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {variations.map((variation) => (
                          <FormField
                            key={variation.id}
                            control={form.control}
                            name="article_variations"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={variation.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(variation.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, variation.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== variation.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {variation.color} - {variation.size}
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
              )}

              {measurementEnabled && measurements.length > 0 && (
                <FormField
                  control={form.control}
                  name="measurement_list"
                  render={() => (
                    <FormItem>
                      <FormLabel>Measurement List</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {measurements.map((measurement) => (
                          <FormField
                            key={measurement.id}
                            control={form.control}
                            name="measurement_list"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={measurement.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(measurement.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, measurement.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== measurement.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {measurement.measurement}
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
              )}

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Daily Report"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}