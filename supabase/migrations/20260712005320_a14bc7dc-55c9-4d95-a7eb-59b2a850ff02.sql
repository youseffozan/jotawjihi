
CREATE POLICY "teacher media public read" ON storage.objects FOR SELECT USING (bucket_id = 'teacher-media');
CREATE POLICY "teacher media authors upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'teacher-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "teacher media authors update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'teacher-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "teacher media authors delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'teacher-media' AND auth.uid()::text = (storage.foldername(name))[1]);
