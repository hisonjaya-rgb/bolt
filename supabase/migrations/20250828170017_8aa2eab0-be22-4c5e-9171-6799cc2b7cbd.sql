-- Add ready_to_shipping column to article_variations table
ALTER TABLE public.article_variations 
ADD COLUMN ready_to_shipping integer NOT NULL DEFAULT 0;