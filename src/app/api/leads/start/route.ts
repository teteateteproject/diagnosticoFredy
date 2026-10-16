import { NextResponse, type NextRequest } from "next/server";
import { leadStartSchema } from "@/lib/schema";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { PRODUCT } from "@/products";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, notifyN8n } from "@/lib/n8n";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 4 * 1024;

/**
 * Etapa "iniciado": dispara no clique em "Começar", antes da primeira pergunta.
 * Garante que quem abandona o quiz no meio também chega no CRM.
 * A etapa final (POST /api/leads) completa a mesma linha/card.
 */
export async function POST(req: NextRequest) {
  // Bucket próprio: não consome o limite do envio final
  const rl = rateLimit(`start:${clientIp(req)}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitos envios. Tente de novo em alguns minutos." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

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

  const parsed = leadStartSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.issues.map((i) => i.path.join(".")) },
      { status: 400 },
    );
  }
  const { contact, website } = parsed.data;

  // Honeypot preenchido: finge sucesso e não salva nada
  if (website) return NextResponse.json({ ok: true, id: null }, { status: 200 });

  const row = {
    name: contact.name,
    email: contact.email.toLowerCase(),
    whatsapp: contact.whatsapp,
    stage: "iniciado",
    source: `diagnostico-${PRODUCT.key}`,
    user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
  };

  // Supabase (precisa da migration 0002: respostas/diagnóstico passam a ser opcionais)
  let id: string | null = null;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from("leads").insert(row).select("id").single();
    if (error) {
      console.error("[leads/start] supabase insert failed (rodou a migration 0002?):", error.message);
    } else {
      id = data.id as string;
    }
  }

  await notifyN8n({
    stage: "iniciado",
    id,
    product: PRODUCT.key,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp,
    source: row.source,
    started_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
