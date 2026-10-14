CREATE TABLE public.resumes (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT ALL ON public.resumes TO service_role;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own resume select" ON public.resumes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own resume insert" ON public.resumes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own resume update" ON public.resumes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own resume delete" ON public.resumes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.job_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  job_url text NOT NULL,
  fit_score integer NOT NULL DEFAULT 0,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_url)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_analyses TO authenticated;
GRANT ALL ON public.job_analyses TO service_role;
ALTER TABLE public.job_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analyses select" ON public.job_analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own analyses insert" ON public.job_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own analyses update" ON public.job_analyses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own analyses delete" ON public.job_analyses FOR DELETE TO authenticated USING (auth.uid() = user_id);