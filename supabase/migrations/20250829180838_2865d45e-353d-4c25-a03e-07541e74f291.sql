-- Create shipping table
CREATE TABLE public.shipping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  date DATE NOT NULL,
  packing_list TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping ENABLE ROW LEVEL SECURITY;

-- Create policies for shipping
CREATE POLICY "shipping_select_authenticated" 
ON public.shipping 
FOR SELECT 
USING (true);

CREATE POLICY "shipping_insert_authenticated" 
ON public.shipping 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "shipping_update_authenticated" 
ON public.shipping 
FOR UPDATE 
USING (true);

CREATE POLICY "shipping_delete_authenticated" 
ON public.shipping 
FOR DELETE 
USING (true);

-- Create shipping_list table (similar to qc_results)
CREATE TABLE public.shipping_list (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipping_id UUID NOT NULL,
  article_id UUID NOT NULL,
  color TEXT NOT NULL,
  size TEXT NOT NULL,
  ok INTEGER NOT NULL DEFAULT 0,
  r5 INTEGER NOT NULL DEFAULT 0,
  r10 INTEGER NOT NULL DEFAULT 0,
  total_shipping INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_list ENABLE ROW LEVEL SECURITY;

-- Create policies for shipping_list
CREATE POLICY "shipping_list_select_authenticated" 
ON public.shipping_list 
FOR SELECT 
USING (true);

CREATE POLICY "shipping_list_insert_authenticated" 
ON public.shipping_list 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "shipping_list_update_authenticated" 
ON public.shipping_list 
FOR UPDATE 
USING (true);

CREATE POLICY "shipping_list_delete_authenticated" 
ON public.shipping_list 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates on shipping
CREATE TRIGGER update_shipping_updated_at
BEFORE UPDATE ON public.shipping
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on shipping_list
CREATE TRIGGER update_shipping_list_updated_at
BEFORE UPDATE ON public.shipping_list
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();