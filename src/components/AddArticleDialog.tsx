import { useState, useEffect } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Vendor {
  id: string;
  name: string;
}

interface Collection {
  id: string;
  collection_name: string;
}

interface AddArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedVendorId?: string;
}

export function AddArticleDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  preselectedVendorId 
}: AddArticleDialogProps) {
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [customCollection, setCustomCollection] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [newArticle, setNewArticle] = useState({
    name: "",
    buyer_id: preselectedVendorId || "",
    style: "",
    application1: "",
    application2: "",
    due_date: undefined as Date | undefined,
    notes: "",
    collection: ""
  });

  useEffect(() => {
    fetchVendors();
    fetchCollections();
  }, []);

  useEffect(() => {
    if (preselectedVendorId) {
      setNewArticle(prev => ({ ...prev, buyer_id: preselectedVendorId }));
    }
  }, [preselectedVendorId]);

  const handleCollectionChange = (value: string) => {
    if (value === "custom") {
      setShowCustomInput(true);
      setNewArticle({ ...newArticle, collection: "" });
    } else {
      setShowCustomInput(false);
      setCustomCollection("");
      setNewArticle({ ...newArticle, collection: value });
    }
  };

  const handleCustomCollectionSubmit = async () => {
    if (customCollection.trim()) {
      try {
        const { data, error } = await supabase
          .from('collections')
          .insert([{ collection_name: customCollection.trim() }])
          .select()
          .single();

        if (error) throw error;

        setNewArticle({ ...newArticle, collection: data.id });
        setShowCustomInput(false);
        setCustomCollection("");
        
        // Refresh collections list
        fetchCollections();
        
        toast({
          title: "Success",
          description: "New collection created successfully"
        });
      } catch (error) {
        console.error('Error creating collection:', error);
        toast({
          title: "Error",
          description: "Failed to create collection",
          variant: "destructive"
        });
      }
    }
  };

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('id, collection_name')
        .order('collection_name');

      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const handleAddArticle = async () => {
    if (!newArticle.name || !newArticle.buyer_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('articles')
        .insert([{
          code: newArticle.name, // Use name as code
          name: newArticle.name,
          vendor_id: newArticle.buyer_id,
          style: newArticle.style || null,
          application1: newArticle.application1 || null,
          application2: newArticle.application2 || null,
          due_date: newArticle.due_date?.toISOString().split('T')[0] || null,
          notes: newArticle.notes || null,
          collection: newArticle.collection || null,
          sizes: []
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Article added successfully"
      });

      onOpenChange(false);
      setNewArticle({
        name: "",
        buyer_id: preselectedVendorId || "",
        style: "",
        application1: "",
        application2: "",
        due_date: undefined,
        notes: "",
        collection: ""
      });
      setCustomCollection("");
      setShowCustomInput(false);
      
      onSuccess?.();
    } catch (error) {
      console.error('Error adding article:', error);
      toast({
        title: "Error",
        description: "Failed to add article",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setNewArticle({
      name: "",
      buyer_id: preselectedVendorId || "",
      style: "",
      application1: "",
      application2: "",
      due_date: undefined,
      notes: "",
      collection: ""
    });
    setCustomCollection("");
    setShowCustomInput(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Article</DialogTitle>
          <DialogDescription>Enter article information below</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Article Name *</Label>
            <Input
              id="name"
              value={newArticle.name}
              onChange={(e) => setNewArticle({ ...newArticle, name: e.target.value })}
              placeholder="Article name"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vendor">Vendor *</Label>
              <Select 
                value={newArticle.buyer_id} 
                onValueChange={(value) => setNewArticle({ ...newArticle, buyer_id: value })}
                disabled={!!preselectedVendorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="style">Style</Label>
              <Input
                id="style"
                value={newArticle.style}
                onChange={(e) => setNewArticle({ ...newArticle, style: e.target.value })}
                placeholder="Style description"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="collection">Collection</Label>
            <Select value={newArticle.collection || (showCustomInput ? "custom" : "")} onValueChange={handleCollectionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>{collection.collection_name}</SelectItem>
                ))}
                <SelectItem value="custom">+ Add New Collection</SelectItem>
              </SelectContent>
            </Select>
            {showCustomInput && (
              <div className="flex gap-2 mt-2">
                <Input
                  value={customCollection}
                  onChange={(e) => setCustomCollection(e.target.value)}
                  placeholder="Enter new collection name"
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomCollectionSubmit()}
                />
                <Button type="button" onClick={handleCustomCollectionSubmit} size="sm">
                  Add
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newArticle.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newArticle.due_date ? format(newArticle.due_date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newArticle.due_date}
                  onSelect={(date) => setNewArticle({ ...newArticle, due_date: date })}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="application1">Application 1</Label>
              <Input
                id="application1"
                value={newArticle.application1}
                onChange={(e) => setNewArticle({ ...newArticle, application1: e.target.value })}
                placeholder="e.g., Heat Transfer"
              />
            </div>
            <div>
              <Label htmlFor="application2">Application 2</Label>
              <Input
                id="application2"
                value={newArticle.application2}
                onChange={(e) => setNewArticle({ ...newArticle, application2: e.target.value })}
                placeholder="e.g., Embroidery"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newArticle.notes}
              onChange={(e) => setNewArticle({ ...newArticle, notes: e.target.value })}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleAddArticle}>Add Article</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}