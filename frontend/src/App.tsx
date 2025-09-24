import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';

import { onAuthStateChange } from './firebase/auth';
import LoginButton from './components/LoginButton';
import ArticlesManager from './components/ArticlesManager';
import { api, apiRootUrl, setDefaultAuthToken } from './services/api';

interface DomainQuestion {
  id: string;
  texto: string;
  respostas: string[];
  dependeDe?: string | null;
  dica?: string;
}

interface DomainDefinition {
  dominio: number;
  descricao: string;
  itens: DomainQuestion[];
}

interface FetchedQuestions {
  dominios?: DomainDefinition[];
}

const DEFAULT_STEP_NAMES = [
  'Pré-considerações',
  'Domínio 1',
  'Domínio 2',
  'Domínio 3',
  'Domínio 4',
  'Domínio 5',
  'Resumo',
];

const DEFAULT_ANSWER_LABELS: Record<string, string> = {
  Y: 'Sim',
  PY: 'Provavelmente sim',
  PN: 'Provavelmente não',
  N: 'Não',
  NI: 'Sem informação',
  NA: 'Não se aplica',
};

const FALLBACK_DOMAINS: DomainDefinition[] = [
  {
    dominio: 1,
    descricao: 'Viés do processo de randomização',
    itens: [
      {
        id: '1.1',
        texto: 'A sequência de alocação foi verdadeiramente aleatória?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
        dica: 'Detalhar método de geração (por exemplo, tabela aleatória, software)',
      },
      {
        id: '1.2',
        texto: 'A sequência de alocação foi ocultada até a inclusão?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
        dica: 'Verificar uso de envelopes opacos, centralização etc.',
      },
      {
        id: '1.3',
        texto: 'As características basais sugerem problemas na randomização?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
        dica: 'Comparar grupos quanto a características clínicas relevantes',
      },
      {
        id: '1.4',
        texto: 'Se houve desequilíbrio basal, há justificativa plausível?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
        dependeDe: '1.3',
        dica: 'Considerar exclusões pós-randomização ou erro de digitação',
      },
    ],
  },
  {
    dominio: 2,
    descricao: 'Desvios das intervenções pretendidas (assignment/adherence)',
    itens: [
      {
        id: '2.1',
        texto: 'Houve desvios das intervenções que poderiam afetar o desfecho?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
      },
      {
        id: '2.2',
        texto: 'Os participantes e profissionais estavam cegos quanto à intervenção?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
        dica: 'Cegamento ou mascaramento',
      },
      {
        id: '2.3',
        texto: 'As análises seguiram a alocação inicial (intention-to-treat)?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
        dependeDe: '2.1',
        dica: 'Verificar se participantes foram analisados no grupo original',
      },
    ],
  },
  {
    dominio: 3,
    descricao: 'Dados de desfecho ausentes',
    itens: [
      {
        id: '3.1',
        texto: 'A proporção de dados ausentes é suficiente para impactar o resultado?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
      },
      {
        id: '3.2',
        texto: 'A ausência de dados está relacionada ao verdadeiro valor do desfecho?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
      },
      {
        id: '3.3',
        texto: 'As imputações/tratamento de dados ausentes foram apropriados?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
        dependeDe: '3.1',
      },
    ],
  },
  {
    dominio: 4,
    descricao: 'Mensuração do desfecho',
    itens: [
      {
        id: '4.1',
        texto: 'O método de mensuração do desfecho é válido e confiável?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
      },
      {
        id: '4.2',
        texto: 'Os avaliadores estavam cegos quanto à intervenção recebida?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
      },
      {
        id: '4.3',
        texto: 'A mensuração diferiu entre grupos ou sofreu interferências?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
      },
    ],
  },
  {
    dominio: 5,
    descricao: 'Seleção do resultado relatado',
    itens: [
      {
        id: '5.1',
        texto: 'As análises do desfecho estavam pré-especificadas?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
      },
      {
        id: '5.2',
        texto: 'Há evidência de seleção ou substituição seletiva de resultados?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
        dependeDe: '5.1',
      },
    ],
  },
];

