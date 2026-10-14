CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE TABLE public.postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm text NOT NULL,
  title text NOT NULL,
  location text NOT NULL DEFAULT '',
  firm_type text NOT NULL DEFAULT 'VC',
  focus text NOT NULL DEFAULT '',
  sectors text[] NOT NULL DEFAULT '{}',
  role_type text NOT NULL DEFAULT 'Full-time',
  date_posted date NOT NULL DEFAULT current_date,
  deadline date,
  rolling boolean NOT NULL DEFAULT true,
  url text NOT NULL UNIQUE,
  nyc boolean NOT NULL DEFAULT false,
  mentions_mba boolean NOT NULL DEFAULT false,
  expired boolean NOT NULL DEFAULT false,
  last_verified_at timestamptz NOT NULL DEFAULT now(),
  needs_review boolean NOT NULL DEFAULT false,
  review_reason text NOT NULL DEFAULT '',
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.postings TO authenticated;
GRANT ALL ON public.postings TO service_role;
ALTER TABLE public.postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signed-in read postings" ON public.postings FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins insert postings" ON public.postings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update postings" ON public.postings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete postings" ON public.postings FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;