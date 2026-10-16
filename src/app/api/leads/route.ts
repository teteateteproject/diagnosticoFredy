import { NextResponse, type NextRequest } from "next/server";
import { leadPayloadSchema } from "@/lib/schema";
import { generateDiagnosis, calculateScores, answerLabels, type Answers } from "@/lib/scoring";
import { quizQuestions, SEGMENT_LABELS } from "@/lib/questions";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { PRODUCT } from "@/products";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, isMissingColumn, notifyN8n } from "@/lib/n8n";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 32 * 1024;

export async function POST(req: NextRequest) {
  // 1. Rate limit por IP
  const rl = rateLimit(clientIp(req));
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitos envios. Tente de novo em alguns minutos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  // 2. Corpo pequeno e JSON válido
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload muito grande." }, { status: 413 });
  }
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  // 3. Validação estrita (só values conhecidos das perguntas)
  const parsed = leadPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.issues.map((i) => i.path.join(".")) },
      { status: 400 },
    );
  }
  const { contact, answers, leadId, website, startedAt } = parsed.data;

  // 4. Anti-bot: honeypot preenchido ou formulário "respondido" em < 5s
  if (website) return NextResponse.json({ ok: true }, { status: 200 }); // finge sucesso
  if (startedAt && Date.now() - startedAt < 5_000) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // 5. Diagnóstico calculado AQUI (nunca aceitamos score do cliente)
  const diagnosis = generateDiagnosis(answers as Answers);
  const scores = calculateScores(answers as Answers);

  const segment =
    answers.segment === "outro" && answers.segment_other
      ? `Outro: ${answers.segment_other}`
      : SEGMENT_LABELS[answers.segment as string] ?? String(answers.segment);

  const readableAnswers = Object.fromEntries(
    quizQuestions.map((q) => [q.id, answerLabels(q.id, answers as Answers).join(", ")]),
  );
  /** Pergunta + resposta em ordem, por bloco: é o que vira anotação no card do CRM */
  const answersDetail = quizQuestions.map((q) => ({
    id: q.id,
    block: q.block,
    question: q.question,
    answer: answerLabels(q.id, answers as Answers).join(", "),
  }));

  const row = {
    name: contact.name,
    email: contact.email.toLowerCase(),
    whatsapp: contact.whatsapp,
    segment,
    answers, // jsonb cru (values)
    answers_readable: readableAnswers, // jsonb com rótulos
    maturity_score: scores.maturidade,
    max_maturity_score: diagnosis.maxMaturityScore,
    maturity_pct: diagnosis.maturityPct,
    maturity_level: diagnosis.maturityLevel,
    vendas_score: scores.vendas,
    atendimento_score: scores.atendimento,
    pos_venda_score: scores.posVenda,
    top_sector: diagnosis.topSectorLabel,
    solution_timeline: answers.solution_timeline,
    revenue: answers.revenue,
    source: `diagnostico-${PRODUCT.key}`,
    user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
  };

  // 6. Persistência (Supabase). Sem env configurado, segue sem salvar (dev local).
  //    Se veio leadId (criado no "Começar"), completa a mesma linha; senão insere uma nova.
  const id = await persistLead(row, leadId);

  // 7. Webhook n8n → completa o card criado no "Começar" (ou cria, se não houver)
  await notifyN8n({
    stage: "concluido",
    id,
    product: PRODUCT.key,
    ...row,
    answers_detail: answersDetail,
    diagnosis,
  });

  const persisted = id !== null || Boolean(process.env.N8N_LEAD_WEBHOOK_URL);
  return NextResponse.json({ ok: true, id, persisted, diagnosis }, { status: 201 });
}

type LeadRow = Record<string, unknown> & { whatsapp: string };

async function persistLead(row: LeadRow, leadId: string | undefined): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const stageCols = { stage: "concluido", completed_at: new Date().toISOString() };

  // a) Completa a linha do "Começar". Só casa se for o mesmo WhatsApp e ainda estiver
  //    "iniciado": um leadId adulterado no navegador não sobrescreve lead de outra pessoa.
  if (leadId) {
    const { data, error } = await supabase
      .from("leads")
      .update({ ...row, ...stageCols })
      .eq("id", leadId)
      .eq("whatsapp", row.whatsapp)
      .eq("stage", "iniciado")
      .select("id")
      .maybeSingle();
    if (error) console.error("[leads] supabase update failed:", error.message);
    else if (data) return data.id as string;
  }

  // b) Sem linha pra completar: insere. Se a migration 0002 não rodou ainda, insere sem as colunas novas.
  let { data, error } = await supabase.from("leads").insert({ ...row, ...stageCols }).select("id").single();
  if (isMissingColumn(error)) {
    ({ data, error } = await supabase.from("leads").insert(row).select("id").single());
  }
  if (error || !data) {
    console.error("[leads] supabase insert failed:", error?.message);
    return null;
  }
  return data.id as string;
}
