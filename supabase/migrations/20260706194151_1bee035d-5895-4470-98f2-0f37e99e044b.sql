
TRUNCATE TABLE public.user_attempts;

ALTER TABLE public.user_attempts
  DROP CONSTRAINT IF EXISTS user_attempts_score_check,
  DROP CONSTRAINT IF EXISTS user_attempts_score_valid,
  DROP CONSTRAINT IF EXISTS user_attempts_total_check;

ALTER TABLE public.user_attempts
  ADD CONSTRAINT user_attempts_total_positive CHECK (total > 0),
  ADD CONSTRAINT user_attempts_score_valid CHECK (score >= 0 AND score <= total);
