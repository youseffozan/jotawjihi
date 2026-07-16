CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grade public.grade_level;
BEGIN
  BEGIN
    _grade := (NEW.raw_user_meta_data->>'grade')::public.grade_level;
  EXCEPTION WHEN others THEN
    _grade := NULL;
  END;

  INSERT INTO public.profiles (id, email, full_name, grade)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    _grade
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC, anon, authenticated;