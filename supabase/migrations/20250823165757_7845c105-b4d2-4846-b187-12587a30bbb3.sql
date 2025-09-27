-- Add missing columns to articles table (if not exists)
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS collection text;

-- Add missing column to daily_reports for measurement_list (if not exists)
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
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  -- Foreign key constraints
  FOREIGN KEY (daily_report_id) REFERENCES daily_reports(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (measurement_detail_id) REFERENCES article_measurements(id) ON DELETE CASCADE
);

-- Enable RLS on measurement_checks
ALTER TABLE measurement_checks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for measurement_checks
CREATE POLICY "measurement_checks_select_authenticated" ON measurement_checks FOR SELECT USING (true);
CREATE POLICY "measurement_checks_insert_authenticated" ON measurement_checks FOR INSERT WITH CHECK (true);
CREATE POLICY "measurement_checks_update_authenticated" ON measurement_checks FOR UPDATE USING (true);
CREATE POLICY "measurement_checks_delete_authenticated" ON measurement_checks FOR DELETE USING (true);

-- Create trigger for updated_at on measurement_checks
CREATE TRIGGER update_measurement_checks_updated_at
  BEFORE UPDATE ON measurement_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();