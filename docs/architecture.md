# Arquitetura e Decisões de Projeto

Este documento descreve a arquitetura proposta para a aplicação **RoB 2**, os fluxos de dados principais e as escolhas de tecnologia adotadas. A ênfase está na modularidade, na extensibilidade (por meio de regras em JSON) e na conformidade com os requisitos de acessibilidade e segurança.

## Diagrama textual de componentes

```
┌─────────────────┐       HTTP/JSON        ┌───────────────────────────────────┐
│     Frontend    │ <────────────────────> │             API (FastAPI)         │
│  React + TS     │                        │ - Endpoints REST                 │
│  (Wizard UI)    │                        │ - Autenticação e RBAC           │
└─────────────────┘                        │ - Motor de regras               │
        │                                  │ - Importação/Exportação Excel   │
        │ WebSockets (opcional)            │ - Geração de DOCX/PDF          │
        │ (atualização em tempo real)      └──────────────┬────────────────────┘
        │                                                  │
        ▼                                                  │
  Estado do aplicativo                                     │
        │                                                  │
        │                                                  ▼
┌─────────────────┐                                ┌──────────────────────────┐
│      Banco      │  conexões via SQLAlchemy      │     Armazenamento        │
│   PostgreSQL    │ <────────────────────────────> │   PostgreSQL (Docker)    │
└─────────────────┘                                └──────────────────────────┘

Fluxo básico:
1. O usuário acessa a interface web, faz login e seleciona um projeto e resultado para avaliar.
2. O frontend carrega as perguntas de cada domínio a partir da API e apresenta um wizard passo a passo.
3. A cada resposta, o frontend envia os dados para a API, que utiliza o **motor de regras** para recalcular o julgamento do domínio e o julgamento global, retornando as atualizações em tempo real.
4. O usuário pode importar uma planilha Excel previamente preenchida; o backend realiza o mapeamento definido em `mapeamento.xlsx.yaml` e armazena as respostas, comentários e julgamentos, recalculando o que for necessário.
5. Ao concluir a avaliação, o usuário pode exportar os dados em `.xlsx` (espelhando o template oficial) ou gerar um relatório narrativo em `.docx`. Estes são produzidos no servidor utilizando as bibliotecas `openpyxl` e `python-docx`.

## Decisões de Arquitetura (ADR)

1. **Escolha do Backend**: optou‑se por **FastAPI** por oferecer desempenho, facilidade de documentação automática (OpenAPI), tipagem forte com Pydantic e compatibilidade com Python, que já é utilizado para manipulação de Excel e geração de DOCX.
2. **Frontend em React**: React com TypeScript e Vite foi escolhido pela produtividade e pelo amplo ecossistema. A biblioteca oferece recursos avançados de gerenciamento de estado (Context API), roteamento (React Router) e acessibilidade (React ARIA).
3. **Motor de Regras em JSON**: ao invés de executar macros VBA, toda a lógica de decisão foi externalizada para arquivos JSON. Isto facilita auditoria, edição e internacionalização das regras, além de permitir testes automatizados.
4. **Estrutura Wizard**: a UI orienta o usuário por etapas sequenciais (pré‑considerações e domínios 1–5), garantindo que as dependências entre perguntas sejam satisfeitas e reduzindo a chance de erro.
5. **RBAC por Projeto**: cada `Projeto` possui usuários com papéis (Leitor, Editor, Administrador). As autorizações são verificadas em cada endpoint e registradas na trilha de auditoria.
6. **Importação/Exportação**: foi adotada a biblioteca `openpyxl` para leitura e escrita de planilhas, respeitando o mapeamento definido em `mapeamento.xlsx.yaml`. É suportado tanto `.xlsx` quanto `.xlsm` (apenas leitura, macros não são executadas).
7. **Geração de Relatórios**: a biblioteca `python-docx` é utilizada para criar documentos narrativos baseados em templates e no idioma pt‑BR. A geração de PDFs pode ser realizada via `docx2pdf` ou ferramenta similar, mas isso é opcional.
8. **Migrações**: as tabelas são criadas por meio de scripts SQL fornecidos em `backend/migrations`. Futuramente, pode‑se integrar o Alembic para gestão de versões de banco.

## Modelo de Dados (ER)

O modelo segue a estrutura proposta no roteiro. Em notação simplificada:

* **Usuario** (`id`, `nome`, `email`, `senhaHash`, `criadoEm`)
* **Projeto** (`id`, `nome`)
* **MembroDeProjeto** (`id`, `usuarioId`, `projetoId`, `papel`) — `papel`: `LEITOR`, `EDITOR`, `ADMIN`
* **Estudo** (`id`, `projetoId`, `referencia`, `desenho`)
* **Resultado** (`id`, `estudoId`, `desfecho`, `medidaEfeito`, `efeitoInteresse`, `resultadoNumerico`, `fontes`)
* **AvaliacaoRob2** (`id`, `resultadoId`, `preConsideracoes`, `julgamentoGlobal`, `direcaoGlobal`, `criadoPor`, `criadoEm`)
* **Dominio** (`id`, `avaliacaoId`, `tipo`, `respostas` JSONB, `comentarios` TEXT, `julgamento`, `direcao`)
* **Auditoria** (`id`, `avaliacaoId`, `usuarioId`, `acao`, `dataHora`)

O relacionamento entre `Projeto` → `Estudo` → `Resultado` → `AvaliacaoRob2` → `Dominio` é hierárquico. As respostas às perguntas são armazenadas no campo JSONB `respostas` do domínio, permitindo flexibilidade de chaves (ex.: `"1.1": "Y"`).

## Esquema de banco e migrações

As migrações iniciais são fornecidas no arquivo `backend/migrations/001_create_tables.sql`. Este script cria todas as tabelas e define chaves estrangeiras, índices e enumerações necessárias.

## Especificação da API

O arquivo `docs/api_spec.yaml` descreve a API seguindo o padrão OpenAPI 3.1. Entre os principais endpoints:

* `POST /api/auth/login`: autentica um usuário e retorna um token JWT.
* `GET /api/projects`: lista projetos do usuário autenticado.
* `POST /api/projects`: cria um novo projeto.
* `GET /api/projects/{projectId}/studies`: lista estudos de um projeto.
* `POST /api/studies`: cria um novo estudo.
* `GET /api/results/{resultId}/evaluation`: obtém a avaliação do resultado.
* `POST /api/evaluations`: cria ou atualiza uma avaliação, recalculando julgamentos.
* `POST /api/import`: importa uma planilha Excel conforme o mapeamento.
* `GET /api/results/{resultId}/export`: exporta a avaliação para Excel ou DOCX.

Consulte `docs/api_spec.yaml` para detalhes de parâmetros, respostas e códigos de erro.