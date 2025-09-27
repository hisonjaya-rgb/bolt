-- Create table for article images
CREATE TABLE public.article_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.article_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "article_images_select_authenticated" 
ON public.article_images 
FOR SELECT 
USING (true);

CREATE POLICY "article_images_insert_authenticated" 
ON public.article_images 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "article_images_update_authenticated" 
ON public.article_images 
FOR UPDATE 
USING (true);

CREATE POLICY "article_images_delete_authenticated" 
ON public.article_images 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_article_images_updated_at
BEFORE UPDATE ON public.article_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();