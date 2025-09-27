import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Image, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ArticleGarmentSheetProps {
  articleId: string;
}

export default function ArticleGarmentSheet({ articleId }: ArticleGarmentSheetProps) {
  const [garmentSheetUrl, setGarmentSheetUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchGarmentSheet();
  }, [articleId]);

  const fetchGarmentSheet = async () => {
    try {
      const { data: article, error } = await supabase
        .from('articles')
        .select('garment_sheet_url')
        .eq('id', articleId)
        .maybeSingle();

      if (error) throw error;
      setGarmentSheetUrl(article ? article.garment_sheet_url : null);
    } catch (error) {
      console.error('Error fetching garment sheet:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PNG, JPG, JPEG, or PDF file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${articleId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('garment-sheets')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('garment-sheets')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update article with garment sheet URL
      const { error: updateError } = await supabase
        .from('articles')
        .update({ garment_sheet_url: publicUrl })
        .eq('id', articleId);

      if (updateError) throw updateError;

      setGarmentSheetUrl(publicUrl);
      setSelectedFile(null);
      setIsModalOpen(false);
      toast.success('Garment sheet uploaded successfully');
    } catch (error) {
      console.error('Error uploading garment sheet:', error);
      toast.error('Failed to upload garment sheet');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!garmentSheetUrl) return;

    try {
      // Extract file path from URL
      const urlParts = garmentSheetUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('garment-sheets')
        .remove([fileName]);

      if (deleteError) throw deleteError;

      // Update article to remove garment sheet URL
      const { error: updateError } = await supabase
        .from('articles')
        .update({ garment_sheet_url: null })
        .eq('id', articleId);

      if (updateError) throw updateError;

      setGarmentSheetUrl(null);
      toast.success('Garment sheet deleted successfully');
    } catch (error) {
      console.error('Error deleting garment sheet:', error);
      toast.error('Failed to delete garment sheet');
    }
  };

  const getFileIcon = (url: string) => {
    if (url.toLowerCase().includes('.pdf')) {
      return <FileText className="h-12 w-12 text-red-500" />;
    }
    return <Image className="h-12 w-12 text-blue-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Garment Sheet
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                {garmentSheetUrl ? 'Update' : 'Add'} Garment Sheet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Garment Sheet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Select File (PNG, JPG, JPEG, PDF - Max 10MB)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={handleFileSelect}
                    className="mt-2"
                  />
                </div>
                {selectedFile && (
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>Technical specifications and garment construction details</CardDescription>
      </CardHeader>
      <CardContent>
        {garmentSheetUrl ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getFileIcon(garmentSheetUrl)}
                <div>
                  <p className="font-medium">Garment Sheet</p>
                  <p className="text-sm text-muted-foreground">
                    {garmentSheetUrl.toLowerCase().includes('.pdf') ? 'PDF Document' : 'Image File'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle>Garment Sheet</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-auto">
                      {garmentSheetUrl.toLowerCase().includes('.pdf') ? (
                        <iframe
                          src={garmentSheetUrl}
                          className="w-full h-[70vh]"
                          title="Garment Sheet PDF"
                        />
                      ) : (
                        <img
                          src={garmentSheetUrl}
                          alt="Garment Sheet"
                          className="w-full h-auto max-h-[70vh] object-contain"
                        />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No garment sheet uploaded yet.</p>
            <p className="text-sm mt-2">Click "Add Garment Sheet" to upload a file.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}