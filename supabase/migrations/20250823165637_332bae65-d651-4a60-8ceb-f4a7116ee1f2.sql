-- Create enum types for measurement values and daily report status
CREATE TYPE measurement_value AS ENUM ('-2.5', '-2', '-1.5', '-1', '-0.5', '✓', '+0.5', '+1', '+1.5', '+2', '+2.5');
CREATE TYPE daily_report_status AS ENUM ('Pattern Check', 'PPS Check', 'Inline Cutting', 'Inline Sewing', 'Photoshoot Check', 'Prefinal', 'Final + Measurement', 'Final');

-- Add missing columns to articles table
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS collection text;

-- Add missing column to daily_reports for measurement_list
ALTER TABLE daily_reports 
ADD COLUMN IF NOT EXISTS measurement_list text[] DEFAULT '{}';

-- Drop and recreate measurement_checks table with correct structure
DROP TABLE IF EXISTS measurement_checks CASCADE;

CREATE TABLE measurement_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_report_id uuid NOT NULL,
  article_id uuid NOT NULL,
  measurement_detail_id uuid NOT NULL,
  -- Size-based measurement columns
  f_1 measurement_value,
  f_2 measurement_value,
  f_3 measurement_value,
  xs_1 measurement_value,
  xs_2 measurement_value,
  xs_3 measurement_value,
  s_1 measurement_value,
  s_2 measurement_value,
  s_3 measurement_value,
  m_1 measurement_value,
  m_2 measurement_value,
  m_3 measurement_value,
  l_1 measurement_value,
  l_2 measurement_value,
  l_3 measurement_value,
  xl_1 measurement_value,
  xl_2 measurement_value,
  xl_3 measurement_value,
  sm_1 measurement_value,
  sm_2 measurement_value,
  sm_3 measurement_value,
  lxl_1 measurement_value,
  lxl_2 measurement_value,
  lxl_3 measurement_value,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on measurement_checks
ALTER TABLE measurement_checks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for measurement_checks
CREATE POLICY "measurement_checks_select_authenticated" ON measurement_checks FOR SELECT USING (true);
CREATE POLICY "measurement_checks_insert_authenticated" ON measurement_checks FOR INSERT WITH CHECK (true);
CREATE POLICY "measurement_checks_update_authenticated" ON measurement_checks FOR UPDATE USING (true);
CREATE POLICY "measurement_checks_delete_authenticated" ON measurement_checks FOR DELETE USING (true);

-- Add foreign key constraints
ALTER TABLE measurement_checks
ADD CONSTRAINT fk_measurement_checks_daily_report 
FOREIGN KEY (daily_report_id) REFERENCES daily_reports(id) ON DELETE CASCADE;

ALTER TABLE measurement_checks
ADD CONSTRAINT fk_measurement_checks_article 
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

ALTER TABLE measurement_checks
ADD CONSTRAINT fk_measurement_checks_measurement_detail 
FOREIGN KEY (measurement_detail_id) REFERENCES article_measurements(id) ON DELETE CASCADE;

-- Update daily_reports status column to use the enum
ALTER TABLE daily_reports 
ALTER COLUMN status TYPE daily_report_status 
USING status::daily_report_status;

-- Add foreign key constraints for existing tables
ALTER TABLE qc_results
ADD CONSTRAINT IF NOT EXISTS fk_qc_results_daily_report 
FOREIGN KEY (daily_report_id) REFERENCES daily_reports(id) ON DELETE CASCADE;

ALTER TABLE qc_results
ADD CONSTRAINT IF NOT EXISTS fk_qc_results_article 
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

ALTER TABLE article_measurements
ADD CONSTRAINT IF NOT EXISTS fk_article_measurements_article 
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

ALTER TABLE daily_reports
ADD CONSTRAINT IF NOT EXISTS fk_daily_reports_article 
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

ALTER TABLE articles
ADD CONSTRAINT IF NOT EXISTS fk_articles_vendor 
FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

ALTER TABLE article_variations
ADD CONSTRAINT IF NOT EXISTS fk_article_variations_article 
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

ALTER TABLE boms
ADD CONSTRAINT IF NOT EXISTS fk_boms_article 
FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

-- Create trigger for updated_at on measurement_checks
CREATE TRIGGER update_measurement_checks_updated_at
  BEFORE UPDATE ON measurement_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();