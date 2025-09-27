import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Vendor {
  id: string;
  name: string;
  brand?: string;
  contact?: string;
  notes?: string;
  articlesCount?: number;
}

export default function Vendors() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVendor, setNewVendor] = useState({
    name: "",
    contact: "",
    notes: ""
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddVendor = async () => {
    if (!newVendor.name) {
      toast({
        title: "Error",
        description: "Vendor name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('vendors')
        .insert([{
          name: newVendor.name,
          contact: newVendor.contact || null,
          notes: newVendor.notes || null
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor added successfully"
      });

      setIsAddDialogOpen(false);
      setNewVendor({ name: "", contact: "", notes: "" });
      fetchVendors(); // Refresh the list
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast({
        title: "Error",
        description: "Failed to add vendor",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Vendors</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage vendor information and contacts</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription>Enter vendor information below</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Vendor Name</Label>
                <Input
                  id="name"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  placeholder="Enter vendor name"
                />
              </div>
              <div>
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={newVendor.contact}
                  onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value })}
                  placeholder="Email or phone"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newVendor.notes}
                  onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVendor}>Add Vendor</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div>Loading vendors...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full min-w-0">
          {filteredVendors.map((vendor) => (
            <Card 
              key={vendor.id} 
              className="interactive-card shadow-[var(--shadow-elegant)] min-w-0"
              onClick={() => navigate(`/vendors/${vendor.id}`)}
            >
              <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-sm sm:text-lg truncate">{vendor.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">
                      {vendor.contact || 'No contact info'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                {vendor.notes && (
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Notes</p>
                    <p className="text-xs sm:text-sm line-clamp-2">{vendor.notes}</p>
                  </div>
                )}
                
                <div className="pt-1 sm:pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full text-xs sm:text-sm h-7 sm:h-9"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle add article functionality
                    }}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Add Article
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}