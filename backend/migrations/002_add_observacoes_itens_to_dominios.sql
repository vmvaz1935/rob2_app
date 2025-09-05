-- Adiciona coluna para observações por item na tabela de domínios
ALTER TABLE IF EXISTS dominios
ADD COLUMN IF NOT EXISTS observacoes_itens JSONB;


