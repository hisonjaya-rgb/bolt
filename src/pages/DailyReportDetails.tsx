import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CustomSignatureCanvas, SignatureCanvasRef } from "@/components/ui/signature-canvas";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { sortSizes, sortBySizeProperty } from "@/lib/sizeUtils";
const measurementValues = ["-2.5", "-2", "-1.5", "-1", "-0.5", "✓", "+0.5", "+1", "+1.5", "+2", "+2.5"];
interface DailyReport {
  id: string;
  date: string;
  status: string;
  inspector: string;
  article_id: string;
  article_variations: string[];
  measurement: boolean;
  measurement_list: string[];
  remarks?: string;
  notes?: string;
  defect_count: number;
  checked_quantity: number;
  signature?: string;
  vendor_signature?: string;
}
interface Article {
  id: string;
  code: string;
  name: string;
  vendor_id: string;
  style?: string;
  pic?: string;
  application1?: string;
  application2?: string;
  notes?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  low_stock: boolean;
  overstock: boolean;
  sizes: string[];
  ppm: string;
  garment_sheet_url?: string;
  fabric: string;
  accs: string;
  check_pattern: string;
  pps: string;
  photoshoot: string;
  collection?: string;
  vendors: {
    name: string;
  };
}
interface ArticleVariation {
  id: string;
  color: string;
  size: string;
  qty_order: number;
  cutting: number;
}
interface QCResult {
  id: string;
  color: string;
  size: string;
  ok: number;
  r5: number;
  r10: number;
}
type MeasurementValue = "-2.5" | "-2" | "-1.5" | "-1" | "-0.5" | "✓" | "+0.5" | "+1" | "+1.5" | "+2" | "+2.5";
interface MeasurementCheck {
  id: string;
  measurement_detail_id: string;
  measurement_detail: {
    measurement: string;
  };
  f_1?: MeasurementValue;
  f_2?: MeasurementValue;
  f_3?: MeasurementValue;
  xs_1?: MeasurementValue;
  xs_2?: MeasurementValue;
  xs_3?: MeasurementValue;
  s_1?: MeasurementValue;
  s_2?: MeasurementValue;
  s_3?: MeasurementValue;
  m_1?: MeasurementValue;
  m_2?: MeasurementValue;
  m_3?: MeasurementValue;
  l_1?: MeasurementValue;
  l_2?: MeasurementValue;
  l_3?: MeasurementValue;
  xl_1?: MeasurementValue;
  xl_2?: MeasurementValue;
  xl_3?: MeasurementValue;
  sm_1?: MeasurementValue;
  sm_2?: MeasurementValue;
  sm_3?: MeasurementValue;
  lxl_1?: MeasurementValue;
  lxl_2?: MeasurementValue;
  lxl_3?: MeasurementValue;
}
interface ArticleImage {
  id: string;
  image_url: string;
  status: string;
  note?: string;
  created_at: string;
}
export default function DailyReportDetails() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const {
    toast
  } = useToast();
  const [report, setReport] = useState<DailyReport | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [variations, setVariations] = useState<ArticleVariation[]>([]);
  const [qcResults, setQcResults] = useState<QCResult[]>([]);
  const [measurementChecks, setMeasurementChecks] = useState<MeasurementCheck[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [selectedMeasurements, setSelectedMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [defectCount, setDefectCount] = useState<number>(0);

  // Image upload states
  const [images, setImages] = useState<ArticleImage[]>([]);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [newImage, setNewImage] = useState({
    image_url: "",
    status: "Fabric",
    note: ""
  });
  const [uploading, setUploading] = useState(false);

  // Signature states
  const inspectorSigRef = useRef<SignatureCanvasRef>(null);
  const vendorSigRef = useRef<SignatureCanvasRef>(null);
  const [inspectorSignature, setInspectorSignature] = useState<string>("");
  const [vendorSignature, setVendorSignature] = useState<string>("");
  useEffect(() => {
    if (id) {
      fetchDailyReport();
    }
  }, [id]);
  const fetchDailyReport = async () => {
    if (!id) return;
    try {
      setLoading(true);

      // Fetch daily report
      const {
        data: reportData,
        error: reportError
      } = await supabase.from('daily_reports').select('*').eq('id', id).single();
      if (reportError) throw reportError;
      setReport(reportData);
      setDefectCount(reportData.defect_count || 0);

      // Set signature values if they exist
      setInspectorSignature(reportData.signature || "");
      setVendorSignature(reportData.vendor_signature || "");

      // Fetch article with vendor info
      const {
        data: articleData,
        error: articleError
      } = await supabase.from('articles').select(`
          *,
          vendors!inner(name)
        `).eq('id', reportData.article_id).single();
      if (articleError) throw articleError;

      // Transform the data to match our interface
      const transformedArticle = {
        ...articleData,
        vendors: Array.isArray(articleData.vendors) ? articleData.vendors[0] : articleData.vendors
      };
      setArticle(transformedArticle);

      // Fetch variations for selected variations
      const {
        data: variationsData,
        error: variationsError
      } = await supabase.from('article_variations').select('id, color, size, qty_order, cutting').in('id', reportData.article_variations);
      if (variationsError) throw variationsError;
      setVariations(sortBySizeProperty(variationsData || []));

      // Get unique sizes and sort them
      const sizes = [...new Set(variationsData?.map(v => v.size) || [])];
      setAvailableSizes(sortSizes(sizes));

      // Fetch QC results
      const {
        data: qcData,
        error: qcError
      } = await supabase.from('qc_results').select('*').eq('daily_report_id', id);
      if (qcError) throw qcError;
      setQcResults(qcData || []);

      // Fetch measurement checks
      const {
        data: measurementData,
        error: measurementError
      } = await supabase.from('measurement_checks').select(`
          *,
          measurement_detail:article_measurements(measurement)
        `).eq('daily_report_id', id);
      if (measurementError) throw measurementError;
      setMeasurementChecks(measurementData || []);

      // Fetch selected measurements from article_measurements table
      if (reportData.measurement_list && reportData.measurement_list.length > 0) {
        const {
          data: selectedMeasurementsData,
          error: selectedMeasurementsError
        } = await supabase.from('article_measurements').select('*').eq('article_id', reportData.article_id).in('id', reportData.measurement_list);
        if (selectedMeasurementsError) throw selectedMeasurementsError;
        setSelectedMeasurements(selectedMeasurementsData || []);
      }

      // Fetch article images
      if (reportData.article_id) {
        const {
          data: imagesData,
          error: imagesError
        } = await supabase.from('article_images').select('*').eq('article_id', reportData.article_id).order('created_at', {
          ascending: false
        });
        if (imagesError) throw imagesError;
        setImages(imagesData || []);
      }
    } catch (error) {
      console.error('Error fetching daily report:', error);
      toast({
        title: "Error",
        description: "Failed to fetch daily report details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const updateQCResult = async (color: string, size: string, field: 'ok' | 'r5' | 'r10', value: number) => {
    try {
      const existingResult = qcResults.find(qc => qc.color === color && qc.size === size);
      if (existingResult) {
        const {
          error
        } = await supabase.from('qc_results').update({
          [field]: value
        }).eq('id', existingResult.id);
        if (error) throw error;
      } else {
        const {
          error
        } = await supabase.from('qc_results').insert({
          daily_report_id: id!,
          article_id: report!.article_id,
          color,
          size,
          [field]: value,
          ok: field === 'ok' ? value : 0,
          r5: field === 'r5' ? value : 0,
          r10: field === 'r10' ? value : 0
        });
        if (error) throw error;
      }

      // Refresh QC results
      const {
        data: qcData
      } = await supabase.from('qc_results').select('*').eq('daily_report_id', id!);
      setQcResults(qcData || []);

      // Update article variations QC totals and daily report checked quantity
      await updateArticleVariationQC();
      await updateDailyReportCheckedQuantity();
    } catch (error) {
      console.error('Error updating QC result:', error);
      toast({
        title: "Error",
        description: "Failed to update QC result",
        variant: "destructive"
      });
    }
  };
  const updateArticleVariationQC = async () => {
    try {
      // Get all QC results for this article from all daily reports
      const {
        data: allQcResults
      } = await supabase.from('qc_results').select('color, size, ok, r5, r10').eq('article_id', report!.article_id);

      // Group by color and size to calculate totals
      const qcTotals = new Map<string, number>();
      allQcResults?.forEach(qc => {
        const key = `${qc.color}-${qc.size}`;
        const total = (qc.ok || 0) + (qc.r5 || 0) + (qc.r10 || 0);
        qcTotals.set(key, (qcTotals.get(key) || 0) + total);
      });

      // Get all variations for this article
      const {
        data: articleVariations
      } = await supabase.from('article_variations').select('id, color, size').eq('article_id', report!.article_id);

      // Update each variation's QC total
      if (articleVariations) {
        for (const variation of articleVariations) {
          const key = `${variation.color}-${variation.size}`;
          const qcTotal = qcTotals.get(key) || 0;
          await supabase.from('article_variations').update({
            qc: qcTotal
          }).eq('id', variation.id);
        }
      }
    } catch (error) {
      console.error('Error updating article variation QC totals:', error);
    }
  };
  const updateDefectCount = async (value: number) => {
    try {
      const {
        error
      } = await supabase.from('daily_reports').update({
        defect_count: value
      }).eq('id', id!);
      if (error) throw error;
      setDefectCount(value);

      // Update the report state
      if (report) {
        setReport({
          ...report,
          defect_count: value
        });
      }

      // Update daily report checked quantity since defect count changed
      await updateDailyReportCheckedQuantity();
    } catch (error) {
      console.error('Error updating defect count:', error);
      toast({
        title: "Error",
        description: "Failed to update defect count",
        variant: "destructive"
      });
    }
  };
  const updateDailyReportCheckedQuantity = async () => {
    try {
      const totalQcResultsQuantity = qcResults.reduce((sum, qc) => sum + qc.ok + qc.r5 + qc.r10, 0);
      const calculatedCheckedQuantity = totalQcResultsQuantity + defectCount;
      const {
        error
      } = await supabase.from('daily_reports').update({
        checked_quantity: calculatedCheckedQuantity
      }).eq('id', id!);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating daily report checked quantity:', error);
    }
  };
  const updateMeasurementCheck = async (measurementDetailId: string, size: string, position: number, value: string) => {
    try {
      const field = `${size.toLowerCase()}_${position}`;
      const existingCheck = measurementChecks.find(mc => mc.measurement_detail_id === measurementDetailId);
      if (existingCheck) {
        const {
          error
        } = await supabase.from('measurement_checks').update({
          [field]: value
        }).eq('id', existingCheck.id);
        if (error) throw error;
      } else {
        const {
          error
        } = await supabase.from('measurement_checks').insert({
          daily_report_id: id!,
          article_id: report!.article_id,
          measurement_detail_id: measurementDetailId,
          [field]: value
        });
        if (error) throw error;
      }

      // Refresh measurement checks
      const {
        data: measurementData
      } = await supabase.from('measurement_checks').select(`
          *,
          measurement_detail:article_measurements(measurement)
        `).eq('daily_report_id', id!);
      setMeasurementChecks(measurementData || []);
    } catch (error) {
      console.error('Error updating measurement check:', error);
      toast({
        title: "Error",
        description: "Failed to update measurement check",
        variant: "destructive"
      });
    }
  };
  const handleFileUpload = async (file: File) => {
    if (!file || !report) return;
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${report.article_id}-${Date.now()}.${fileExt}`;
      const filePath = `article-images/${fileName}`;
      const {
        error: uploadError
      } = await supabase.storage.from('garment-sheets').upload(filePath, file);
      if (uploadError) {
        throw uploadError;
      }
      const {
        data
      } = supabase.storage.from('garment-sheets').getPublicUrl(filePath);
      setNewImage({
        ...newImage,
        image_url: data.publicUrl
      });
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const handleAddImage = async () => {
    if (!newImage.image_url || !report) {
      toast({
        title: "Error",
        description: "Please upload an image first",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        error
      } = await supabase.from('article_images').insert([{
        article_id: report.article_id,
        image_url: newImage.image_url,
        status: newImage.status,
        note: newImage.note || null
      }]);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to add image",
          variant: "destructive"
        });
        return;
      }
      setNewImage({
        image_url: "",
        status: "Fabric",
        note: ""
      });
      setIsImageDialogOpen(false);

      // Refresh images
      const {
        data: imagesData
      } = await supabase.from('article_images').select('*').eq('article_id', report.article_id).order('created_at', {
        ascending: false
      });
      setImages(imagesData || []);
      toast({
        title: "Success",
        description: "Image added successfully"
      });
    } catch (error) {
      console.error('Error adding image:', error);
    }
  };
  const handleDeleteImage = async (imageId: string) => {
    try {
      const {
        error
      } = await supabase.from('article_images').delete().eq('id', imageId);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete image",
          variant: "destructive"
        });
        return;
      }

      // Refresh images
      if (report) {
        const {
          data: imagesData
        } = await supabase.from('article_images').select('*').eq('article_id', report.article_id).order('created_at', {
          ascending: false
        });
        setImages(imagesData || []);
      }
      toast({
        title: "Success",
        description: "Image deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };
  const handleSaveInspectorSignature = async (signature: string) => {
    if (!id) return;
    try {
      const {
        error
      } = await supabase.from('daily_reports').update({
        signature
      }).eq('id', id);
      if (error) throw error;
      setInspectorSignature(signature);
      if (report) {
        setReport({
          ...report,
          signature
        });
      }
      toast({
        title: "Success",
        description: "Inspector signature saved successfully"
      });
    } catch (error) {
      console.error('Error saving inspector signature:', error);
      toast({
        title: "Error",
        description: "Failed to save inspector signature",
        variant: "destructive"
      });
    }
  };
  const handleSaveVendorSignature = async (signature: string) => {
    if (!id) return;
    try {
      const {
        error
      } = await supabase.from('daily_reports').update({
        vendor_signature: signature
      }).eq('id', id);
      if (error) throw error;
      setVendorSignature(signature);
      if (report) {
        setReport({
          ...report,
          vendor_signature: signature
        });
      }
      toast({
        title: "Success",
        description: "Vendor signature saved successfully"
      });
    } catch (error) {
      console.error('Error saving vendor signature:', error);
      toast({
        title: "Error",
        description: "Failed to save vendor signature",
        variant: "destructive"
      });
    }
  };
  const generatePDF = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = margin;

      // Helper function to add text
      const addText = (text: string, x: number, y: number, options?: {
        size?: number;
        style?: 'normal' | 'bold';
        align?: 'left' | 'center' | 'right';
      }) => {
        pdf.setFontSize(options?.size || 10);
        pdf.setFont('helvetica', options?.style || 'normal');
        pdf.text(text, x, y, {
          align: options?.align || 'left'
        });
      };

      // Helper function to create table
      const createTable = (headers: string[], rows: (string | number)[][], startY: number, options?: {
        fontSize?: number;
        headerHeight?: number;
        rowHeight?: number;
      }) => {
        const fontSize = options?.fontSize || 9;
        const headerHeight = options?.headerHeight || 8;
        const rowHeight = options?.rowHeight || 6;
        const colWidth = contentWidth / headers.length;
        let currentY = startY;

        // Headers
        pdf.setFillColor(248, 249, 250);
        pdf.rect(margin, currentY, contentWidth, headerHeight, 'F');
        headers.forEach((header, i) => {
          pdf.setFontSize(fontSize);
          pdf.setFont('helvetica', 'bold');
          pdf.rect(margin + i * colWidth, currentY, colWidth, headerHeight);
          pdf.text(header, margin + i * colWidth + colWidth / 2, currentY + 5, {
            align: 'center'
          });
        });
        currentY += headerHeight;

        // Rows
        rows.forEach((row, rowIndex) => {
          if (rowIndex === rows.length - 1) {
            // Total row
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, currentY, contentWidth, rowHeight, 'F');
          }
          row.forEach((cell, i) => {
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', rowIndex === rows.length - 1 ? 'bold' : 'normal');
            pdf.rect(margin + i * colWidth, currentY, colWidth, rowHeight);
            const cellValue = String(cell);
            const isNumeric = !isNaN(Number(cellValue)) && cellValue !== '';
            pdf.text(cellValue, margin + i * colWidth + colWidth / 2, currentY + 4, {
              align: isNumeric ? 'center' : i === 0 ? 'left' : 'center'
            });
          });
          currentY += rowHeight;
        });
        return currentY;
      };

      // 1. Header Section
      // Company logo placeholder (you can add actual logo later)
      pdf.setFillColor(200, 200, 200);
      pdf.rect(margin, yPosition, 30, 15, 'F');
      addText('LOGO', margin + 15, yPosition + 8, {
        align: 'center'
      });

      // Title
      addText('DAILY REPORT', pageWidth / 2, yPosition + 8, {
        size: 16,
        style: 'bold',
        align: 'center'
      });
      yPosition += 25;

      // 2. Information Section (2 columns)
      const leftColX = margin;
      const rightColX = pageWidth / 2 + 10;
      const colWidth = contentWidth / 2 - 10;

      // Left column info
      const leftInfo = [['Date', format(new Date(report.date), 'PPP')], ['Vendor', article.vendors.name], ['Inspector', report.inspector], ['Task Name', report.status], ['Collection', article.collection || '-']];

      // Right column info
      const rightInfo = [['Article', `${article.name} (${article.code})`], ['Qty Order', totalQtyOrder.toString()], ['Qty Cutting', totalQtyCutting.toString()], ['Checked Quantity', totalCheckedQuantity.toString()]];
      leftInfo.forEach(([label, value], i) => {
        const y = yPosition + i * 6;
        addText(`${label}:`, leftColX, y, {
          style: 'bold'
        });
        addText(value, leftColX + 35, y);
      });
      rightInfo.forEach(([label, value], i) => {
        const y = yPosition + i * 6;
        addText(`${label}:`, rightColX, y, {
          style: 'bold'
        });
        addText(value, rightColX + 40, y);
      });
      yPosition += 40;

      // 3. QC Results Table
      addText('QC RESULTS', margin, yPosition, {
        size: 12,
        style: 'bold'
      });
      yPosition += 10;
      const qcHeaders = ['Color', 'Size', 'OK', 'R5', 'R10', 'Total QC'];
      const sortedVariations = sortBySizeProperty(variations);
      const qcRows = sortedVariations.map(variation => {
        const qcResult = qcResults.find(qc => qc.color === variation.color && qc.size === variation.size);
        const total = (qcResult?.ok || 0) + (qcResult?.r5 || 0) + (qcResult?.r10 || 0);
        return [variation.color, variation.size, qcResult?.ok || 0, qcResult?.r5 || 0, qcResult?.r10 || 0, total];
      });

      // Add total row
      qcRows.push(['TOTAL', '', totalOK, totalR5, totalR10, totalQC]);
      yPosition = createTable(qcHeaders, qcRows, yPosition);
      yPosition += 10;

      // 4. Measurement Check Table (if enabled)
      if (report.measurement && selectedMeasurements.length > 0) {
        addText('MEASUREMENT CHECK', margin, yPosition, {
          size: 12,
          style: 'bold'
        });
        yPosition += 10;

        // Create measurement table headers
        const measurementHeaders = ['Measurement'];
        const sortedSizes = sortSizes(availableSizes);
        sortedSizes.forEach(size => {
          measurementHeaders.push(size);
        });
        const measurementRows = selectedMeasurements.map(measurement => {
          const measurementCheck = measurementChecks.find(mc => mc.measurement_detail_id === measurement.id);
          const row: (string | number)[] = [measurement.measurement];
          sortedSizes.forEach(size => {
            const sizeKey = size.toLowerCase().replace('/', '').replace(' ', '_');

            // Get standard value
            const sizeColumn = sizeKey as keyof typeof measurement;
            const standardValue = measurement[sizeColumn] || '-';

            // Get measurement check values
            const val1 = measurementCheck?.[`${sizeKey}_1` as keyof MeasurementCheck] as string;
            const val2 = measurementCheck?.[`${sizeKey}_2` as keyof MeasurementCheck] as string;
            const val3 = measurementCheck?.[`${sizeKey}_3` as keyof MeasurementCheck] as string;
            const checkValues = [val1, val2, val3].filter(v => v).join(', ') || '-';
            row.push(`${standardValue} (${checkValues})`);
          });
          return row;
        });
        yPosition = createTable(measurementHeaders, measurementRows, yPosition, {
          fontSize: 7,
          rowHeight: 8
        });
        yPosition += 10;
      }

      // 5. Comments Section
      addText('COMMENTS', margin, yPosition, {
        size: 12,
        style: 'bold'
      });
      yPosition += 10;

      // Comments in a box
      pdf.rect(margin, yPosition, contentWidth, 35);
      addText('Defect Count:', margin + 5, yPosition + 7, {
        style: 'bold'
      });
      addText(defectCount.toString(), margin + 40, yPosition + 7);
      if (report.notes) {
        addText('Notes:', margin + 5, yPosition + 15, {
          style: 'bold'
        });
        const noteLines = pdf.splitTextToSize(report.notes, contentWidth - 20);
        pdf.text(noteLines, margin + 20, yPosition + 15);
      }
      if (report.remarks) {
        addText('Remarks:', margin + 5, yPosition + 25, {
          style: 'bold'
        });
        const remarkLines = pdf.splitTextToSize(report.remarks, contentWidth - 25);
        pdf.text(remarkLines, margin + 25, yPosition + 25);
      }
      yPosition += 45;

      // 6. Signature Section
      addText('SIGNATURES', margin, yPosition, {
        size: 12,
        style: 'bold'
      });
      yPosition += 10;

      // Two columns for signatures
      const sigWidth = contentWidth / 2 - 10;

      // Inspector signature
      pdf.rect(margin, yPosition, sigWidth, 25);
      addText('QC Inspector', margin + 5, yPosition + 8, {
        style: 'bold'
      });
      if (inspectorSignature) {
        // Add signature image if available
        try {
          pdf.addImage(inspectorSignature, 'PNG', margin + 5, yPosition + 10, sigWidth - 10, 12);
        } catch (e) {
          addText('Signed', margin + 5, yPosition + 18);
        }
      }
      addText('Sign: ____________________', margin + 5, yPosition + 22, {
        size: 8
      });

      // Vendor signature
      pdf.rect(margin + sigWidth + 20, yPosition, sigWidth, 25);
      addText('Vendor', margin + sigWidth + 25, yPosition + 8, {
        style: 'bold'
      });
      if (vendorSignature) {
        // Add signature image if available
        try {
          pdf.addImage(vendorSignature, 'PNG', margin + sigWidth + 25, yPosition + 10, sigWidth - 10, 12);
        } catch (e) {
          addText('Signed', margin + sigWidth + 25, yPosition + 18);
        }
      }
      addText('Sign: ____________________', margin + sigWidth + 25, yPosition + 22, {
        size: 8
      });

      // 7. Add images on next page if available
      if (images.length > 0) {
        pdf.addPage();
        let imgY = margin;
        addText('ARTICLE IMAGES', margin, imgY, {
          size: 14,
          style: 'bold'
        });
        imgY += 15;
        const imagesPerRow = 2;
        const imgWidth = (contentWidth - 10) / imagesPerRow;
        const imgHeight = 60;
        images.forEach((image, index) => {
          const row = Math.floor(index / imagesPerRow);
          const col = index % imagesPerRow;
          const x = margin + col * (imgWidth + 10);
          const y = imgY + row * (imgHeight + 20);

          // Add image placeholder (you can load actual images)
          pdf.rect(x, y, imgWidth, imgHeight);
          addText(`Image: ${image.status}`, x + 5, y + imgHeight + 8);
          if (image.note) {
            addText(`Note: ${image.note}`, x + 5, y + imgHeight + 15, {
              size: 8
            });
          }
        });
      }

      // Open PDF in new tab
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      toast({
        title: "Success",
        description: "PDF generated successfully"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return <div className="flex justify-center items-center py-8">
        <div>Loading daily report details...</div>
      </div>;
  }
  if (!report || !article) {
    return <div className="flex justify-center items-center py-8">
        <div>Daily report not found</div>
      </div>;
  }
  const totalQtyOrder = variations.reduce((sum, v) => sum + v.qty_order, 0);
  const totalQtyCutting = variations.reduce((sum, v) => sum + v.cutting, 0);
  const totalQcResultsQuantity = qcResults.reduce((sum, qc) => sum + qc.ok + qc.r5 + qc.r10, 0);
  const totalCheckedQuantity = totalQcResultsQuantity + defectCount;

  // Calculate totals for QC results table
  const totalOK = qcResults.reduce((sum, qc) => sum + (qc.ok || 0), 0);
  const totalR5 = qcResults.reduce((sum, qc) => sum + (qc.r5 || 0), 0);
  const totalR10 = qcResults.reduce((sum, qc) => sum + (qc.r10 || 0), 0);
  const totalQC = totalOK + totalR5 + totalR10;

  // Get unique colors
  const uniqueColors = [...new Set(variations.map(v => v.color))].join(', ');
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Report Details</h1>
      </div>

      {/* Info Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Date</Label>
              <p className="text-sm font-medium">{format(new Date(report.date), 'PPP')}</p>
            </div>
            <div>
              <Label>Task Name</Label>
              <p className="text-sm font-medium">{report.status}</p>
            </div>
            <div>
              <Label>Vendor</Label>
              <p className="text-sm font-medium">{article.vendors.name}</p>
            </div>
            <div>
              <Label>Status</Label>
              <p className="text-sm font-medium">{report.status}</p>
            </div>
            <div>
              <Label>Collection</Label>
              <p className="text-sm font-medium">{article.collection || '-'}</p>
            </div>
            <div>
              <Label>Article</Label>
              <p className="text-sm font-medium">{article.name} ({article.code})</p>
            </div>
            <div>
              <Label>Color</Label>
              <p className="text-sm font-medium">{uniqueColors}</p>
            </div>
            <div>
              <Label>Qty Order</Label>
              <p className="text-sm font-medium">{totalQtyOrder}</p>
            </div>
            <div>
              <Label>Qty Cutting</Label>
              <p className="text-sm font-medium">{totalQtyCutting}</p>
            </div>
            <div>
              <Label>Checked Quantity</Label>
              <p className="text-sm font-medium">{totalCheckedQuantity}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QC Grid */}
      <Card>
        <CardHeader>
          <CardTitle>QC Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>OK</TableHead>
                <TableHead>R5</TableHead>
                <TableHead>R10</TableHead>
                <TableHead>Total QC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortBySizeProperty(variations).map(variation => {
              const qcResult = qcResults.find(qc => qc.color === variation.color && qc.size === variation.size);
              const variationTotal = (qcResult?.ok || 0) + (qcResult?.r5 || 0) + (qcResult?.r10 || 0);
              return <TableRow key={variation.id}>
                    <TableCell>{variation.color}</TableCell>
                    <TableCell>{variation.size}</TableCell>
                    <TableCell>
                      <Input type="number" value={qcResult?.ok || 0} onChange={e => updateQCResult(variation.color, variation.size, 'ok', parseInt(e.target.value) || 0)} className="w-20" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={qcResult?.r5 || 0} onChange={e => updateQCResult(variation.color, variation.size, 'r5', parseInt(e.target.value) || 0)} className="w-20" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={qcResult?.r10 || 0} onChange={e => updateQCResult(variation.color, variation.size, 'r10', parseInt(e.target.value) || 0)} className="w-20" />
                    </TableCell>
                    <TableCell className="font-medium">{variationTotal}</TableCell>
                  </TableRow>;
            })}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold" colSpan={2}>Total</TableCell>
                <TableCell className="font-bold">{totalOK}</TableCell>
                <TableCell className="font-bold">{totalR5}</TableCell>
                <TableCell className="font-bold">{totalR10}</TableCell>
                <TableCell className="font-bold">{totalQC}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Measurement Check Grid */}
      {report.measurement && <Card>
          <CardHeader>
            <CardTitle>Measurement Check</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Measurement</TableHead>
                  {sortSizes(availableSizes).map(size => <TableHead key={size} colSpan={4} className="text-center">{size}</TableHead>)}
                </TableRow>
                
              </TableHeader>
              <TableBody>
                {selectedMeasurements.length === 0 ? <TableRow>
                    <TableCell colSpan={1 + availableSizes.length * 3} className="text-center text-muted-foreground">
                      No measurements selected for this report
                    </TableCell>
                  </TableRow> : selectedMeasurements.map(measurement => {
              const measurementCheck = measurementChecks.find(mc => mc.measurement_detail_id === measurement.id);
              return <TableRow key={measurement.id}>
                        <TableCell className="font-medium">{measurement.measurement}</TableCell>
                        {sortSizes(availableSizes).map(size => {
                  const sizeKey = size.toLowerCase().replace('/', '').replace(' ', '_');
                  const sizeColumn = sizeKey as keyof typeof measurement;
                  const standardValue = measurement[sizeColumn];
                  return <>
                              <TableCell key={`${size}-std`} className="text-center font-medium">
                                {standardValue || '-'}
                              </TableCell>
                              <TableCell key={`${size}-1`}>
                                <Select value={measurementCheck?.[`${sizeKey}_1` as keyof MeasurementCheck] as string || ""} onValueChange={value => updateMeasurementCheck(measurement.id, sizeKey, 1, value)}>
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {measurementValues.map(val => <SelectItem key={val} value={val}>{val}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell key={`${size}-2`}>
                                <Select value={measurementCheck?.[`${sizeKey}_2` as keyof MeasurementCheck] as string || ""} onValueChange={value => updateMeasurementCheck(measurement.id, sizeKey, 2, value)}>
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {measurementValues.map(val => <SelectItem key={val} value={val}>{val}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell key={`${size}-3`}>
                                <Select value={measurementCheck?.[`${sizeKey}_3` as keyof MeasurementCheck] as string || ""} onValueChange={value => updateMeasurementCheck(measurement.id, sizeKey, 3, value)}>
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {measurementValues.map(val => <SelectItem key={val} value={val}>{val}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </>;
                })}
                      </TableRow>;
            })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>}

      {/* Comments Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="defect_count">Defect Count</Label>
              <Input id="defect_count" type="number" value={defectCount} onChange={e => updateDefectCount(parseInt(e.target.value) || 0)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" defaultValue={report.notes || ''} className="mt-1" rows={3} />
            </div>
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea id="remarks" defaultValue={report.remarks || ''} className="mt-1" rows={3} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Inspector Signature</Label>
              <div className="mt-2">
                <CustomSignatureCanvas ref={inspectorSigRef} value={inspectorSignature} onSave={handleSaveInspectorSignature} placeholder="Tap to Sign" readonly={!!inspectorSignature} />
              </div>
            </div>
            <div>
              <Label>Vendor Signature</Label>
              <div className="mt-2">
                <CustomSignatureCanvas ref={vendorSigRef} value={vendorSignature} onSave={handleSaveVendorSignature} placeholder="Tap to Sign" readonly={!!vendorSignature} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Article Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Article Images
            <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Article Image</DialogTitle>
                  <DialogDescription>
                    Upload and add a new image for article: {article?.name}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="image-upload">Image Upload</Label>
                    <div className="mt-2">
                      <Input id="image-upload" type="file" accept="image/*" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }} disabled={uploading} />
                      {uploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
                      {newImage.image_url && <div className="mt-2">
                          <img src={newImage.image_url} alt="Preview" className="w-32 h-32 object-cover rounded border" />
                        </div>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={newImage.status} onValueChange={value => setNewImage({
                    ...newImage,
                    status: value
                  })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fabric">Fabric</SelectItem>
                        <SelectItem value="Waybill">Waybill</SelectItem>
                        <SelectItem value="Approval">Approval</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Defect">Defect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="note">Note</Label>
                    <Textarea id="note" value={newImage.note} onChange={e => setNewImage({
                    ...newImage,
                    note: e.target.value
                  })} placeholder="Add a note about this image..." rows={3} />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddImage} disabled={!newImage.image_url || uploading}>
                      Add Image
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? <div className="text-center text-muted-foreground py-4">
              No images have been added for this article yet
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map(image => <Card key={image.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant={image.status === 'Approval' ? 'default' : image.status === 'Defect' ? 'destructive' : image.status === 'Production' ? 'secondary' : 'outline'}>
                        {image.status}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteImage(image.id)} className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="aspect-square overflow-hidden rounded border">
                      <img src={image.image_url} alt="Article image" className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(image.image_url, '_blank')} />
                    </div>
                    {image.note && <p className="text-sm text-muted-foreground">{image.note}</p>}
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(image.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>)}
            </div>}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={generatePDF} className="gap-2">
          <FileDown className="h-4 w-4" />
          Create PDF
        </Button>
      </div>
    </div>;
}