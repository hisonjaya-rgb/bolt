-- Create collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_name TEXT NOT NULL,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "collections_select_authenticated" 
ON public.collections 
FOR SELECT 
USING (true);

CREATE POLICY "collections_insert_authenticated" 
ON public.collections 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "collections_update_authenticated" 
ON public.collections 
FOR UPDATE 
USING (true);

CREATE POLICY "collections_delete_authenticated" 
ON public.collections 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();