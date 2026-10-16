import type { ProductDefinition, QuizQuestion } from "./types";

/**
 * Diagnóstico Duda — empresas com 3+ vendedores e vários canais (WhatsApp, Instagram, Facebook),
 * qualquer nicho. Setores: Vendas / Suporte.
 */

const questions: QuizQuestion[] = [
  // ---------- Perfil ----------
  {
    id: "role",
    block: "Perfil",
    question: "Qual a sua função na empresa?",
    options: [
      { label: "Sócio(a) / Fundador(a)", value: "socio_fundador", maturidade: 3 },
      { label: "CEO / Diretor(a)", value: "ceo_diretor", maturidade: 3 },
      { label: "Gerente de Marketing / Vendas", value: "gerente", maturidade: 2 },
      { label: "Analista / Assistente", value: "analista", maturidade: 1 },
    ],
  },
  {
    id: "segment",
    block: "Perfil",
    question: "Qual o nicho da sua empresa?",
    textInputId: "segment_other",
    options: [
      { label: "Alimentação / Restaurantes", value: "alimentacao" },
      { label: "Beleza / Estética / Saúde", value: "beleza" },
      { label: "Educação / Cursos", value: "educacao" },
      { label: "Imobiliário", value: "imobiliario" },
      { label: "Moda / Vestuário", value: "moda" },
      { label: "Serviços / Consultoria", value: "servicos" },
      { label: "E-commerce", value: "ecommerce" },
      { label: "Outro", value: "outro", hasTextInput: true },
    ],
  },

  // ---------- Canais e demanda ----------
  {
    id: "whatsapp_sales_pct",
    block: "Canais e demanda",
    question: "Quanto das suas vendas e atendimentos passa pelo WhatsApp?",
    options: [
      { label: "Menos de 25%", value: "menos_25", maturidade: 1 },
      { label: "Entre 25% e 50%", value: "25_50", maturidade: 2 },
      { label: "Entre 50% e 75%", value: "50_75", maturidade: 3 },
      { label: "Mais de 75%", value: "mais_75", maturidade: 4 },
    ],
  },
  {
    id: "channels",
    block: "Canais e demanda",
    question: "Por onde seus clientes mais entram em contato?",
    hint: "Selecione até 2 canais",
    multiple: true,
    maxSelect: 2,
    options: [
      { label: "WhatsApp", value: "whatsapp", vendas: 2 },
      { label: "Instagram", value: "instagram", vendas: 2 },
      { label: "Facebook", value: "facebook", vendas: 1 },
      { label: "Telefone / E-mail", value: "telefone_email", vendas: 1 },
      { label: "Site / Chat online", value: "site_chat", vendas: 1 },
    ],
  },
  {
    id: "lead_volume",
    block: "Canais e demanda",
    question: "Quantos contatos por dia chegam nos canais de conversa?",
    options: [
      { label: "Menos de 10", value: "menos_10", maturidade: 1 },
      { label: "Entre 10 e 30", value: "10_30", maturidade: 2 },
      { label: "Entre 30 e 100", value: "30_100", maturidade: 3 },
      { label: "Mais de 100", value: "mais_100", maturidade: 4 },
    ],
  },

  // ---------- Operação ----------
  {
    id: "team_size",
    block: "Operação",
    question: "Quantos atendentes/vendedores a equipe tem hoje?",
    options: [
      { label: "1 a 2", value: "1_2", maturidade: 1 },
      { label: "3 a 5", value: "3_5", maturidade: 2 },
      { label: "6 a 10", value: "6_10", maturidade: 3 },
      { label: "Mais de 10", value: "mais_10", maturidade: 4 },
    ],
  },
  {
    id: "how_attend",
    block: "Operação",
    question: "Como vocês atendem os contatos hoje?",
    options: [
      { label: "Manual, cada atendente responde na hora", value: "manual", atendimento: 2, maturidade: 1 },
      { label: "Com respostas prontas", value: "respostas_prontas", atendimento: 3, maturidade: 2 },
      { label: "Com robô ou automação básica", value: "automacao_basica", atendimento: 4, maturidade: 3 },
      { label: "Ainda não organizamos isso", value: "nao_organizado", atendimento: 1, maturidade: 1 },
    ],
  },

  // ---------- Tecnologia ----------
  {
    id: "paid_traffic",
    block: "Tecnologia",
    question: "Você investe (ou já investiu) em tráfego pago?",
    options: [
      { label: "Sim, investimos todo mês", value: "mensalmente", maturidade: 3 },
      { label: "Já investimos, mas paramos", value: "paramos", maturidade: 2 },
      { label: "Estamos começando a investir", value: "comecando", maturidade: 2 },
      { label: "Ainda não investimos", value: "nao", maturidade: 1 },
    ],
  },
  {
    id: "ai_usage",
    block: "Tecnologia",
    question: "Vocês já usam IA na empresa, além de consultas pontuais?",
    options: [
      { label: "Sim, em várias áreas", value: "varias_areas", maturidade: 3 },
      { label: "Sim, em tarefas pontuais", value: "pontual", maturidade: 2 },
      { label: "Estamos começando a testar", value: "testando", maturidade: 1 },
      { label: "Ainda não usamos", value: "nao", maturidade: 0 },
    ],
  },
  {
    id: "crm_usage",
    block: "Tecnologia",
    question: "Vocês usam algum CRM hoje?",
    options: [
      { label: "Sim, um CRM pago", value: "crm_pago", maturidade: 3 },
      { label: "Planilha / Excel", value: "planilha", maturidade: 2 },
      { label: "Já testei, mas não uso mais", value: "testei", maturidade: 1 },
      { label: "Não uso nenhum", value: "nenhum", maturidade: 0 },
    ],
  },

  // ---------- Comercial ----------
  {
    id: "sales_funnel",
    block: "Comercial",
    question: "A empresa tem um funil de vendas definido?",
    options: [
      { label: "Sim, com etapas e metas claras", value: "definido", vendas: 3, maturidade: 2 },
      { label: "Temos algo informal, não documentado", value: "informal", vendas: 2, maturidade: 1 },
      { label: "Estamos montando agora", value: "montando", vendas: 1, maturidade: 1 },
      { label: "Não temos funil", value: "sem_funil", vendas: 0, maturidade: 0 },
    ],
  },

  // ---------- Urgência ----------
  {
    id: "biggest_challenge",
    block: "Urgência",
    question: "Qual o maior desafio com os atendimentos hoje?",
    hint: "Selecione até 2",
    multiple: true,
    maxSelect: 2,
    options: [
      { label: "Demora pra responder os clientes", value: "demora", atendimento: 2, vendas: 2, maturidade: 2 },
      { label: "Perdemos contatos, não damos conta do volume", value: "perdemos_contatos", vendas: 3, atendimento: 2, maturidade: 3 },
      { label: "Conversas desorganizadas, ninguém sabe o status", value: "organizacao", vendas: 2, atendimento: 2, maturidade: 2 },
      { label: "Não conseguimos medir o resultado das vendas", value: "medir_resultados", vendas: 3, maturidade: 2 },
    ],
  },
  {
    id: "revenue",
    block: "Urgência",
    question: "Qual o faturamento médio mensal da empresa?",
    options: [
      { label: "Até R$ 100 mil", value: "ate_100k", maturidade: 1 },
      { label: "R$ 100 mil a R$ 300 mil", value: "100k_300k", maturidade: 2 },
      { label: "R$ 300 mil a R$ 1 milhão", value: "300k_1mi", maturidade: 3 },
      { label: "Acima de R$ 1 milhão", value: "acima_1mi", maturidade: 4 },
    ],
  },
  {
    id: "solution_timeline",
    block: "Urgência",
    question: "Em quanto tempo você quer resolver isso?",
    options: [
      { label: "Agora, essa semana", value: "imediato", maturidade: 4 },
      { label: "Em até 1 mês", value: "1_mes", maturidade: 3 },
      { label: "Nos próximos 3 meses", value: "3_meses", maturidade: 2 },
      { label: "Só pesquisando, sem prazo", value: "sem_prazo", maturidade: 1 },
    ],
  },
];

