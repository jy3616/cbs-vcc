GRANT SELECT (id, firm, title, location, firm_type, focus, sectors, role_type, date_posted, deadline, rolling, url, nyc, mentions_mba, expired, last_verified_at, needs_review, last_checked_at, fund_stage, mba_specific, alumni, notes, shared_by_vcc, hidden) ON public.postings TO anon;
CREATE POLICY public_visible_postings ON public.postings FOR SELECT TO anon USING (NOT hidden);
CREATE OR REPLACE FUNCTION public.board_last_verified() RETURNS timestamptz LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT max(ended_at) FROM public.scrape_runs WHERE status IN ('success','partial') AND sources_succeeded > 0 $$;
REVOKE ALL ON FUNCTION public.board_last_verified() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.board_last_verified() TO anon, authenticated, service_role;