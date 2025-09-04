# Avaliação de Risco de Viés (RoB 2)

Este repositório contém um protótipo de aplicação web destinada a reproduzir a lógica do **RoB 2** (Risk of Bias 2) por resultado, conforme as macros e formulários do arquivo Excel oficial (`ROB2_IRPG_beta_v9.xlsm`). O objetivo é possibilitar que revisores avaliem o risco de viés em ensaios clínicos de forma estruturada, segura e acessível em um ambiente colaborativo.

## Visão geral

O sistema foi concebido como uma aplicação de código aberto e modular, dividida em três camadas principais:

1. **Backend** — Construído em **FastAPI** utilizando **Python**, com banco de dados **PostgreSQL**. Responsável pelo armazenamento de projetos, estudos, resultados e avaliações, pela execução do motor de regras que deriva julgamentos e direções de viés, além dos serviços de importação/exportação de planilhas Excel e geração de relatórios em DOCX/PDF.
2. **Frontend** — Desenvolvido em **React** com **TypeScript**, compondo um assistente (“wizard”) que guia os usuários através das pré‑considerações e dos cinco domínios do RoB 2. A interface é totalmente internacionalizada (pt‑BR), acessível (WCAG AA) e permite a visualização de julgamentos em tempo real.
3. **Infraestrutura** — Contém arquivos de configuração de contêineres (**Dockerfile** e **docker‑compose.yml**), scripts de automação (**Makefile**) e um pipeline de integração contínua (GitHub Actions) para lint, testes e construção de imagens.

**Licença**: este projeto é distribuído sob os termos da licença CC BY‑NC‑ND 4.0. Consulte a pasta `docs` para detalhes e links ao material original do RoB 2. Não são reproduzidos trechos extensos das diretrizes; apenas as estruturas lógicas necessárias foram convertidas para código.

## Requisitos e funcionalidades principais

* Avaliação por resultado (cada instância de avaliação é vinculada a um desfecho específico de um estudo).
* Cinco domínios de risco de viés: (1) viés do processo de randomização; (2) desvios das intervenções pretendidas (assignment/adherence); (3) dados de desfecho ausentes; (4) mensuração do desfecho; (5) seleção do resultado relatado.
* Perguntas condicionais e respostas padronizadas (`Y`, `PY`, `PN`, `N`, `NI`, `NA`), com tradução para português.
* Motor de regras em JSON que replica a lógica do arquivo Excel, calculando o julgamento de cada domínio e o julgamento global automaticamente.
* Importação de planilhas `.xlsx`/`.xlsm` contendo avaliações pré‑existentes e exportação para o mesmo formato, mantendo as abas/colunas originais. Divergências entre os julgamentos armazenados e os recalculados pelo motor são destacadas.
* Geração de relatórios narrativos em `.docx`, de acordo com o idioma e os textos de apoio definidos no projeto.
* Controle de acesso com autenticação por e‑mail/senha, papéis de usuário por projeto (Leitor, Editor, Administrador) e trilha de auditoria.
* Interface amigável e responsiva, com suporte a teclado, indicações visuais de status (cores verde/vermelho) e resumo imprimível.

## Como executar

Para fins de desenvolvimento local, é possível levantar os serviços com Docker Compose. Certifique‑se de ter **Docker** e **Docker Compose** instalados.

```bash
# Clonar o repositório e acessar a pasta
git clone <REPOSITÓRIO>
cd rob2_app

# Subir os serviços
docker-compose up --build

# A API estará acessível em http://localhost:8000 e a interface web em http://localhost:3000
```

Mais detalhes sobre a configuração de ambiente, comandos de make e preparação do banco de dados encontram‑se na seção *Infraestrutura* deste repositório.

## Estrutura do repositório

```
rob2_app/
├── backend/                 # Código do servidor FastAPI
│   ├── app/
│   │   ├── main.py          # Inicialização da API e rotas principais
│   │   ├── models.py        # Modelos SQLAlchemy
│   │   ├── schemas.py       # Schemas Pydantic (DTOs)
│   │   ├── database.py      # Conexão e sessão com Postgres
│   │   ├── services/        # Serviços de negócios (auth, avaliações, import/export)
│   │   ├── rule_engine.py   # Implementação do motor de regras
│   │   ├── import_export.py # Conversão Excel ⇄ entidades
│   │   ├── docx_generator.py# Geração de relatórios DOCX
│   │   └── auth.py          # Autenticação e RBAC
│   ├── tests/               # Testes unitários e de integração
│   └── migrations/          # Migrações de banco (SQL ou Alembic)
├── frontend/                # Projeto React (Vite) com TypeScript
│   ├── src/
│   │   ├── App.tsx         # Componente raiz com wizard
│   │   ├── components/     # Componentes reutilizáveis de UI
│   │   ├── hooks/          # Hooks customizados para estados e i18n
│   │   └── pages/          # Páginas de cada etapa
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── domain/
│   ├── perguntas.json       # Perguntas e metadados por domínio
│   ├── regras.json          # Regras do motor de decisão por domínio
│   ├── regra_global.json    # Regra de agregação global
│   └── i18n/
│       └── pt-BR.json       # Traduções para português
├── seeds/
│   ├── perguntas.json       # Seeds minimamente funcionais (cópia de domain/perguntas)
│   └── regras.json          # Seeds minimamente funcionais (cópia de domain/regras)
├── exemplos/
│   ├── planilhas_importacao/# Planilhas de exemplo para importação
│   └── relatorios/          # Relatórios DOCX de exemplo
├── docs/
│   ├── architecture.md      # Diagrama textual e decisões de arquitetura
│   └── api_spec.yaml        # Especificação OpenAPI
├── mapeamento.xlsx.yaml     # Mapeamento de colunas do Excel para entidades
├── infra/
│   ├── Dockerfile           # Construção do contêiner da API
│   ├── docker-compose.yml   # Orquestração dos serviços (API, banco, frontend)
│   ├── Makefile             # Atalhos de automação
│   └── .github/workflows/ci.yml # Pipeline de CI
└── README.md               # Este documento
```

---

Para maiores detalhes sobre a arquitetura, regras de negócio e contratos de API, consulte os arquivos na pasta `docs`.