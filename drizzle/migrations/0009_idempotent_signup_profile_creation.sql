CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, left(coalesce(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)), 100))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Idempotent profile creation: coexist safely with the CBS auth lifecycle trigger without overwriting existing profile data.';