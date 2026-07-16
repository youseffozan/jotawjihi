
DROP POLICY IF EXISTS "questions public read" ON public.questions;

REVOKE SELECT ON public.questions FROM anon;
GRANT SELECT ON public.questions TO authenticated;

CREATE POLICY "questions authenticated read"
ON public.questions
FOR SELECT
TO authenticated
USING (true);
