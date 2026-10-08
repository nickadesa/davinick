CREATE TABLE public.calendar_cache (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  payload jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.calendar_cache TO service_role;
ALTER TABLE public.calendar_cache ENABLE ROW LEVEL SECURITY;