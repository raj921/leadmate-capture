-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  website TEXT,
  problem_text TEXT NOT NULL,
  score INTEGER,
  band TEXT CHECK (band IN ('High', 'Medium', 'Low')),
  label TEXT CHECK (label IN ('Internal automation', 'Customer support', 'Data processing', 'Sales ops', 'Other')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
  model_rationale TEXT,
  company_size TEXT,
  industry TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table for timeline
CREATE TABLE public.lead_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('lead_captured', 'lead_scored', 'outreach_sent', 'responded', 'qualified', 'closed')),
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin users table for simple password auth
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies - public access for now (will add admin auth later)
CREATE POLICY "Allow public read access to leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to leads" ON public.leads FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to lead_events" ON public.lead_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to lead_events" ON public.lead_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to admin_users" ON public.admin_users FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.leads (name, email, company, website, problem_text, score, band, label, status, model_rationale, company_size, industry) VALUES
('John Smith', 'john@acme.com', 'Acme Corp', 'https://acme.com', 'We need to automate our sales process and reduce manual work', 85, 'High', 'Sales ops', 'new', 'High-value prospect with clear automation needs and budget indicators', '100-500', 'Technology'),
('Sarah Johnson', 'sarah@example.com', 'Example Inc', 'https://example.com', 'Looking for better customer support tools', 65, 'Medium', 'Customer support', 'new', 'Medium priority - existing tools but room for improvement', '50-100', 'SaaS'),
('Mike Chen', 'mike@startup.co', 'Startup Co', NULL, 'Need help processing large datasets efficiently', 45, 'Low', 'Data processing', 'contacted', 'Early stage company, limited budget but good technical fit', '10-50', 'Analytics');

-- Insert sample events
INSERT INTO public.lead_events (lead_id, event_type, event_data) 
SELECT id, 'lead_captured', '{"source": "website", "form_version": "v1"}' 
FROM public.leads;

INSERT INTO public.lead_events (lead_id, event_type, event_data) 
SELECT id, 'lead_scored', '{"score": 85, "model": "v2.1"}' 
FROM public.leads WHERE email = 'john@acme.com';

INSERT INTO public.lead_events (lead_id, event_type, event_data) 
SELECT id, 'outreach_sent', '{"template": "initial_contact", "channel": "email"}' 
FROM public.leads WHERE email = 'mike@startup.co';