CREATE TABLE public.job_runs (
  name text PRIMARY KEY,
  locked_until timestamptz,
  paused_reason text NOT NULL DEFAULT '',
  last_run_at timestamptz,
  last_result jsonb
);
ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.job_runs TO service_role;
INSERT INTO public.job_runs (name) VALUES ('discover-jobs');