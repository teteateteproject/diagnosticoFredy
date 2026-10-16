import "server-only";
import type { NextRequest } from "next/server";

/**
 * Etapas que o site manda pro n8n (campo `stage` do payload):
 * - "iniciado":  a pessoa preencheu os dados e clicou em "Começar" (só contato)
 * - "concluido": respondeu a última pergunta (contato + respostas + diagnóstico)
 * O workflow do n8n trata payload sem `stage` como "concluido" (compatível com a versão antiga).
 */
export type LeadStage = "iniciado" | "concluido";

/** POST pro webhook do n8n (best-effort, com timeout). Falha nunca derruba a resposta pro usuário. */
export async function notifyN8n(payload: { stage: LeadStage } & Record<string, unknown>) {
  const url = process.env.N8N_LEAD_WEBHOOK_URL;
  if (!url) return;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6_000);
  try {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (process.env.N8N_WEBHOOK_SECRET) {
      headers.authorization = `Bearer ${process.env.N8N_WEBHOOK_SECRET}`;
    }
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) console.error(`[leads] n8n webhook (${payload.stage}) status`, res.status);
  } catch (err) {
    console.error(`[leads] n8n webhook (${payload.stage}) failed:`, (err as Error).message);
  } finally {
    clearTimeout(t);
  }
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Erro de coluna inexistente (migration 0002 ainda não rodada):
 * 42703 = Postgres undefined_column, PGRST204 = coluna fora do schema cache do PostgREST.
 */
export function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42703" || error.code === "PGRST204" || /column .* does not exist/i.test(error.message ?? "");
}
