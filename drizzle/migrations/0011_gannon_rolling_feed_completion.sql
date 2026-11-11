CREATE OR REPLACE FUNCTION public.finish_gannon_scrape(p_run uuid,p_source uuid,p_jobs jsonb,p_error text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SET search_path=public AS $$
DECLARE s public.sources; j jsonb; existing public.postings; a integer:=0; u integer:=0; n timestamptz:=now(); result jsonb;
BEGIN
 PERFORM 1 FROM public.scrape_runs WHERE id=p_run FOR UPDATE;
 PERFORM 1 FROM public.scrape_source_runs WHERE run_id=p_run AND source_id=p_source AND status='running' FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('skipped',true); END IF;
 SELECT * INTO s FROM public.sources WHERE id=p_source AND ats_board='gannon-feed';
 IF NOT FOUND THEN RAISE EXCEPTION 'Not a John Gannon source'; END IF;
 IF p_error='' THEN
 FOR j IN SELECT value FROM jsonb_array_elements(p_jobs) LOOP
 IF coalesce(j->>'firm','')='' OR j->>'url' NOT LIKE 'https://johngannonblog.com/job/%' THEN RAISE EXCEPTION 'Invalid feed listing'; END IF;
 SELECT * INTO existing FROM public.postings WHERE url=j->>'url' OR (regexp_replace(lower(firm),'[^a-z0-9]','','g')=regexp_replace(lower(j->>'firm'),'[^a-z0-9]','','g') AND regexp_replace(lower(title),'[^a-z0-9]','','g')=regexp_replace(lower(j->>'title'),'[^a-z0-9]','','g')) ORDER BY created_at LIMIT 1;
 IF FOUND THEN
 IF existing.source_id=p_source THEN
 UPDATE public.postings SET title=j->>'title',location=j->>'location',nyc=(j->>'nyc')::boolean,mentions_mba=(j->>'mentionsMba')::boolean,last_verified_at=n,last_checked_at=n WHERE id=existing.id AND NOT expired;
 IF FOUND THEN u:=u+1; END IF;
 END IF;
 ELSE
 INSERT INTO public.postings(firm,title,location,firm_type,role_type,url,source_id,source_job_id,nyc,mentions_mba,last_verified_at,last_checked_at,date_posted,notes)
 VALUES(j->>'firm',j->>'title',j->>'location','VC',j->>'roleType',j->>'url',p_source,j->>'id',(j->>'nyc')::boolean,(j->>'mentionsMba')::boolean,n,n,(j->>'datePosted')::date,'Listed on John Gannon’s VC job board; company type is not independently classified.');
 a:=a+1;
 END IF;
 END LOOP;
 END IF;
 result:=jsonb_build_object('firm',s.firm_name,'status',CASE WHEN p_error='' THEN 'success' ELSE 'failed' END,'added',a,'updated',u,'expired',0,'error',p_error);
 UPDATE public.scrape_source_runs SET ended_at=n,status=CASE WHEN p_error='' THEN 'success' ELSE 'failed' END WHERE run_id=p_run AND source_id=p_source;
 UPDATE public.scrape_runs SET sources_expected=(SELECT count(*) FROM public.sources WHERE active),sources_checked=sources_checked+1,sources_succeeded=sources_succeeded+CASE WHEN p_error='' THEN 1 ELSE 0 END,postings_added=postings_added+a,postings_updated=postings_updated+u,source_results=source_results || jsonb_build_object(p_source::text,result),errors=CASE WHEN p_error='' THEN errors ELSE errors || jsonb_build_object(s.firm_name,p_error) END WHERE id=p_run;
 UPDATE public.scrape_runs SET ended_at=n,status=CASE WHEN sources_succeeded=sources_checked THEN 'success' WHEN sources_succeeded>0 THEN 'partial' ELSE 'failed' END WHERE id=p_run AND sources_checked>=sources_expected;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.finish_gannon_scrape(uuid,uuid,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_gannon_scrape(uuid,uuid,jsonb,text) TO service_role;