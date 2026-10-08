CREATE TABLE public.ai_analysis (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_analysis TO anon;
GRANT SELECT ON public.ai_analysis TO authenticated;
GRANT ALL ON public.ai_analysis TO service_role;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ai analysis" ON public.ai_analysis FOR SELECT TO anon, authenticated USING (true);