export const duda: ProductDefinition = {
  key: "duda",
  name: "Duda",
  nameFull: "Duda.app",
  theName: "a Duda",
  orgNoun: "empresa",
  audience: "empresas que vendem pelo WhatsApp",
  tagline: "Gestão de vendas com IA para empresas com vários vendedores e canais.",
  whatsappDefault: "554840034215",
  siteUrlDefault: "https://www.diagnosticocomaduda.com.br",
  description:
    "Descubra em 3 minutos o nível de maturidade da sua empresa em IA e onde a Duda traz mais resultado: vendas ou suporte.",
  totalMinutes: 3,

  landing: {
    h1: "Sua empresa está pronta pra vender com IA?",
    lead:
      "Em 3 minutos você descobre o nível de maturidade da sua operação e em qual frente a Duda traz resultado primeiro: vendas ou suporte.",
    stepsIntro:
      "Três etapas, nenhuma delas pede acesso ao seu WhatsApp, Instagram ou CRM. Você responde, a pontuação é calculada e o diagnóstico aparece na tela.",
    step1Text:
      "Nome, e-mail e WhatsApp. É pra onde mandamos o relatório e pra onde o time responde, se você quiser conversar.",
    step2Text:
      "Múltipla escolha sobre canais, equipe, funil e atendimento. Nada de campo aberto pra preencher.",
    step3Text:
      "Nível de maturidade (alta, média ou inicial), o setor onde a Duda traz mais resultado e os próximos passos.",
    receiveIntro:
      "O diagnóstico olha pra quatro coisas: quanto da sua venda já passa pelo WhatsApp e Instagram, como a equipe atende hoje e se existe funil. Com isso ele mostra onde está o dinheiro que você deixa na mesa.",
    deliverables: [
      "Pontuação de maturidade em IA da sua operação",
      "Setor de maior impacto: vendas ou suporte",
      "Três próximos passos práticos, de acordo com o seu nível",
      "Relatório pra baixar e compartilhar com os sócios",
    ],
    calloutText: "Você responde {n} perguntas e sai sabendo se o problema é captar ou atender.",
    quote: "Cliente que espera resposta por um dia já comprou do concorrente.",
    ctaTitle: "Pronto pra descobrir onde sua empresa perde venda?",
    ctaText:
      "Leva 3 minutos. Se preferir pular o diagnóstico e falar direto com o time, o WhatsApp está aqui também.",
    whatsappMessage: "Olá! Quero falar com o time Duda sobre a minha empresa.",
  },

  contactLead:
    "O resultado aparece na tela e vai por e-mail. O WhatsApp é só pra quando você quiser falar com o time Duda.",

  sectorKeys: ["vendas", "atendimento"],
  sectors: {
    vendas: {
      label: "Vendas",
      message:
        "A Duda vai acelerar a captação e a conversão: resposta em segundos, distribuição automática entre vendedores e nenhuma venda perdida no WhatsApp, Instagram e Facebook.",
    },
    atendimento: {
      label: "Suporte",
      message:
        "A Duda vai automatizar e organizar o atendimento: triagem com IA, respostas pras dúvidas recorrentes e menos retrabalho pra equipe.",
    },
  },
  sectorsAllLabel: "Vendas e Suporte",
  sectorsCombinedMessage:
    "A Duda vai atuar de forma integrada: vendas e suporte na mesma ferramenta.",
  sectorsTiedMessage: (labels) =>
    `A Duda vai atuar em ${labels} ao mesmo tempo, entregando resultado em mais de uma frente.`,

  maturity: {
    alta: "sua empresa está pronta pra Duda. Volume, equipe e urgência já pedem IA no atendimento.",
    media: "sua empresa está em evolução. Tem demanda, mas ainda perde venda por falta de processo e velocidade.",
    inicial: "sua empresa está em estágio inicial. O primeiro passo é organizar os contatos antes de automatizar.",
  },
  nextSteps: {
    alta: [
      "Agendar uma demonstração com o time comercial",
      "Mapear os canais e o funil que vão entrar na Duda",
      "Definir o agente de IA do primeiro atendimento",
    ],
    media: [
      "Ver casos de empresas do seu nicho",
      "Centralizar WhatsApp, Instagram e Facebook num só lugar",
      "Definir etapas de funil e metas por vendedor",
    ],
    inicial: [
      "Receber os materiais educativos da Duda",
      "Registrar cada contato com origem e status",
      "Definir um tempo máximo de resposta pra equipe",
    ],
  },
  cta: {
    alta: {
      text: "Agendar demonstração",
      message: "Olá! Minha empresa teve Maturidade Alta no Diagnóstico Duda e quero agendar uma demonstração.",
    },
    media: {
      text: "Ver casos de sucesso",
      message: "Olá! Minha empresa teve Maturidade Média no Diagnóstico Duda e quero conhecer os casos de sucesso.",
    },
    inicial: {
      text: "Receber materiais educativos",
      message: "Olá! Minha empresa teve Maturidade Inicial no Diagnóstico Duda e quero receber os materiais educativos.",
    },
  },

  diagnosisText: ({ levelText, segmentLabel, topLabel, topMessage }) => {
    const who = segmentLabel ? `Empresas de ${segmentLabel.toLowerCase()} como a sua tendem` : "Sua empresa tende";
    return `Com base nas suas respostas, sua empresa tem ${levelText} pra adotar a Duda. ${who} a ganhar mais rápido em ${topLabel}. ${topMessage}`;
  },

  questions,
};
