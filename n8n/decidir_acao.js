// Nó "Decidir ação" (Code, Run Once for All Items)
// Entrada: resposta do "Buscar card do diagnóstico" (GET crm/v2/panel/card, cards OPEN do contato no painel).
// Saída: acao = criar | atualizar | ignorar
//   iniciado  + já tem card aberto do diagnóstico → ignorar (recomeçou; não duplica)
//   iniciado  + sem card                          → criar (card "Em andamento")
//   concluido + tem card aberto do diagnóstico    → atualizar (título/descrição/metadados) + anotação
//   concluido + sem card                          → criar + anotação (ex.: o "iniciado" falhou)
const m = $('Montar dados').first().json;
const contactId = $('Criar/atualizar contato').first().json.id;
const res = $input.first().json || {};
const items = Array.isArray(res.items) ? res.items : [];

// Card do diagnóstico = metadado origem OU título com o prefixo (cards do SDR no mesmo painel ficam de fora)
const doDiagnostico = (c) =>
  (c.metadata && c.metadata.origem === m.card_metadata.origem) ||
  String(c.title || '').startsWith(`${m.card_prefix} ·`);

const card = items
  .filter((c) => c && c.id && doDiagnostico(c))
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

let acao;
if (m.stage === 'iniciado') acao = card ? 'ignorar' : 'criar';
else acao = card ? 'atualizar' : 'criar';

return [{ json: { acao, card_id: card ? card.id : null, contact_id: contactId, stage: m.stage } }];
