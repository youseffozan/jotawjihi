-- Update signup trigger to save first_name, father_name, last_name, field, and compose full_name
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grade public.grade_level;
  _first text;
  _father text;
  _last text;
  _field text;
  _full text;
BEGIN
  BEGIN
    _grade := (NEW.raw_user_meta_data->>'grade')::public.grade_level;
  EXCEPTION WHEN others THEN
    _grade := NULL;
  END;

  _first  := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'first_name', '')), '');
  _father := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'father_name', '')), '');
  _last   := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'last_name', '')), '');
  _field  := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'field', '')), '');

  _full := NULLIF(trim(concat_ws(' ', _first, _father, _last)), '');
  IF _full IS NULL THEN
    _full := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  END IF;

  INSERT INTO public.profiles (id, email, full_name, first_name, father_name, last_name, grade, field)
  VALUES (NEW.id, NEW.email, _full, _first, _father, _last, _grade, _field);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC, anon, authenticated;