const FALLBACK_DOMAIN_IDS = FALLBACK_DOMAINS.map((domain) => domain.dominio);

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const shouldDisableQuestion = (
  answers: Record<string, string> | undefined,
  question: DomainQuestion,
) => {
  if (!question.dependeDe) {
    return false;
  }
  const dependencyValue = answers?.[question.dependeDe];
  return !dependencyValue || !['Y', 'PY'].includes(dependencyValue);
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'articles' | 'evaluation'>('login');
  const [step, setStep] = useState(0);
  const [preConsiderations, setPreConsiderations] = useState('');
  const [respostas, setRespostas] = useState<Record<number, Record<string, string>>>({});
  const [apiStatus, setApiStatus] = useState<'unknown' | 'ok' | 'down'>('unknown');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DomainDefinition[]>(FALLBACK_DOMAINS);
  const [answerLabels, setAnswerLabels] = useState<Record<string, string>>(DEFAULT_ANSWER_LABELS);
  const [stepNames, setStepNames] = useState<string[]>(DEFAULT_STEP_NAMES);
  const [apiToken, setApiToken] = useState(() => localStorage.getItem('rob2_api_token') ?? '');
  const [resultId, setResultId] = useState<number>(1);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setCurrentView('articles');
      } else {
        setCurrentView('login');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setDefaultAuthToken(apiToken || null);
    if (apiToken) {
      localStorage.setItem('rob2_api_token', apiToken);
    } else {
      localStorage.removeItem('rob2_api_token');
    }
  }, [apiToken]);

  useEffect(() => {
    const ping = async () => {
      try {
        const response = await fetch(`${apiRootUrl}/health`);
        setApiStatus(response.ok ? 'ok' : 'down');
      } catch (error) {
        console.error('Falha ao consultar status da API', error);
        setApiStatus('down');
      }
    };
    ping();
  }, []);

  useEffect(() => {
    const loadMetadata = async () => {
      setMetadataLoading(true);
      setMetadataError(null);
      try {
        const [perguntasResponse, i18nResponse] = await Promise.all<[
          { data: FetchedQuestions },
          { data: any }
        ]>([
          api.get<FetchedQuestions>('/domains/questions'),
          api.get('/i18n/pt-BR').catch(() => ({ data: null })),
        ]);

        if (perguntasResponse.data?.dominios?.length) {
          setQuestions(perguntasResponse.data.dominios);
        }
        if (i18nResponse.data) {
          if (Array.isArray(i18nResponse.data['wizard.steps'])) {
            setStepNames(i18nResponse.data['wizard.steps']);
          }
          if (i18nResponse.data.answers) {
            setAnswerLabels(i18nResponse.data.answers);
          }
        }
      } catch (error) {
        console.error('Não foi possível carregar perguntas da API', error);
        setMetadataError('Não foi possível carregar as perguntas do servidor. Usando conteúdo local.');
      } finally {
        setMetadataLoading(false);
      }
    };

    loadMetadata();
  }, []);

  const domainMap = useMemo(() => {
    const map: Record<number, DomainDefinition> = {};
    questions.forEach((domain) => {
      map[domain.dominio] = domain;
    });
    return map;
  }, [questions]);

  const domainIds = useMemo(() => {
    if (questions.length === 0) {
      return FALLBACK_DOMAIN_IDS;
    }
    return [...questions.map((domain) => domain.dominio)].sort((a, b) => a - b);
  }, [questions]);

  const totalSteps = domainIds.length + 2; // pré + domínios + resumo
  const summaryStepIndex = totalSteps - 1;

  const computedStepNames = useMemo(() => {
    if (stepNames.length === totalSteps) {
      return stepNames;
    }
    if (stepNames.length === DEFAULT_STEP_NAMES.length) {
      return DEFAULT_STEP_NAMES;
    }
    return DEFAULT_STEP_NAMES.slice(0, totalSteps - 1).concat('Resumo');
  }, [stepNames, totalSteps]);

  const getStepLabel = (currentStep: number) => {
    if (currentStep < computedStepNames.length) {
      return computedStepNames[currentStep];
    }
    return computedStepNames[computedStepNames.length - 1];
  };

  const isCurrentStepComplete = useMemo(() => {
    if (step === 0 || step === summaryStepIndex) {
      return true;
    }
    const domainId = domainIds[step - 1];
    const definition = domainMap[domainId];
    if (!definition) {
      return true;
    }
    const answersForDomain = respostas[domainId] || {};
    return definition.itens.every((question) => {
      if (shouldDisableQuestion(answersForDomain, question)) {
        return true;
      }
      return Boolean(answersForDomain[question.id]);
    });
  }, [step, summaryStepIndex, domainIds, domainMap, respostas]);

  const nextStep = () => setStep((current) => Math.min(current + 1, summaryStepIndex));
  const prevStep = () => setStep((current) => Math.max(current - 1, 0));

  const handleChangeResposta = (dominio: number, perguntaId: string, valor: string) => {
    setRespostas((prev) => {
      const previousAnswers = prev[dominio] || {};
      const updatedResponses: Record<string, string> = {
        ...previousAnswers,
        [perguntaId]: valor,
      };

      const definition = domainMap[dominio];
      if (definition) {
        definition.itens
          .filter((item) => item.dependeDe === perguntaId)
          .forEach((dependentQuestion) => {
            if (shouldDisableQuestion(updatedResponses, dependentQuestion)) {
              updatedResponses[dependentQuestion.id] = 'NA';
            }
          });
      }

      return {
        ...prev,
        [dominio]: updatedResponses,
      };
    });
  };

  const buildPayload = () => {
    const dominiosPayload = domainIds.map((dominioId) => ({
      tipo: dominioId,
      respostas: respostas[dominioId] || {},
      comentarios: null,
      observacoes_itens: {},
      direcao: 'NA',
    }));

    return {
      pre_consideracoes: preConsiderations,
      dominios: dominiosPayload,
    };
  };

  const handleConcluir = async () => {
    setFeedback(null);
    setFeedbackError(null);
    const data = buildPayload();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'avaliacao_rob2.json';
    anchor.click();
    URL.revokeObjectURL(url);

    if (!apiToken) {
      setFeedback('Arquivo exportado. Informe um token JWT para sincronizar com a API.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/evaluations', {
        resultado_id: resultId,
        pre_consideracoes: data.pre_consideracoes,
        dominios: data.dominios,
      });
      setFeedback('Avaliação sincronizada com sucesso.');
    } catch (error) {
      console.error('Falha ao enviar avaliação', error);
      setFeedbackError(`Não foi possível enviar a avaliação: ${getErrorMessage(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderPreConsiderations = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label htmlFor="preConsid" style={{ fontWeight: 'bold' }}>Pré-considerações</label>
      <textarea
        id="preConsid"
        style={{ width: '100%', minHeight: '8rem' }}
        value={preConsiderations}
        onChange={(event) => setPreConsiderations(event.target.value)}
        aria-label="Pré-considerações"
      />
    </div>
  );

  const renderDomain = (dominioId: number) => {
    const definition = domainMap[dominioId] || FALLBACK_DOMAINS.find((item) => item.dominio === dominioId);
    if (!definition) {
      return <p>Domínio não encontrado.</p>;
    }

    const answersForDomain = respostas[dominioId] || {};

    return (
      <fieldset style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <legend style={{ fontWeight: 'bold' }}>
          Domínio {dominioId} — {definition.descricao}
        </legend>
        {definition.itens.map((item) => {
          const disabled = shouldDisableQuestion(answersForDomain, item);
          const groupName = `${dominioId}-${item.id}`;
          const hintId = `${groupName}-hint`;
          return (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{item.id}.</span> {item.texto}
              </div>
              {item.dica && (
                <small id={hintId} style={{ color: '#4b5563' }}>
                  {item.dica}
                </small>
              )}
              {disabled && (
                <small style={{ color: '#b91c1c' }}>
                  Esta pergunta será habilitada quando a questão {item.dependeDe} indicar preocupação.
                </small>
              )}
              <div role="radiogroup" aria-labelledby={hintId} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {item.respostas.map((option) => (
                  <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input
                      type="radio"
                      name={groupName}
                      value={option}
                      checked={answersForDomain[item.id] === option}
                      onChange={(event) => handleChangeResposta(dominioId, item.id, event.target.value)}
                      disabled={disabled && option !== 'NA'}
                    />
                    {answerLabels[option] || option}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </fieldset>
    );
  };

  const renderSummary = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Resumo das respostas</h2>
      <p><strong>Pré-considerações:</strong> {preConsiderations || '—'}</p>
      {domainIds.map((dominioId) => {
        const domain = domainMap[dominioId];
        const domainAnswers = respostas[dominioId] || {};
        if (!domain) {
          return null;
        }
        return (
          <div key={dominioId} style={{ marginTop: '0.5rem' }}>
            <h3 style={{ fontWeight: 'bold' }}>Domínio {dominioId} — {domain.descricao}</h3>
            <ul>
              {domain.itens.map((item) => (
                <li key={item.id}>
                  {item.id}: {answerLabels[domainAnswers[item.id]] || domainAnswers[item.id] || 'Não respondido'}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );

  const renderHeader = () => (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 h-full py-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">RoB2 - Avaliação de Risco de Viés</h1>
            <p className="text-sm text-gray-500">API: {apiStatus}</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {user && currentView === 'evaluation' && (
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-600">
                  Token JWT do backend
                  <input
                    type="text"
                    value={apiToken}
                    onChange={(event) => setApiToken(event.target.value.trim())}
                    placeholder="Cole o token Bearer"
                    className="mt-1 block w-64 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </label>
                <label className="text-sm text-gray-600">
                  Resultado ID
                  <input
                    type="number"
                    min={1}
                    value={resultId}
                    onChange={(event) => setResultId(Number(event.target.value) || 1)}
                    className="mt-1 block w-24 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </label>
              </div>
            )}
            {user && (
              <nav className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('articles')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'articles' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Meus Artigos
                </button>
                <button
                  onClick={() => setCurrentView('evaluation')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'evaluation' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Avaliação RoB2
                </button>
              </nav>
            )}
            <LoginButton
              onLoginSuccess={() => setCurrentView('articles')}
              onLogout={() => setCurrentView('login')}
            />
          </div>
        </div>
      </div>
    </header>
  );

  const renderEvaluation = () => (
    <div style={{ margin: '0 auto', padding: '1rem', maxWidth: '760px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Avaliação de Risco de Viés (RoB 2)</h1>
      {metadataError && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', border: '1px solid #fbbf24', background: '#fef3c7', borderRadius: '0.5rem' }}>
          {metadataError}
        </div>
      )}
      {metadataLoading ? (
        <p>Carregando perguntas...</p>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <p>
              Etapa {step + 1} de {totalSteps}: <strong>{getStepLabel(step)}</strong>
            </p>
          </div>
          <div style={{ border: '1px solid #d1d5db', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}>
            {step === 0 && renderPreConsiderations()}
            {step > 0 && step < summaryStepIndex && renderDomain(domainIds[step - 1])}
            {step === summaryStepIndex && renderSummary()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
            <button onClick={prevStep} disabled={step === 0}>
              Anterior
            </button>
            {step < summaryStepIndex ? (
              <button onClick={nextStep} disabled={!isCurrentStepComplete}>
                Próximo
              </button>
            ) : (
              <button onClick={handleConcluir} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Concluir'}
              </button>
            )}
          </div>
          {(feedback || feedbackError) && (
            <div style={{ marginTop: '1rem' }} aria-live="polite">
              {feedback && <p style={{ color: '#047857' }}>{feedback}</p>}
              {feedbackError && <p style={{ color: '#b91c1c' }}>{feedbackError}</p>}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderLogin = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            RoB2 - Avaliação de Risco de Viés
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Faça login com sua conta Google para acessar sua biblioteca de artigos
          </p>
        </div>
        <div className="flex justify-center">
          <LoginButton onLoginSuccess={() => setCurrentView('articles')} />
        </div>
      </div>
    </div>
  );

  if (currentView === 'login') {
    return renderLogin();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      <main className="py-6">
        {currentView === 'articles' && <ArticlesManager />}
        {currentView === 'evaluation' && renderEvaluation()}
      </main>
    </div>
  );
}
