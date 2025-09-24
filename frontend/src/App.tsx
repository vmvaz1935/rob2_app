import React, { useEffect, useMemo, useRef, useState } from 'react';

import ArticlesManager from './components/ArticlesManager';
import Stepper from './components/Stepper';
import AlertBanner from './components/AlertBanner';
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

type AlertState = {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
} | null;

type Section = 'evaluation' | 'articles';

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
        dica: 'Detalhar método de geração (por exemplo, tabela aleatória, software).',
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
        dica: 'Comparar grupos quanto a características clínicas relevantes.',
      },
      {
        id: '1.4',
        texto: 'Se houve desequilíbrio basal, há justificativa plausível?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
        dependeDe: '1.3',
        dica: 'Considerar exclusões pós-randomização ou erro de digitação.',
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
        dica: 'Cegamento ou mascaramento.',
      },
      {
        id: '2.3',
        texto: 'As análises seguiram a alocação inicial (intention-to-treat)?',
        respostas: ['Y', 'PY', 'PN', 'N', 'NI', 'NA'],
        dependeDe: '2.1',
        dica: 'Verificar se participantes foram analisados no grupo original.',
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

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('evaluation');
  const [step, setStep] = useState(0);
  const [preConsiderations, setPreConsiderations] = useState('');
  const [respostas, setRespostas] = useState<Record<number, Record<string, string>>>({});
  const [observacoes, setObservacoes] = useState<Record<number, Record<string, string>>>({});
  const [apiStatus, setApiStatus] = useState<'unknown' | 'ok' | 'down'>('unknown');
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<DomainDefinition[]>(FALLBACK_DOMAINS);
  const [answerLabels, setAnswerLabels] = useState<Record<string, string>>(DEFAULT_ANSWER_LABELS);
  const [stepNames, setStepNames] = useState<string[]>(DEFAULT_STEP_NAMES);
  const [apiToken, setApiToken] = useState(() => localStorage.getItem('rob2_api_token') ?? '');
  const [resultId, setResultId] = useState<number>(1);
  const [alert, setAlert] = useState<AlertState>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);

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
        const [questionsResponse, translationsResponse] = await Promise.all([
          api.get<FetchedQuestions>('/domains/questions'),
          api.get('/i18n/pt-BR').catch(() => ({ data: null })),
        ]);

        if (questionsResponse.data?.dominios?.length) {
          setQuestions(questionsResponse.data.dominios);
        }
        if (translationsResponse.data) {
          const translations = translationsResponse.data as any;
          if (Array.isArray(translations['wizard.steps'])) {
            setStepNames(translations['wizard.steps']);
          }
          if (translations.answers) {
            setAnswerLabels(translations.answers);
          }
        }
      } catch (error) {
        console.error('Não foi possível carregar perguntas de domínio', error);
        setMetadataError('Não foi possível carregar as perguntas do servidor. Usando conteúdo local.');
      } finally {
        setMetadataLoading(false);
      }
    };

    loadMetadata();
  }, []);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus({ preventScroll: false });
    }
  }, [step]);

  const domainMap = useMemo(() => {
    const map: Record<number, DomainDefinition> = {};
    questions.forEach((domain) => {
      map[domain.dominio] = domain;
    });
    return map;
  }, [questions]);

  const domainIds = useMemo(() => {
    if (!questions.length) {
      return FALLBACK_DOMAINS.map((domain) => domain.dominio);
    }
    return [...questions.map((domain) => domain.dominio)].sort((a, b) => a - b);
  }, [questions]);

  const totalSteps = domainIds.length + 2;
  const summaryStepIndex = totalSteps - 1;

  const computedStepNames = useMemo(() => {
    if (stepNames.length === totalSteps) {
      return stepNames;
    }
    if (stepNames.length === DEFAULT_STEP_NAMES.length) {
      return DEFAULT_STEP_NAMES.slice(0, totalSteps - 1).concat('Resumo');
    }
    return DEFAULT_STEP_NAMES;
  }, [stepNames, totalSteps]);

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
  }, [domainIds, domainMap, respostas, step, summaryStepIndex]);

  const handleNextStep = () => setStep((current) => Math.min(current + 1, summaryStepIndex));
  const handlePreviousStep = () => setStep((current) => Math.max(current - 1, 0));
  const handleStepSelect = (index: number) => {
    if (index <= step) {
      setStep(index);
    }
  };


  const handleChangeResposta = (dominio: number, perguntaId: string, valor: string) => {
    const definition = domainMap[dominio];
    const dependentIdsToReset: string[] = [];
  
    setRespostas((previous) => {
      const currentAnswers = previous[dominio] || {};
      const updatedAnswers: Record<string, string> = {
        ...currentAnswers,
        [perguntaId]: valor,
      };
  
      if (definition) {
        definition.itens
          .filter((item) => item.dependeDe === perguntaId)
          .forEach((dependentQuestion) => {
            if (shouldDisableQuestion(updatedAnswers, dependentQuestion)) {
              updatedAnswers[dependentQuestion.id] = 'NA';
              dependentIdsToReset.push(dependentQuestion.id);
            }
          });
      }
  
      return {
        ...previous,
        [dominio]: updatedAnswers,
      };
    });
  
    if (dependentIdsToReset.length) {
      setObservacoes((previous) => {
        const domainObservations = { ...(previous[dominio] || {}) };
        dependentIdsToReset.forEach((id) => {
          delete domainObservations[id];
        });
        return {
          ...previous,
          [dominio]: domainObservations,
        };
      });
    }
  };
  
  const handleChangeObservacao = (dominio: number, perguntaId: string, valor: string) => {
    setObservacoes((previous) => ({
      ...previous,
      [dominio]: {
        ...(previous[dominio] || {}),
        [perguntaId]: valor,
      },
    }));
  };

  const buildPayload = () => {
    const dominiosPayload = domainIds.map((dominioId) => {
      const respostasDom = respostas[dominioId] || {};
      const observacoesDom = observacoes[dominioId] || {};
      const observacoesFiltradas = Object.fromEntries(
        Object.entries(observacoesDom).filter(([, value]) => value && value.trim().length > 0),
      );
  
      return {
        tipo: dominioId,
        respostas: respostasDom,
        comentarios: null,
        observacoes_itens: observacoesFiltradas,
        direcao: 'NA',
      };
    });
  
    return {
      pre_consideracoes: preConsiderations,
      dominios: dominiosPayload,
    };
  };

  const handleConcluir = async () => {
    setAlert(null);
    const payload = buildPayload();

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'avaliacao_rob2.json';
    anchor.click();
    URL.revokeObjectURL(url);

    if (!apiToken) {
      setAlert({ type: 'info', message: 'Arquivo exportado. Informe um token JWT para sincronizar com a API.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/evaluations', {
        resultado_id: resultId,
        pre_consideracoes: payload.pre_consideracoes,
        dominios: payload.dominios,
      });
      setAlert({ type: 'success', message: 'Avaliacao sincronizada com sucesso.' });
    } catch (error) {
      console.error('Falha ao enviar avaliacao', error);
      setAlert({
        type: 'error',
        message: `Nao foi possivel enviar a avaliacao: ${getErrorMessage(error)}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setAlert(null);
    if (!apiToken) {
      setAlert({ type: 'info', message: 'Informe um token JWT para gerar o PDF.' });
      return;
    }

    setDownloadingPdf(true);
    const payload = buildPayload();
    try {
      await api.post('/evaluations', {
        resultado_id: resultId,
        pre_consideracoes: payload.pre_consideracoes,
        dominios: payload.dominios,
      });

      const response = await api.get(`/results/${resultId}/export`, {
        params: { format: 'pdf' },
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      let filename = `avaliacao_resultado_${resultId}.pdf`;
      const disposition = response.headers['content-disposition'];
      if (typeof disposition === 'string') {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match?.[1]) {
          filename = match[1];
        }
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      setAlert({ type: 'success', message: 'PDF gerado com sucesso.' });
    } catch (error) {
      console.error('Falha ao gerar PDF', error);
      setAlert({
        type: 'error',
        message: `Nao foi possivel gerar o PDF: ${getErrorMessage(error)}`,
      });
    } finally {
      setDownloadingPdf(false);
    }
  };


  const handleResetEvaluation = () => {
    setPreConsiderations('');
    setRespostas({});
    setObservacoes({});
    setStep(0);
    setShowResetConfirm(false);
    setAlert({ type: 'success', message: 'Avaliação reiniciada.' });
  };

  const renderPreConsiderations = () => (
    <div className="flex flex-col gap-2">
      <label htmlFor="preConsid" className="font-semibold">Pré-considerações</label>
      <textarea
        id="preConsid"
        className="w-full min-h-[8rem] rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        value={preConsiderations}
        onChange={(event) => setPreConsiderations(event.target.value)}
      />
    </div>
  );


  const renderDomain = (dominioId: number) => {
    const definition = domainMap[dominioId] || FALLBACK_DOMAINS.find((item) => item.dominio === dominioId);
    if (!definition) {
      return <p>Domínio não encontrado.</p>;
    }
  
    const answersForDomain = respostas[dominioId] || {};
    const observationsForDomain = observacoes[dominioId] || {};
  
    return (
      <fieldset className="flex flex-col gap-4" aria-labelledby={`domain-${dominioId}-legend`}>
        <legend id={`domain-${dominioId}-legend`} className="text-lg font-semibold text-gray-900">
          Domínio {dominioId} – {definition.descricao}
        </legend>
        {definition.itens.map((item) => {
          const disabled = shouldDisableQuestion(answersForDomain, item);
          const groupName = `${dominioId}-${item.id}`;
          const hintId = `${groupName}-hint`;
          const observationId = `${groupName}-observation`;
          const observationValue = observationsForDomain[item.id] ?? '';
          return (
            <div key={item.id} className="flex flex-col gap-2 rounded-md bg-white p-4 shadow-sm border border-gray-200">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-900">{item.id}.</span>
                <span className="text-gray-700">{item.texto}</span>
                {item.dica && (
                  <small id={hintId} className="text-sm text-gray-500">
                    {item.dica}
                  </small>
                )}
                {disabled && (
                  <small className="text-sm text-amber-600">
                    Esta pergunta será habilitada quando a questão {item.dependeDe} indicar preocupação.
                  </small>
                )}
              </div>
              <div role="radiogroup" aria-labelledby={hintId} className="flex flex-wrap gap-4">
                {item.respostas.map((option) => (
                  <label key={option} className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name={groupName}
                      value={option}
                      checked={answersForDomain[item.id] === option}
                      onChange={(event) => handleChangeResposta(dominioId, item.id, event.target.value)}
                      disabled={disabled && option !== 'NA'}
                      className="h-4 w-4"
                    />
                    {answerLabels[option] || option}
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={observationId} className="text-sm font-medium text-gray-800">
                  Observações (opcional)
                </label>
                <textarea
                  id={observationId}
                  name={`${groupName}-observacao`}
                  value={observationValue}
                  onChange={(event) => handleChangeObservacao(dominioId, item.id, event.target.value)}
                  disabled={disabled}
                  aria-describedby={hintId}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                  placeholder="Inclua justificativas, fontes ou notas de auditoria."
                  rows={3}
                />
              </div>
            </div>
          );
        })}
      </fieldset>
    );
  };

  const renderSummary = () => (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-900">Resumo das respostas</h2>
      <p><strong>Pré-considerações:</strong> {preConsiderations || '–'}</p>
      {domainIds.map((dominioId) => {
        const domain = domainMap[dominioId];
        const domainAnswers = respostas[dominioId] || {};
        const domainObservations = observacoes[dominioId] || {};
        if (!domain) {
          return null;
        }
        return (
          <div key={dominioId} className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900">Domínio {dominioId} – {domain.descricao}</h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">
              {domain.itens.map((item) => {
                const answerValue = domainAnswers[item.id];
                const answerLabel = answerLabels[answerValue] || answerValue || 'Não respondido';
                const observationText = domainObservations[item.id]?.trim();
                return (
                  <li key={item.id} className="space-y-1">
                    <p>{item.id}: {answerLabel}</p>
                    {observationText && (
                      <p className="text-sm text-gray-500">Observação: {observationText}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );

  const renderEvaluation = () => (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4">
      {apiStatus === 'down' && (
        <AlertBanner
          type="warning"
          message="A API está indisponível no momento. As respostas serão armazenadas apenas localmente."
        />
      )}
      {alert && (
        <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="text-xl font-semibold text-gray-900 focus:outline-none"
              >
                Avaliação de Risco de Viés (RoB 2)
              </h1>
              <p className="text-sm text-gray-600">Etapas guiadas com validação automática.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Reiniciar avaliação
              </button>
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <p><strong>Como autenticar:</strong> utilize a rota <code>/api/auth/login</code> para gerar um token JWT e cole-o no campo abaixo. O token será usado também na biblioteca de artigos.</p>
            <p><strong>ID do resultado:</strong> informe o identificador do resultado já cadastrado no backend para sincronizar esta avaliação.</p>
          </div>

          <Stepper
            steps={computedStepNames}
            currentStep={step}
            onStepSelect={handleStepSelect}
          />

          {metadataLoading ? (
            <div className="space-y-3" aria-live="polite">
              <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
              <div className="space-y-2">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded bg-gray-100" />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {step === 0 && renderPreConsiderations()}
              {step > 0 && step < summaryStepIndex && renderDomain(domainIds[step - 1])}
              {step === summaryStepIndex && renderSummary()}
            </div>
          )}

          <div className="flex flex-col gap-4 rounded-md border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
            <label className="flex flex-col">
              Token JWT do backend
              <input
                type="text"
                value={apiToken}
                onChange={(event) => setApiToken(event.target.value.trim())}
                placeholder="Cole o token Bearer"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
            <label className="flex flex-col w-36">
              Resultado ID
              <input
                type="number"
                min={1}
                value={resultId}
                onChange={(event) => setResultId(Number(event.target.value) || 1)}
                className="mt-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePreviousStep}
              disabled={step === 0}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            {step < summaryStepIndex ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={!isCurrentStepComplete || metadataLoading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                Proximo
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf || submitting}
                  className="rounded-md border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:cursor-progress disabled:opacity-60"
                >
                  {downloadingPdf ? 'Gerando...' : 'Baixar PDF'}
                </button>
                <button
                  type="button"
                  onClick={handleConcluir}
                  disabled={submitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-progress"
                >
                  {submitting ? 'Enviando...' : 'Concluir'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">Reiniciar avaliação</h2>
            <p className="mt-2 text-sm text-gray-600">
              Essa ação apagará todas as respostas registradas nesta sessão. Deseja continuar?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetEvaluation}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">RoB2 - Avaliação de Risco de Viés</h1>
            <p className="text-sm text-gray-500">API: {apiStatus}</p>
          </div>
          <nav className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveSection('evaluation')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeSection === 'evaluation' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Formulário RoB2
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('articles')}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                activeSection === 'articles' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Biblioteca de artigos
            </button>
          </nav>
        </div>
      </header>

      <main className="py-6">
        {activeSection === 'evaluation' && renderEvaluation()}
        {activeSection === 'articles' && <ArticlesManager apiToken={apiToken} />}
      </main>
    </div>
  );
};

export default App;
