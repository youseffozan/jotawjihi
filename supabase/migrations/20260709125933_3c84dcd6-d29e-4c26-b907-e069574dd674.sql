
-- Phase 1: Exams system + question tagging (units, banks)

-- 1) Tag questions with unit (1-9) and bank_name for question banks
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS unit integer,
  ADD COLUMN IF NOT EXISTS bank_name text;

CREATE INDEX IF NOT EXISTS questions_unit_idx ON public.questions(subject_id, unit);
CREATE INDEX IF NOT EXISTS questions_bank_idx ON public.questions(subject_id, bank_name);

-- 2) Exams table: ministerial past-papers, question banks, custom exams
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id text NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name_ar text NOT NULL,
  name_en text,
  description text,
  type text NOT NULL DEFAULT 'ministerial' CHECK (type IN ('ministerial','bank','other')),
  year integer,
  duration_seconds integer NOT NULL DEFAULT 3600,
  total_score integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.exams TO anon, authenticated;
GRANT ALL ON public.exams TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.exams TO authenticated;

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exams public read" ON public.exams FOR SELECT USING (true);
CREATE POLICY "exams admin write" ON public.exams FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS exams_subject_idx ON public.exams(subject_id, type, active);

CREATE TRIGGER exams_set_updated_at BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Join: which questions belong to which exam (order matters)
CREATE TABLE IF NOT EXISTS public.exam_questions (
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  PRIMARY KEY (exam_id, question_id)
);

GRANT SELECT ON public.exam_questions TO anon, authenticated;
GRANT ALL ON public.exam_questions TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.exam_questions TO authenticated;

ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exam_questions public read" ON public.exam_questions FOR SELECT USING (true);
CREATE POLICY "exam_questions admin write" ON public.exam_questions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

-- 4) Optional: link an attempt to a specific exam
ALTER TABLE public.user_attempts
  ADD COLUMN IF NOT EXISTS exam_id uuid REFERENCES public.exams(id) ON DELETE SET NULL;
