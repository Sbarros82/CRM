-- Habilita REPLICA IDENTITY FULL para que o payload de DELETE no Supabase Realtime
-- contenha todas as colunas (incluindo channel_id), permitindo que o filtro por canal funcione.
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
