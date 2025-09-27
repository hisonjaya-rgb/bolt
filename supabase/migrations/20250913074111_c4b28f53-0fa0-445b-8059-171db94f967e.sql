-- First, add a new column for collection_id as foreign key
ALTER TABLE public.articles 
ADD COLUMN collection_id UUID REFERENCES public.collections(id);

-- Update existing articles that have collection names to reference collection IDs
UPDATE public.articles 
SET collection_id = collections.id 
FROM public.collections 
WHERE articles.collection = collections.collection_name;

-- Drop the old collection text column
ALTER TABLE public.articles 
DROP COLUMN collection;

-- Rename collection_id to collection for consistency
ALTER TABLE public.articles 
RENAME COLUMN collection_id TO collection;