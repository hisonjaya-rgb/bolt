import { useState, useEffect } from "react";
import { Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ArticleImage {
  id: string;
  image_url: string;
  status: string;
  note?: string;
  created_at: string;
}

interface ArticleImagesProps {
  articleId: string;
}

export default function ArticleImages({ articleId }: ArticleImagesProps) {
  const [images, setImages] = useState<ArticleImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newImage, setNewImage] = useState({
    image_url: "",
    status: "Fabric",
    note: ""
  });
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchImages();
  }, [articleId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('article_images')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch images",
          variant: "destructive"
        });
        return;
      }

      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${articleId}-${Date.now()}.${fileExt}`;
      const filePath = `article-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('garment-sheets')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('garment-sheets')
        .getPublicUrl(filePath);

      setNewImage({ ...newImage, image_url: data.publicUrl });
      
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
    if (!newImage.image_url) {
      toast({
        title: "Error",
        description: "Please upload an image first",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('article_images')
        .insert([{
          article_id: articleId,
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

      setNewImage({ image_url: "", status: "Fabric", note: "" });
      setIsAddDialogOpen(false);
      fetchImages();
      
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
      const { error } = await supabase
        .from('article_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete image",
          variant: "destructive"
        });
        return;
      }

      fetchImages();
      toast({
        title: "Success",
        description: "Image deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div>Loading images...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Article Images</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Image</DialogTitle>
              <DialogDescription>
                Upload and add a new image for this article
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-upload">Image Upload</Label>
                <div className="mt-2">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    disabled={uploading}
                  />
                  {uploading && (
                    <p className="text-sm text-muted-foreground mt-1">Uploading...</p>
                  )}
                  {newImage.image_url && (
                    <div className="mt-2">
                      <img 
                        src={newImage.image_url} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={newImage.status} onValueChange={(value) => setNewImage({ ...newImage, status: value })}>
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
                <Textarea
                  id="note"
                  value={newImage.note}
                  onChange={(e) => setNewImage({ ...newImage, note: e.target.value })}
                  placeholder="Add a note about this image..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddImage} disabled={!newImage.image_url || uploading}>
                  Add Image
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {images.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Images</CardTitle>
            <CardDescription>No images have been added for this article yet</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <Card key={image.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant={
                    image.status === 'Approval' ? 'default' :
                    image.status === 'Defect' ? 'destructive' : 
                    image.status === 'Production' ? 'secondary' : 'outline'
                  }>
                    {image.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteImage(image.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="aspect-square overflow-hidden rounded border">
                  <img 
                    src={image.image_url} 
                    alt="Article image"
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.open(image.image_url, '_blank')}
                  />
                </div>
                {image.note && (
                  <p className="text-sm text-muted-foreground">{image.note}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Added {new Date(image.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}