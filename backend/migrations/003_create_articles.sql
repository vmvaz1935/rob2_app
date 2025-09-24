-- Cria tabela de artigos vinculados aos usuários

CREATE TABLE IF NOT EXISTS artigos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    autores VARCHAR(255) NOT NULL,
    revista VARCHAR(255),
    ano INTEGER,
    doi VARCHAR(100),
    url VARCHAR(255),
    resumo TEXT,
    palavras_chave JSONB,
    tipo_estudo VARCHAR(100),
    desenho VARCHAR(100),
    desfechos JSONB,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artigos_usuario_id ON artigos(usuario_id);
