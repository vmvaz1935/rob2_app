-- Ajustes adicionais no esquema para alinhar com os modelos ORM atuais

ALTER TABLE dominios
    ADD COLUMN IF NOT EXISTS observacoes_itens JSONB,
    ADD COLUMN IF NOT EXISTS justificativa TEXT;

ALTER TABLE membros_projeto
    ADD CONSTRAINT membros_projeto_usuario_projeto_key
        UNIQUE (usuario_id, projeto_id);

CREATE INDEX IF NOT EXISTS idx_estudos_projeto_id ON estudos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_resultados_estudo_id ON resultados(estudo_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_resultado_id ON avaliacoes(resultado_id);
CREATE INDEX IF NOT EXISTS idx_dominios_avaliacao_id ON dominios(avaliacao_id);
