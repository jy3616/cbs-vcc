GRANT SELECT ON public.postings TO anon;
DROP POLICY IF EXISTS "postings_public_read" ON public.postings;
CREATE POLICY "postings_public_read" ON public.postings FOR SELECT TO anon USING (true);