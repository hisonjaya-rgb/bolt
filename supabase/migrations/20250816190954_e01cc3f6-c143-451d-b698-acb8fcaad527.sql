-- Update articles table to include missing fields for Article Details
ALTER TABLE articles ADD COLUMN IF NOT EXISTS order_date DATE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status_sample_pattern TEXT DEFAULT 'To Do' CHECK (status_sample_pattern IN ('To Do', 'In Progress', 'Done'));
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status_ppm TEXT DEFAULT 'To Do' CHECK (status_ppm IN ('To Do', 'In Progress', 'Done'));

-- Ensure article_variations table has all required fields
-- Most fields already exist, just ensure foreign key reference is proper
ALTER TABLE article_variations ADD CONSTRAINT fk_article_variations_article 
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;