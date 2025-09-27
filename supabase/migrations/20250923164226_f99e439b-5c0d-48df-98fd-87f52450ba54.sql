-- Add color column to boms table
ALTER TABLE public.boms ADD COLUMN color text NOT NULL DEFAULT '';