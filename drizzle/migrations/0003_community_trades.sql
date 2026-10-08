CREATE TABLE public.trade_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  author_name text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('BUY','SELL')),
  entry_price numeric NOT NULL,
  exit_price numeric NOT NULL,
  lots numeric NOT NULL DEFAULT 0.01,
  note text NOT NULL DEFAULT '',
  screenshot_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX trade_posts_status_idx ON public.trade_posts (status, created_at DESC);
GRANT SELECT ON public.trade_posts TO anon;
GRANT SELECT, INSERT, DELETE ON public.trade_posts TO authenticated;
GRANT ALL ON public.trade_posts TO service_role;
ALTER TABLE public.trade_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads approved trades" ON public.trade_posts FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Owners read own trades" ON public.trade_posts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners submit pending trades" ON public.trade_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Owners delete own trades" ON public.trade_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users upload own screenshots" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'trade-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own screenshots" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'trade-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);