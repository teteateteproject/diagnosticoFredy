// Nó "Montar dados" (Code, Run Once for All Items)
// Entrada: body do webhook enviado pelo site (N8N_LEAD_WEBHOOK_URL), em duas etapas:
//   stage "iniciado"  → POST /api/leads/start, no clique em "Começar" (só contato)
//   stage "concluido" → POST /api/leads, depois da última pergunta (contato + respostas)
// Payload sem stage (versão antiga do site) = "concluido".
const b = $input.first().json.body ?? $input.first().json;
const stage = b.stage === 'iniciado' ? 'iniciado' : 'concluido';

// ---- telefone: só dígitos, com DDI 55, no formato que o WTS usa (+55DDDNÚMERO)
let digits = String(b.whatsapp || '').replace(/\D/g, '');
if (!(digits.startsWith('55') && digits.length >= 12)) digits = '55' + digits;
const phone = '+' + digits;

const dataBR = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const PREFIXO = 'Diagnóstico Duda';

// ======================= ETAPA INICIADO =======================
if (stage === 'iniciado') {
  const note = [
    `DIAGNÓSTICO DUDA — INICIADO em ${dataBR}`,
    `Preencheu os dados e começou o questionário.`,
    `Se não aparecer outra anotação com as respostas, parou no meio.`,
    ``,
    `Nome: ${b.name}`,
    `E-mail: ${b.email}`,
    `WhatsApp: ${phone}`,
    `Lead ID (Supabase): ${b.id || '—'}`,
  ].join('\n');

  return [{
    json: {
      stage,
      lead_id: b.id || null,
      product: b.product || 'duda',
      name: b.name,
      email: b.email,
      phone,
      card_prefix: PREFIXO,
      card_title: `${PREFIXO} · ${b.name} · Em andamento`,
      card_description: `Começou o diagnóstico em ${dataBR} e ainda não concluiu.`,
      card_metadata: {
        origem: 'diagnostico-duda',
        diagnostico_status: 'iniciado',
        diagnostico_inicio: dataBR,
        lead_id: b.id || '',
      },
      contact_metadata: {
        diagnostico_status: 'iniciado',
        diagnostico_data: dataBR,
      },
      note,
      data_br: dataBR,
    },
  }];
}

// ======================= ETAPA CONCLUIDO =======================
const nivelMap = { alta: 'Alta', media: 'Média', inicial: 'Inicial' };
const nivel = nivelMap[b.maturity_level] || b.maturity_level || '';
const d = b.diagnosis || {};
const ans = b.answers || {};
const readable = b.answers_readable || {};
const prazo = readable.solution_timeline || ans.solution_timeline || '';
const faturamento = readable.revenue || ans.revenue || '';

// ---- anotação do card: respostas por bloco
const blocks = [];
for (const q of (b.answers_detail || [])) {
  let blk = blocks.find(x => x.name === q.block);
  if (!blk) { blk = { name: q.block, items: [] }; blocks.push(blk); }
  blk.items.push(`• ${q.question}\n  → ${q.answer || '—'}`);
}

const note = [
  `DIAGNÓSTICO DUDA — CONCLUÍDO em ${dataBR}`,
  `Nome: ${b.name}`,
  `E-mail: ${b.email}`,
  `WhatsApp: ${phone}`,
  `Segmento: ${b.segment || '—'}`,
  ``,
  `RESULTADO`,
  `Maturidade: ${nivel} (${b.maturity_score}/${b.max_maturity_score} pts · ${b.maturity_pct}%)`,
  `Setor de maior impacto: ${b.top_sector}`,
  `Vendas ${b.vendas_score} · Suporte ${b.atendimento_score}`,
  `Prazo pra resolver: ${prazo || '—'}`,
  `Faturamento: ${faturamento || '—'}`,
  ``,
  `RESPOSTAS`,
  ...blocks.flatMap(blk => [`[${blk.name}]`, ...blk.items, ``]),
  `DIAGNÓSTICO ENTREGUE`,
  d.diagnosisText || '',
  ``,
  `Próximos passos sugeridos:`,
  ...((d.nextSteps || []).map(s => `• ${s}`)),
  ``,
  `CTA mostrado: ${d.ctaText || '—'}`,
  `Lead ID (Supabase): ${b.id || '—'}`,
].join('\n').slice(0, 8000); // limite da API

return [{
  json: {
    stage,
    lead_id: b.id || null,
    product: b.product || 'duda',
    name: b.name,
    email: b.email,
    phone,
    segment: b.segment || '',
    nivel,
    nivel_key: b.maturity_level,
    pct: b.maturity_pct,
    top_sector: b.top_sector,
    prazo,
    faturamento,
    card_prefix: PREFIXO,
    card_title: `${PREFIXO} · ${b.name} · Maturidade ${nivel} (${b.maturity_pct}%)`,
    card_description: (d.diagnosisText || '').slice(0, 8000),
    card_metadata: {
      origem: 'diagnostico-duda',
      diagnostico_status: 'concluido',
      diagnostico_conclusao: dataBR,
      diagnostico_nivel: nivel,
      diagnostico_pct: String(b.maturity_pct ?? ''),
      diagnostico_setor: b.top_sector || '',
      diagnostico_prazo: prazo,
      diagnostico_faturamento: faturamento,
      lead_id: b.id || '',
    },
    contact_metadata: {
      diagnostico_status: 'concluido',
      diagnostico_nivel: nivel,
      diagnostico_pct: String(b.maturity_pct ?? ''),
      diagnostico_setor: b.top_sector || '',
      diagnostico_segmento: b.segment || '',
      diagnostico_data: dataBR,
    },
    note,
    data_br: dataBR,
  },
}];
