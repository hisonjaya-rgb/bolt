import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Plus, Eye, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DailyReportWithArticle {
  id: string;
  date: string;
  status: string;
  inspector: string;
  article_id: string;
  defect_count: number;
  checked_quantity: number;
  created_at: string;
  articles: {
    code: string;
    name: string;
    vendor_id: string;
    vendors: {
      name: string;
    };
  } | null;
}

interface DailyReport {
  id: string;
  date: string;
  status: string;
  inspector: string;
  article_id: string;
  defect_count: number;
  checked_quantity: number;
  created_at: string;
  articles: {
    code: string;
    name: string;
    vendor_name: string;
  };
}

export default function DailyReports() {
  const { toast } = useToast();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyReports();
  }, []);

  const fetchDailyReports = async () => {
    try {
      setLoading(true);

      // First fetch daily reports
      const { data: reportsData, error } = await supabase
        .from('daily_reports')
        .select(`
          id,
          date,
          status,
          inspector,
          article_id,
          defect_count,
          checked_quantity,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!reportsData || reportsData.length === 0) {
        setReports([]);
        return;
      }

      // Get unique article IDs
      const articleIds = [...new Set(reportsData.map(report => report.article_id))];

      // Fetch articles data separately
      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select(`
          id,
          code,
          name,
          vendor_id,
          vendors(name)
        `)
        .in('id', articleIds);

      if (articlesError) throw articlesError;

      // Fetch QC results for all reports to calculate proper checked quantities
      const reportIds = reportsData.map(report => report.id);
      const { data: qcResults, error: qcError } = await supabase
        .from('qc_results')
        .select('daily_report_id, ok, r5, r10')
        .in('daily_report_id', reportIds);

      if (qcError) throw qcError;

      // Calculate QC totals per report
      const qcTotalsByReport = new Map<string, number>();
      qcResults?.forEach(qc => {
        const total = (qc.ok || 0) + (qc.r5 || 0) + (qc.r10 || 0);
        qcTotalsByReport.set(qc.daily_report_id, (qcTotalsByReport.get(qc.daily_report_id) || 0) + total);
      });

      // Transform the data to match our interface
      const transformedData: DailyReport[] = reportsData.map(report => {
        const article = articlesData?.find(a => a.id === report.article_id);
        const qcTotal = qcTotalsByReport.get(report.id) || 0;
        const calculatedCheckedQuantity = qcTotal + (report.defect_count || 0);
        
        // Update the checked_quantity in the database if it's different
        if (calculatedCheckedQuantity !== report.checked_quantity) {
          supabase
            .from('daily_reports')
            .update({ checked_quantity: calculatedCheckedQuantity })
            .eq('id', report.id)
            .then();
        }
        
        return {
          ...report,
          checked_quantity: calculatedCheckedQuantity,
          articles: {
            code: article?.code || '',
            name: article?.name || '',
            vendor_name: article?.vendors?.name || 'Unknown Vendor'
          }
        };
      });

      setReports(transformedData);
    } catch (error) {
      console.error('Error fetching daily reports:', error);
      toast({
        title: "Error",
        description: "Failed to fetch daily reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId: string, articleId: string) => {
    try {
      // First, get QC results to subtract from article variations
      const { data: qcResults } = await supabase
        .from('qc_results')
        .select('color, size, ok, r5, r10')
        .eq('daily_report_id', reportId);

      // Delete QC results
      await supabase
        .from('qc_results')
        .delete()
        .eq('daily_report_id', reportId);

      // Delete measurement checks
      await supabase
        .from('measurement_checks')
        .delete()
        .eq('daily_report_id', reportId);

      // Delete the daily report
      const { error } = await supabase
        .from('daily_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      // Update article variations QC totals
      if (qcResults && qcResults.length > 0) {
        // Get all remaining QC results for this article
        const { data: remainingQcResults } = await supabase
          .from('qc_results')
          .select('color, size, ok, r5, r10')
          .eq('article_id', articleId);

        // Calculate new totals
        const qcTotals = new Map<string, number>();
        remainingQcResults?.forEach(qc => {
          const key = `${qc.color}-${qc.size}`;
          const total = (qc.ok || 0) + (qc.r5 || 0) + (qc.r10 || 0);
          qcTotals.set(key, (qcTotals.get(key) || 0) + total);
        });

        // Get article variations to update
        const { data: variations } = await supabase
          .from('article_variations')
          .select('id, color, size')
          .eq('article_id', articleId);

        // Update each variation's QC total
        if (variations) {
          for (const variation of variations) {
            const key = `${variation.color}-${variation.size}`;
            const qcTotal = qcTotals.get(key) || 0;
            
            await supabase
              .from('article_variations')
              .update({ qc: qcTotal })
              .eq('id', variation.id);
          }
        }
      }

      toast({
        title: "Success",
        description: "Daily report deleted successfully"
      });

      // Refresh the list
      fetchDailyReports();
    } catch (error) {
      console.error('Error deleting daily report:', error);
      toast({
        title: "Error",
        description: "Failed to delete daily report",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'cutting':
        return 'bg-blue-100 text-blue-800';
      case 'sewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'finishing':
        return 'bg-purple-100 text-purple-800';
      case 'qc':
        return 'bg-orange-100 text-orange-800';
      case 'shipping':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div>Loading daily reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Reports</h1>
        <Button asChild>
          <Link to="/add-daily-report">
            <Plus className="mr-2 h-4 w-4" />
            Add Daily Report
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Daily Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No daily reports found.</p>
              <Button asChild className="mt-4">
                <Link to="/add-daily-report">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Daily Report
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Checked Qty</TableHead>
                  <TableHead>Defect Count</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow 
                    key={report.id}
                    className="interactive-row"
                    onClick={() => window.location.href = `/daily-reports/${report.id}`}
                  >
                    <TableCell>
                      {format(new Date(report.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.articles.name}</div>
                        <div className="text-sm text-muted-foreground">{report.articles.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>{report.articles.vendor_name}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.inspector}</TableCell>
                    <TableCell>{report.checked_quantity || 0}</TableCell>
                    <TableCell>{report.defect_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Daily Report</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this daily report? This will also remove all QC results and measurement checks associated with it, and update the article variation QC totals accordingly.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteReport(report.id, report.article_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}