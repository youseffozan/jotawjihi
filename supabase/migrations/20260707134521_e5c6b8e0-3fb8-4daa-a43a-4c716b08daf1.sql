ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT false;

UPDATE public.subjects SET is_available = true
WHERE id IN ('bus-eng','eng-math','lang-eng','med-eng','st-math');