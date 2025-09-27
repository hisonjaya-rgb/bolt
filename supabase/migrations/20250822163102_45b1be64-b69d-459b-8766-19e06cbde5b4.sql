-- Modify articles table per request: drop old fields, add new statuses and rename status_ppm to ppm

-- 1) Drop unused columns
ALTER TABLE public.articles
  DROP COLUMN IF EXISTS order_date,
  DROP COLUMN IF EXISTS delivery_date,
  DROP COLUMN IF EXISTS status_sample_pattern;

-- 2) Rename status_ppm -> ppm (keep data and defaults)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'status_ppm'
  ) THEN
    EXECUTE 'ALTER TABLE public.articles RENAME COLUMN status_ppm TO ppm';
  END IF;
END$$;

-- 3) Add new columns for materials and process statuses
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS fabric text NOT NULL DEFAULT 'Matched',
  ADD COLUMN IF NOT EXISTS accs text NOT NULL DEFAULT 'Matched',
  ADD COLUMN IF NOT EXISTS low_stock boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS overstock boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS check_pattern text NOT NULL DEFAULT 'To Do',
  ADD COLUMN IF NOT EXISTS pps text NOT NULL DEFAULT 'To Do',
  ADD COLUMN IF NOT EXISTS photoshoot text NOT NULL DEFAULT 'To Do';