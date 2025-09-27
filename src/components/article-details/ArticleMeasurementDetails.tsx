import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sortSizes } from "@/lib/sizeUtils";

interface ArticleVariation {
  size: string;
}

interface MeasurementDetail {
  id?: string;
  article_id: string;
  measurement: string;
  f?: number;
  xs?: number;
  s?: number;
  m?: number;
  l?: number;
  xl?: number;
  s_m?: number;
  l_xl?: number;
}

interface ArticleMeasurementDetailsProps {
  articleId: string;
  variations: ArticleVariation[];
}

export default function ArticleMeasurementDetails({ 
  articleId, 
  variations 
}: ArticleMeasurementDetailsProps) {
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState<MeasurementDetail[]>([]);
  const [loading, setLoading] = useState(true);

  // Get unique sizes from variations, sorted by standard order
  const availableSizes = sortSizes([...new Set(variations.map(v => v.size))]);
  
  // Define size columns mapping
  const sizeColumns = {
    'F': 'f',
    'XS': 'xs',
    'S': 's',
    'M': 'm',
    'L': 'l',
    'XL': 'xl',
    'S/M': 's_m',
    'L/XL': 'l_xl'
  };

  useEffect(() => {
    fetchMeasurements();
  }, [articleId]);

  const fetchMeasurements = async () => {
    try {
      const { data, error } = await supabase
        .from('article_measurements')
        .select('*')
        .eq('article_id', articleId)
        .order('measurement');

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch measurements",
          variant: "destructive"
        });
        return;
      }

      setMeasurements(data || []);
    } catch (error) {
      console.error('Error fetching measurements:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMeasurement = async () => {
    const newMeasurement: MeasurementDetail = {
      article_id: articleId,
      measurement: "New Measurement"
    };

    try {
      const { data, error } = await supabase
        .from('article_measurements')
        .insert([newMeasurement])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add measurement",
          variant: "destructive"
        });
        return;
      }

      setMeasurements([...measurements, data]);
      toast({
        title: "Success",
        description: "Measurement added successfully"
      });
    } catch (error) {
      console.error('Error adding measurement:', error);
    }
  };

  const updateMeasurement = async (id: string, field: string, value: string | number) => {
    const updatedMeasurements = measurements.map(m => 
      m.id === id ? { ...m, [field]: field === 'measurement' ? value : parseFloat(value as string) || null } : m
    );
    setMeasurements(updatedMeasurements);

    try {
      const { error } = await supabase
        .from('article_measurements')
        .update({ [field]: field === 'measurement' ? value : parseFloat(value as string) || null })
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update measurement",
          variant: "destructive"
        });
        fetchMeasurements(); // Revert changes
      }
    } catch (error) {
      console.error('Error updating measurement:', error);
      fetchMeasurements(); // Revert changes
    }
  };

  const deleteMeasurement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('article_measurements')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete measurement",
          variant: "destructive"
        });
        return;
      }

      setMeasurements(measurements.filter(m => m.id !== id));
      toast({
        title: "Success",
        description: "Measurement deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting measurement:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div>Loading measurements...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Measurement Details</CardTitle>
          <Button onClick={addMeasurement} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Measurement
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Measurement</TableHead>
                {availableSizes.map((size) => (
                  <TableHead key={size} className="text-center min-w-[80px]">
                    {size}
                  </TableHead>
                ))}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {measurements.map((measurement) => (
                <TableRow key={measurement.id}>
                  <TableCell>
                    <Input
                      value={measurement.measurement}
                      onChange={(e) => updateMeasurement(measurement.id!, 'measurement', e.target.value)}
                      className="w-full"
                    />
                  </TableCell>
                  {availableSizes.map((size) => {
                    const columnKey = sizeColumns[size as keyof typeof sizeColumns];
                    return (
                      <TableCell key={size}>
                        <Input
                          type="number"
                          step="0.1"
                          value={measurement[columnKey as keyof MeasurementDetail] || ''}
                          onChange={(e) => updateMeasurement(measurement.id!, columnKey, e.target.value)}
                          className="w-full text-center"
                          placeholder="0"
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMeasurement(measurement.id!)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {measurements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={availableSizes.length + 2} className="text-center text-muted-foreground">
                    No measurements added yet. Click "Add Measurement" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}