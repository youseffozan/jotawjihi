
-- Ensure yfozan@gmail.com has admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('5c9c1a54-645f-4264-9d1c-9237ac3fca90', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Protect this admin from removal/modification
CREATE OR REPLACE FUNCTION public.protect_permanent_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  protected_id uuid := '5c9c1a54-645f-4264-9d1c-9237ac3fca90';
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.user_id = protected_id AND OLD.role = 'admin' THEN
      RAISE EXCEPTION 'Cannot remove admin role from permanent admin';
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.user_id = protected_id AND OLD.role = 'admin'
       AND (NEW.user_id <> OLD.user_id OR NEW.role <> OLD.role) THEN
      RAISE EXCEPTION 'Cannot modify admin role of permanent admin';
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_permanent_admin_trg ON public.user_roles;
CREATE TRIGGER protect_permanent_admin_trg
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_permanent_admin();
