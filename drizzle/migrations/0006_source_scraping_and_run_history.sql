CREATE TABLE public.sources (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), firm_name text NOT NULL UNIQUE,
 firm_type text NOT NULL DEFAULT 'VC' CHECK (firm_type IN ('VC','growth equity','CVC','other')),
 careers_url text NOT NULL, ats_type text NOT NULL DEFAULT 'HTML' CHECK (ats_type IN ('Greenhouse','Lever','Ashby','HTML')),
 ats_board text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true,
 needs_review boolean NOT NULL DEFAULT false, review_reason text NOT NULL DEFAULT '',
 verified_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sources TO anon, authenticated;
GRANT ALL ON public.sources TO service_role;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY sources_public_read ON public.sources FOR SELECT TO anon, authenticated USING (true);
CREATE TABLE public.scrape_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_date date NOT NULL UNIQUE,
 started_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz,
 status text NOT NULL DEFAULT 'running', sources_expected integer NOT NULL DEFAULT 0,
 sources_checked integer NOT NULL DEFAULT 0, sources_succeeded integer NOT NULL DEFAULT 0,
 postings_added integer NOT NULL DEFAULT 0, postings_updated integer NOT NULL DEFAULT 0,
 postings_expired integer NOT NULL DEFAULT 0, source_results jsonb NOT NULL DEFAULT '{}'::jsonb,
 errors jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT ON public.scrape_runs TO anon, authenticated;
GRANT ALL ON public.scrape_runs TO service_role;
ALTER TABLE public.scrape_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY scrape_runs_public_read ON public.scrape_runs FOR SELECT TO anon, authenticated USING (true);
ALTER TABLE public.postings ADD COLUMN source_id uuid REFERENCES public.sources(id);
ALTER TABLE public.postings ADD COLUMN source_job_id text;
CREATE INDEX postings_source_idx ON public.postings(source_id);
CREATE TABLE public.scrape_source_runs (
 run_id uuid NOT NULL REFERENCES public.scrape_runs(id), source_id uuid NOT NULL REFERENCES public.sources(id),
 started_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz, status text NOT NULL DEFAULT 'running',
 PRIMARY KEY(run_id,source_id)
);
GRANT ALL ON public.scrape_source_runs TO service_role;
ALTER TABLE public.scrape_source_runs ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.claim_source_scrape(p_source uuid, p_date date) RETURNS uuid
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.sources WHERE id=p_source AND active) THEN RETURN NULL; END IF;
 INSERT INTO public.scrape_runs(run_date,sources_expected) VALUES(p_date,(SELECT count(*) FROM public.sources WHERE active)) ON CONFLICT(run_date) DO NOTHING;
 SELECT id INTO r FROM public.scrape_runs WHERE run_date=p_date;
 INSERT INTO public.scrape_source_runs(run_id,source_id) VALUES(r,p_source) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN NULL; END IF;
 RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.claim_source_scrape(uuid,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_source_scrape(uuid,date) TO service_role;
CREATE FUNCTION public.finish_source_scrape(p_run uuid,p_source uuid,p_jobs jsonb,p_error text DEFAULT '') RETURNS jsonb
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE s public.sources; j jsonb; existing public.postings; a integer:=0; u integer:=0; e integer:=0; n timestamptz:=now(); result jsonb;
BEGIN
 PERFORM 1 FROM public.scrape_runs WHERE id=p_run FOR UPDATE;
 PERFORM 1 FROM public.scrape_source_runs WHERE run_id=p_run AND source_id=p_source AND status='running' FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('skipped',true); END IF;
 SELECT * INTO s FROM public.sources WHERE id=p_source;
 IF p_error='' THEN
  FOR j IN SELECT value FROM jsonb_array_elements(p_jobs) LOOP
   SELECT * INTO existing FROM public.postings WHERE url=j->>'url' OR (regexp_replace(lower(firm),'[^a-z0-9]','','g')=regexp_replace(lower(s.firm_name),'[^a-z0-9]','','g') AND regexp_replace(lower(title),'[^a-z0-9]','','g')=regexp_replace(lower(j->>'title'),'[^a-z0-9]','','g')) ORDER BY created_at LIMIT 1;
   IF FOUND THEN
    UPDATE public.postings SET source_id=p_source,source_job_id=j->>'id',title=j->>'title',location=j->>'location',expired=false,last_verified_at=n,last_checked_at=n,needs_review=false,review_reason='',nyc=coalesce((j->>'nyc')::boolean,false),mentions_mba=coalesce((j->>'mentionsMba')::boolean,false) WHERE id=existing.id;
    u:=u+1;
   ELSE
    INSERT INTO public.postings(firm,title,location,firm_type,role_type,url,source_id,source_job_id,nyc,mentions_mba,last_verified_at,last_checked_at,date_posted)
    VALUES(s.firm_name,j->>'title',coalesce(j->>'location',''),CASE s.firm_type WHEN 'growth equity' THEN 'Growth equity' ELSE s.firm_type END,coalesce(j->>'roleType','Full-time'),j->>'url',p_source,j->>'id',coalesce((j->>'nyc')::boolean,false),coalesce((j->>'mentionsMba')::boolean,false),n,n,(n AT TIME ZONE 'America/New_York')::date);
    a:=a+1;
   END IF;
  END LOOP;
  UPDATE public.postings SET expired=true,last_checked_at=n,review_reason='Role no longer appears on its verified source' WHERE source_id=p_source AND NOT expired AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_jobs) x WHERE x->>'id'=source_job_id);
  GET DIAGNOSTICS e = ROW_COUNT;
 END IF;
 result:=jsonb_build_object('firm',s.firm_name,'status',CASE WHEN p_error='' THEN 'success' ELSE 'failed' END,'added',a,'updated',u,'expired',e,'error',p_error);
 UPDATE public.scrape_source_runs SET ended_at=n,status=CASE WHEN p_error='' THEN 'success' ELSE 'failed' END WHERE run_id=p_run AND source_id=p_source;
 UPDATE public.scrape_runs SET sources_checked=sources_checked+1,sources_succeeded=sources_succeeded+CASE WHEN p_error='' THEN 1 ELSE 0 END,postings_added=postings_added+a,postings_updated=postings_updated+u,postings_expired=postings_expired+e,source_results=source_results || jsonb_build_object(p_source::text,result),errors=CASE WHEN p_error='' THEN errors ELSE errors || jsonb_build_object(s.firm_name,p_error) END WHERE id=p_run;
 UPDATE public.scrape_runs SET ended_at=n,status=CASE WHEN sources_succeeded=sources_checked THEN 'success' WHEN sources_succeeded>0 THEN 'partial' ELSE 'failed' END WHERE id=p_run AND sources_checked>=sources_expected;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.finish_source_scrape(uuid,uuid,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_source_scrape(uuid,uuid,jsonb,text) TO service_role;