-- Add article_id column to shipping table
ALTER TABLE public.shipping 
ADD COLUMN article_id UUID;

-- Add foreign key constraint (optional, but good practice)
-- ALTER TABLE public.shipping 
-- ADD CONSTRAINT fk_shipping_article 
-- FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE SET NULL;