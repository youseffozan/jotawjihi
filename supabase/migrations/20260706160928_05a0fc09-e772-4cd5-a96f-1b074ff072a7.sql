-- Indexes
CREATE INDEX IF NOT EXISTS user_attempts_user_id_idx ON public.user_attempts(user_id);
CREATE INDEX IF NOT EXISTS user_attempts_subject_id_idx ON public.user_attempts(subject_id);
CREATE INDEX IF NOT EXISTS user_attempts_created_at_idx ON public.user_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS questions_subject_id_idx ON public.questions(subject_id);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS profiles_grade_field_idx ON public.profiles(grade, field);

-- updated_at triggers (function already exists: public.update_updated_at_column)
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS questions_set_updated_at ON public.questions;
CREATE TRIGGER questions_set_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Data integrity on user_attempts
ALTER TABLE public.user_attempts
  DROP CONSTRAINT IF EXISTS user_attempts_score_valid;
ALTER TABLE public.user_attempts
  ADD CONSTRAINT user_attempts_score_valid
  CHECK (total > 0 AND score >= 0 AND score <= total);