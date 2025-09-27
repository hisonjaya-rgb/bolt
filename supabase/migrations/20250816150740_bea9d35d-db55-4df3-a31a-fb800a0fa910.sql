-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'cutting', 'sewing', 'finishing', 'qc', 'warehouse', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buyers table
CREATE TABLE public.buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT,
    contact TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create articles table
CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES public.buyers(id) ON DELETE CASCADE NOT NULL,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    style TEXT,
    pic TEXT,
    application1 TEXT,
    application2 TEXT,
    sizes TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create article_variations table
CREATE TABLE public.article_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    color TEXT NOT NULL,
    size TEXT NOT NULL,
    qty_order INTEGER DEFAULT 0,
    cutting INTEGER DEFAULT 0,
    application1 INTEGER DEFAULT 0,
    application2 INTEGER DEFAULT 0,
    sewing INTEGER DEFAULT 0,
    finishing INTEGER DEFAULT 0,
    qc INTEGER DEFAULT 0,
    shipping INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (article_id, color, size)
);

-- Create boms table
CREATE TABLE public.boms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    item_name TEXT NOT NULL,
    category TEXT,
    uom TEXT,
    size TEXT,
    consump NUMERIC DEFAULT 0,
    needed NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    receiving NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ppm table
CREATE TABLE public.ppm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    packing_method TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ppm_checkpoints table
CREATE TABLE public.ppm_checkpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ppm_id UUID REFERENCES public.ppm(id) ON DELETE CASCADE NOT NULL,
    section TEXT NOT NULL,
    checkpoint TEXT NOT NULL,
    position_ok BOOLEAN DEFAULT FALSE,
    color_ok BOOLEAN DEFAULT FALSE,
    quality_ok BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sewing_lines table
CREATE TABLE public.sewing_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_name TEXT NOT NULL,
    spv_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sewing_line_operators table
CREATE TABLE public.sewing_line_operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_id UUID REFERENCES public.sewing_lines(id) ON DELETE CASCADE NOT NULL,
    operator_name TEXT NOT NULL,
    process_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sewing_daily_reports table
CREATE TABLE public.sewing_daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_id UUID REFERENCES public.sewing_lines(id) ON DELETE CASCADE NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    remarks TEXT,
    total_output INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sewing_hourly_reports table
CREATE TABLE public.sewing_hourly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID REFERENCES public.sewing_daily_reports(id) ON DELETE CASCADE NOT NULL,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    color TEXT NOT NULL,
    hour_time TIME NOT NULL,
    size_f INTEGER DEFAULT 0,
    size_xs INTEGER DEFAULT 0,
    size_s INTEGER DEFAULT 0,
    size_m INTEGER DEFAULT 0,
    size_l INTEGER DEFAULT 0,
    size_xl INTEGER DEFAULT 0,
    size_sm INTEGER DEFAULT 0,
    size_lxl INTEGER DEFAULT 0,
    total_qty INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sewing_operator_outputs table
CREATE TABLE public.sewing_operator_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hourly_report_id UUID REFERENCES public.sewing_hourly_reports(id) ON DELETE CASCADE NOT NULL,
    operator_name TEXT NOT NULL,
    process_name TEXT NOT NULL,
    qty_output INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cutting_reports table
CREATE TABLE public.cutting_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE DEFAULT CURRENT_DATE,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    pic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cutting_list_rows table
CREATE TABLE public.cutting_list_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cutting_report_id UUID REFERENCES public.cutting_reports(id) ON DELETE CASCADE NOT NULL,
    roll_number INTEGER NOT NULL,
    yard_sticker TEXT,
    layer INTEGER DEFAULT 0,
    layer_length NUMERIC DEFAULT 0,
    total_layer_length NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    size_f INTEGER DEFAULT 0,
    size_xs INTEGER DEFAULT 0,
    size_s INTEGER DEFAULT 0,
    size_m INTEGER DEFAULT 0,
    size_l INTEGER DEFAULT 0,
    size_xl INTEGER DEFAULT 0,
    size_sm INTEGER DEFAULT 0,
    size_lxl INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create finishing_reports table
CREATE TABLE public.finishing_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE DEFAULT CURRENT_DATE,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    color TEXT NOT NULL,
    size TEXT NOT NULL,
    qty INTEGER DEFAULT 0,
    remarks TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create qc_reports table
CREATE TABLE public.qc_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE DEFAULT CURRENT_DATE,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    color TEXT NOT NULL,
    size TEXT NOT NULL,
    qty INTEGER DEFAULT 0,
    remarks TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipping_reports table
CREATE TABLE public.shipping_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE DEFAULT CURRENT_DATE,
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
    color TEXT NOT NULL,
    size TEXT NOT NULL,
    qty INTEGER DEFAULT 0,
    remarks TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ppm_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sewing_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sewing_line_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sewing_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sewing_hourly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sewing_operator_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cutting_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cutting_list_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finishing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_reports ENABLE ROW LEVEL SECURITY;

-- Function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  -- Assign default viewer role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create basic RLS policies
-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- General policies for main tables (accessible to authenticated users)
CREATE POLICY "Authenticated users can view buyers" ON public.buyers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage buyers" ON public.buyers FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view articles" ON public.articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage articles" ON public.articles FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view variations" ON public.article_variations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage variations" ON public.article_variations FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view boms" ON public.boms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage boms" ON public.boms FOR ALL TO authenticated USING (true);

-- Similar policies for other tables
CREATE POLICY "Authenticated users can view ppm" ON public.ppm FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage ppm" ON public.ppm FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view ppm_checkpoints" ON public.ppm_checkpoints FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage ppm_checkpoints" ON public.ppm_checkpoints FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view sewing_lines" ON public.sewing_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage sewing_lines" ON public.sewing_lines FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view sewing_line_operators" ON public.sewing_line_operators FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage sewing_line_operators" ON public.sewing_line_operators FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view daily_reports" ON public.sewing_daily_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage daily_reports" ON public.sewing_daily_reports FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view hourly_reports" ON public.sewing_hourly_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage hourly_reports" ON public.sewing_hourly_reports FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view operator_outputs" ON public.sewing_operator_outputs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage operator_outputs" ON public.sewing_operator_outputs FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view cutting_reports" ON public.cutting_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage cutting_reports" ON public.cutting_reports FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view cutting_list_rows" ON public.cutting_list_rows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage cutting_list_rows" ON public.cutting_list_rows FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view finishing_reports" ON public.finishing_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage finishing_reports" ON public.finishing_reports FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view qc_reports" ON public.qc_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage qc_reports" ON public.qc_reports FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view shipping_reports" ON public.shipping_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage shipping_reports" ON public.shipping_reports FOR ALL TO authenticated USING (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_buyers_updated_at BEFORE UPDATE ON public.buyers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_article_variations_updated_at BEFORE UPDATE ON public.article_variations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_boms_updated_at BEFORE UPDATE ON public.boms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ppm_updated_at BEFORE UPDATE ON public.ppm FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ppm_checkpoints_updated_at BEFORE UPDATE ON public.ppm_checkpoints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sewing_lines_updated_at BEFORE UPDATE ON public.sewing_lines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sewing_daily_reports_updated_at BEFORE UPDATE ON public.sewing_daily_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cutting_reports_updated_at BEFORE UPDATE ON public.cutting_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();