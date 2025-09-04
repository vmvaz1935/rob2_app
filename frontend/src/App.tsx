import React, { useState } from 'react';

// Perguntas mínimas por domínio para o protótipo
const perguntas: Record<number, { id: string; texto: string; respostas: string[] }[]> = {
  1: [
    { id: '1.1', texto: 'A sequência de alocação foi verdadeiramente aleatória?', respostas: ['Y','PY','PN','N','NI'] },
    { id: '1.2', texto: 'A sequência de alocação foi ocultada até a inclusão?', respostas: ['Y','PY','PN','N','NI'] },
    { id: '1.3', texto: 'As características basais sugerem problemas na randomização?', respostas: ['Y','PY','PN','N','NI'] },
  ],
  2: [
    { id: '2.1', texto: 'Houve desvios das intervenções que poderiam afetar o desfecho?', respostas: ['Y','PY','PN','N','NI'] },
    { id: '2.2', texto: 'Os participantes e profissionais estavam cegos quanto à intervenção?', respostas: ['Y','PY','PN','N','NI'] },
  ],
  3: [
    { id: '3.1', texto: 'A proporção de dados ausentes é suficiente para impactar o resultado?', respostas: ['Y','PY','PN','N','NI'] },
    { id: '3.2', texto: 'A ausência de dados está associada ao verdadeiro valor do desfecho?', respostas: ['Y','PY','PN','N','NI'] },
  ],
  4: [
    { id: '4.1', texto: 'O método de mensuração do desfecho é válido e confiável?', respostas: ['Y','PY','PN','N','NI'] },
    { id: '4.2', texto: 'Os avaliadores estavam cegos quanto à intervenção?', respostas: ['Y','PY','PN','N','NI'] },
  ],
  5: [
    { id: '5.1', texto: 'As análises do desfecho estavam pré‑especificadas?', respostas: ['Y','PY','PN','N','NI'] },
  ],
};

const answerLabels: Record<string, string> = {
  Y: 'Sim',
  PY: 'Provavelmente sim',
  PN: 'Provavelmente não',
  N: 'Não',
  NI: 'Sem informação',
  NA: 'Não se aplica',
};

const stepNames = [
  'Pré‑considerações',
  'Domínio 1',
  'Domínio 2',
  'Domínio 3',
  'Domínio 4',
  'Domínio 5',
  'Resumo',
];

export default function App() {
  const [step, setStep] = useState(0);
  const [preConsiderations, setPreConsiderations] = useState('');
  // Respostas por domínio: {1: {"1.1": "Y", ...}, 2: {...}, ...}
  const [respostas, setRespostas] = useState<Record<number, Record<string, string>>>({});

  const nextStep = () => setStep((s) => Math.min(s + 1, stepNames.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleChangeResposta = (dom: number, qId: string, valor: string) => {
    setRespostas((prev) => ({
      ...prev,
      [dom]: { ...prev[dom], [qId]: valor },
    }));
  };

  const renderPreConsiderations = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label htmlFor="preConsid" style={{ fontWeight: 'bold' }}>Pré‑considerações</label>
      <textarea
        id="preConsid"
        style={{ width: '100%', height: '8rem' }}
        value={preConsiderations}
        onChange={(e) => setPreConsiderations(e.target.value)}
        aria-label="Pré‑considerações"
      />
    </div>
  );

  const renderDomain = (dom: number) => {
    const items = perguntas[dom];
    if (!items) return <p>Nenhuma pergunta definida.</p>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {items.map((item) => (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p><strong>{item.id}.</strong> {item.texto}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {item.respostas.map((opt) => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <input
                    type="radio"
                    name={`${dom}-${item.id}`}
                    value={opt}
                    checked={respostas[dom]?.[item.id] === opt}
                    onChange={() => handleChangeResposta(dom, item.id, opt)}
                  />
                  {answerLabels[opt] || opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSummary = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Resumo das respostas</h2>
        <p><strong>Pré‑considerações:</strong> {preConsiderations || '—'}</p>
        {Object.entries(respostas).map(([dom, resp]) => (
          <div key={dom} style={{ marginTop: '0.5rem' }}>
            <h3 style={{ fontWeight: 'bold' }}>Domínio {dom}</h3>
            <ul>
              {Object.entries(resp).map(([qid, val]) => (
                <li key={qid}>{qid}: {answerLabels[val] || val}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ margin: '0 auto', padding: '1rem', maxWidth: '720px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Avaliação de Risco de Viés (RoB 2)</h1>
      <div style={{ marginBottom: '1rem' }}>
        <p>Etapa {step + 1} de {stepNames.length}: <strong>{stepNames[step]}</strong></p>
      </div>
      <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
        {step === 0 && renderPreConsiderations()}
        {step > 0 && step < 6 && renderDomain(step)}
        {step === 6 && renderSummary()}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <button onClick={prevStep} disabled={step === 0}>
          Anterior
        </button>
        {step < stepNames.length - 1 ? (
          <button onClick={nextStep}>Próximo</button>
        ) : (
          <button disabled>Concluído</button>
        )}
      </div>
    </div>
  );
}