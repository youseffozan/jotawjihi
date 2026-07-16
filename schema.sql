-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  academic_track TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create academic_tracks table
CREATE TABLE IF NOT EXISTS academic_tracks (
  id SERIAL PRIMARY KEY,
  name_ar TEXT NOT NULL,
  icon TEXT
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name_ar TEXT NOT NULL,
  track_id INTEGER REFERENCES academic_tracks(id) ON DELETE SET NULL,
  grade_level TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE
);

-- Create student_progress table
CREATE TABLE IF NOT EXISTS student_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  score INTEGER,
  total_questions INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
