
-- Habilitar realtime para as tabelas lote e agendamento
ALTER PUBLICATION supabase_realtime ADD TABLE public.lote;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamento;
