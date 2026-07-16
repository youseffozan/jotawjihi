-- Move SECURITY DEFINER helper functions out of the API-exposed public schema
CREATE SCHEMA IF NOT EXISTS private;

-- Recreate has_role in private schema
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Only allow the postgres/service roles to execute; RLS policies invoked by
-- anon/authenticated will call the public wrapper below, which is SECURITY DEFINER
-- and owned by postgres, so it can reach private.has_role internally.
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Redefine public.has_role as a thin SECURITY DEFINER wrapper. Keep it callable by
-- authenticated/anon because RLS policies reference it, but rely on the private
-- implementation. The wrapper does not add attack surface: it just returns a boolean
-- role check bound to the passed user id.
-- To satisfy the linters (which flag any SECURITY DEFINER function in public
-- executable by anon/authenticated), inline the logic here as SECURITY INVOKER
-- against user_roles. RLS on user_roles restricts reads, so we grant a narrow
-- SECURITY DEFINER path via private.has_role — invoked from policies through a
-- SECURITY DEFINER function OWNED by postgres and executable only from RLS context.

-- Simpler: drop the public function and update all policies to inline the check
-- using a new SECURITY DEFINER function kept in `private` schema, referenced from
-- policies (RLS policy expressions run as the querying role, but function EXECUTE
-- privilege on private.* is not granted to end users — however Postgres checks
-- EXECUTE for the invoking role, so we must GRANT EXECUTE on private.has_role
-- to authenticated and anon. Since `private` is not exposed by PostgREST, this
-- resolves the linter without breaking RLS).
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated;

-- Drop existing policies that reference public.has_role, and drop the function
DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
DROP POLICY IF EXISTS "questions admin write" ON public.questions;
DROP POLICY IF EXISTS "subjects admin write" ON public.subjects;
DROP POLICY IF EXISTS "attempts self read" ON public.user_attempts;
DROP POLICY IF EXISTS "roles admin manage" ON public.user_roles;
DROP POLICY IF EXISTS "roles self read" ON public.user_roles;

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- Recreate policies using private.has_role
CREATE POLICY "profiles self read" ON public.profiles
  FOR SELECT TO authenticated
  USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "profiles self update" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((auth.uid() = id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "questions admin write" ON public.questions
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "subjects admin write" ON public.subjects
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "attempts self read" ON public.user_attempts
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "roles admin manage" ON public.user_roles
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "roles self read" ON public.user_roles
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- handle_new_user is SECURITY DEFINER and lives in public. It's only meant to be
-- called by a trigger on auth.users. Move to private schema so it's not exposed
-- via the API. Triggers don't require caller EXECUTE privileges.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Recreate the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();