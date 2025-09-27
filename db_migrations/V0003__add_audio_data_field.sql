-- Добавляем поле для хранения аудиоданных в base64
ALTER TABLE t_p24058207_website_creation_pro.leads 
ADD COLUMN audio_data TEXT;