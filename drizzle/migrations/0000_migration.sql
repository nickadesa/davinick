CREATE TABLE public.event_actuals (
  event_key text PRIMARY KEY,
  title text NOT NULL,
  event_time timestamptz NOT NULL,
  actual numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.event_actuals TO anon, authenticated;
GRANT ALL ON public.event_actuals TO service_role;
ALTER TABLE public.event_actuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read actuals" ON public.event_actuals FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.signal_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset text NOT NULL CHECK (asset IN ('XAUUSD','NASDAQ')),
  action text NOT NULL CHECK (action IN ('BUY','SELL','NEUTRAL')),
  confidence int NOT NULL,
  trigger_title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  entry_price numeric,
  price_1h numeric,
  price_4h numeric
);
CREATE INDEX signal_history_created_idx ON public.signal_history (created_at DESC);
GRANT SELECT ON public.signal_history TO anon, authenticated;
GRANT ALL ON public.signal_history TO service_role;
ALTER TABLE public.signal_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read signal history" ON public.signal_history FOR SELECT TO anon, authenticated USING (true);