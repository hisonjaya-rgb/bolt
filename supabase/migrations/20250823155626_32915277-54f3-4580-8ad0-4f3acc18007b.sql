-- First, let's rename buyers table to vendors if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'buyers' AND table_schema = 'public') THEN
        ALTER TABLE public.buyers RENAME TO vendors;
    END IF;
END $$;

-- Create article_measurements table
CREATE TABLE IF NOT EXISTS public.article_measurements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID NOT NULL,
    measurement TEXT NOT NULL,
    f NUMERIC,
    xs NUMERIC,
    s NUMERIC,
    m NUMERIC,
    l NUMERIC,
    xl NUMERIC,
    s_m NUMERIC,
    l_xl NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for article_measurements
ALTER TABLE public.article_measurements ENABLE ROW LEVEL SECURITY;

-- Create policies for article_measurements
CREATE POLICY "article_measurements_select_authenticated" 
ON public.article_measurements 
FOR SELECT 
USING (true);

CREATE POLICY "article_measurements_insert_authenticated" 
ON public.article_measurements 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "article_measurements_update_authenticated" 
ON public.article_measurements 
FOR UPDATE 
USING (true);

CREATE POLICY "article_measurements_delete_authenticated" 
ON public.article_measurements 
FOR DELETE 
USING (true);

-- Create status enum for daily reports
CREATE TYPE public.daily_report_status AS ENUM (
    'Pattern Check',
    'PPS Check', 
    'Inline Cutting',
    'Inline Sewing',
    'Photoshoot Check',
    'Prefinal',
    'Final + Measurement',
    'Final'
);

-- Create measurement enum for measurement checks
CREATE TYPE public.measurement_value AS ENUM (
    '-2.5',
    '-2',
    '-1.5', 
    '-1',
    '-0.5',
    '✓',
    '+0.5',
    '+1',
    '+1.5',
    '+2',
    '+2.5'
);

-- Create daily_reports table
CREATE TABLE public.daily_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    status public.daily_report_status NOT NULL,
    date DATE NOT NULL,
    inspector TEXT NOT NULL,
    article_id UUID NOT NULL,
    article_variations TEXT[] NOT NULL DEFAULT '{}',
    measurement BOOLEAN NOT NULL DEFAULT false,
    remarks TEXT,
    notes TEXT,
    defect_count INTEGER DEFAULT 0,
    checked_quantity INTEGER DEFAULT 0,
    signature TEXT,
    vendor_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for daily_reports
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_reports
CREATE POLICY "daily_reports_select_authenticated" 
ON public.daily_reports 
FOR SELECT 
USING (true);

CREATE POLICY "daily_reports_insert_authenticated" 
ON public.daily_reports 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "daily_reports_update_authenticated" 
ON public.daily_reports 
FOR UPDATE 
USING (true);

CREATE POLICY "daily_reports_delete_authenticated" 
ON public.daily_reports 
FOR DELETE 
USING (true);

-- Create qc_results table
CREATE TABLE public.qc_results (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    daily_report_id UUID NOT NULL,
    article_id UUID NOT NULL,
    color TEXT NOT NULL,
    size TEXT NOT NULL,
    ok INTEGER DEFAULT 0,
    r5 INTEGER DEFAULT 0,
    r10 INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for qc_results
ALTER TABLE public.qc_results ENABLE ROW LEVEL SECURITY;

-- Create policies for qc_results
CREATE POLICY "qc_results_select_authenticated" 
ON public.qc_results 
FOR SELECT 
USING (true);

CREATE POLICY "qc_results_insert_authenticated" 
ON public.qc_results 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "qc_results_update_authenticated" 
ON public.qc_results 
FOR UPDATE 
USING (true);

CREATE POLICY "qc_results_delete_authenticated" 
ON public.qc_results 
FOR DELETE 
USING (true);

-- Create measurement_checks table
CREATE TABLE public.measurement_checks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    daily_report_id UUID NOT NULL,
    article_id UUID NOT NULL,
    measurement_detail_id UUID NOT NULL,
    f_1 public.measurement_value,
    f_2 public.measurement_value,
    f_3 public.measurement_value,
    s_1 public.measurement_value,
    s_2 public.measurement_value,
    s_3 public.measurement_value,
    m_1 public.measurement_value,
    m_2 public.measurement_value,
    m_3 public.measurement_value,
    l_1 public.measurement_value,
    l_2 public.measurement_value,
    l_3 public.measurement_value,
    xl_1 public.measurement_value,
    xl_2 public.measurement_value,
    xl_3 public.measurement_value,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for measurement_checks
ALTER TABLE public.measurement_checks ENABLE ROW LEVEL SECURITY;

-- Create policies for measurement_checks
CREATE POLICY "measurement_checks_select_authenticated" 
ON public.measurement_checks 
FOR SELECT 
USING (true);

CREATE POLICY "measurement_checks_insert_authenticated" 
ON public.measurement_checks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "measurement_checks_update_authenticated" 
ON public.measurement_checks 
FOR UPDATE 
USING (true);

CREATE POLICY "measurement_checks_delete_authenticated" 
ON public.measurement_checks 
FOR DELETE 
USING (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_article_measurements_updated_at
BEFORE UPDATE ON public.article_measurements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at
BEFORE UPDATE ON public.daily_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qc_results_updated_at
BEFORE UPDATE ON public.qc_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_measurement_checks_updated_at
BEFORE UPDATE ON public.measurement_checks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();