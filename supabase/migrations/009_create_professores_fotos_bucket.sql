INSERT INTO storage.buckets (id, name, public)
  VALUES ('professores-fotos', 'professores-fotos', true)
  ON CONFLICT (id) DO NOTHING;
 
CREATE POLICY "Leitura publica das fotos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'professores-fotos');
 
CREATE POLICY "Upload de fotos restrito a editor e admin"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'professores-fotos'
    AND (get_my_role() = 'admin' OR get_my_role() = 'editor'));
 
CREATE POLICY "Delete de fotos restrito a admin"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'professores-fotos'
    AND get_my_role() = 'admin');