
DO $$
DECLARE
  yousef uuid := '5c9c1a54-645f-4264-9d1c-9237ac3fca90';
BEGIN
  DELETE FROM public.post_likes    WHERE user_id <> yousef;
  DELETE FROM public.post_comments WHERE author_id <> yousef;
  DELETE FROM public.teacher_posts WHERE author_id <> yousef;
  DELETE FROM public.follows       WHERE follower_id <> yousef AND followed_id <> yousef;
  DELETE FROM public.user_attempts WHERE user_id <> yousef;
  DELETE FROM public.moderation_reports WHERE reporter_id <> yousef;
  DELETE FROM public.user_presence WHERE user_id <> yousef;
  DELETE FROM public.user_roles    WHERE user_id <> yousef;
  DELETE FROM public.profiles      WHERE id <> yousef;
END $$;
