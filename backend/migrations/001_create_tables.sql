-- Migração inicial para criar o esquema do banco de dados

-- Tipos enumerados
CREATE TYPE role_type AS ENUM ('LEITOR', 'EDITOR', 'ADMIN');
CREATE TYPE direction_type AS ENUM ('NA', 'Favorece experimental', 'Favorece comparador', 'Em direção ao nulo', 'Afastando do nulo', 'Imprevisível');

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de projetos
CREATE TABLE IF NOT EXISTS projetos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

-- Relação usuário-projeto com papel
CREATE TABLE IF NOT EXISTS membros_projeto (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    projeto_id INTEGER NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    papel role_type NOT NULL DEFAULT 'EDITOR'
);

-- Tabela de estudos
CREATE TABLE IF NOT EXISTS estudos (
    id SERIAL PRIMARY KEY,
    projeto_id INTEGER NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
    referencia VARCHAR(255) NOT NULL,
    desenho VARCHAR(255)
);

-- Tabela de resultados
CREATE TABLE IF NOT EXISTS resultados (
    id SERIAL PRIMARY KEY,
    estudo_id INTEGER NOT NULL REFERENCES estudos(id) ON DELETE CASCADE,
    desfecho VARCHAR(255) NOT NULL,
    medida_efeito VARCHAR(255),
    efeito_interesse VARCHAR(50),
    resultado_numerico VARCHAR(255),
    fontes JSONB
);

-- Tabela de avaliações RoB2
CREATE TABLE IF NOT EXISTS avaliacoes (
    id SERIAL PRIMARY KEY,
    resultado_id INTEGER NOT NULL REFERENCES resultados(id) ON DELETE CASCADE,
    pre_consideracoes TEXT,
    julgamento_global VARCHAR(50),
    direcao_global direction_type,
    justificativa_global TEXT,
    criado_por_id INTEGER REFERENCES usuarios(id),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de domínios
CREATE TABLE IF NOT EXISTS dominios (
    id SERIAL PRIMARY KEY,
    avaliacao_id INTEGER NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
    tipo INTEGER NOT NULL,
    respostas JSONB NOT NULL,
    comentarios TEXT,
    julgamento VARCHAR(50),
    direcao direction_type
);

-- Tabela de auditorias
CREATE TABLE IF NOT EXISTS auditorias (
    id SERIAL PRIMARY KEY,
    avaliacao_id INTEGER NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    acao VARCHAR(255) NOT NULL,
    data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW()
);