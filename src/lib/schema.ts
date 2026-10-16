import { z } from "zod";
import { quizQuestions } from "./questions";

/** Dados de contato (validados no cliente e de novo no servidor) */
export const contactSchema = z.object({
  name: z.string().trim().min(2, "Digite seu nome completo").max(120),
  email: z.email("E-mail inválido").max(160),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().min(10, "WhatsApp inválido (inclua o DDD)").max(15)),
});

export type ContactInput = z.input<typeof contactSchema>;
export type Contact = z.output<typeof contactSchema>;

/** Respostas: cada pergunta só aceita os values definidos em questions.ts */
const answerShape: Record<string, z.ZodTypeAny> = {};
for (const q of quizQuestions) {
  const values = q.options.map((o) => o.value) as [string, ...string[]];
  const one = z.enum(values);
  answerShape[q.id] = q.multiple
    ? z.array(one).min(1).max(q.maxSelect ?? values.length)
    : one;
  if (q.textInputId) answerShape[q.textInputId] = z.string().trim().max(120).optional();
}
export const answersSchema = z.object(answerShape).strict();

export type AnswersPayload = z.infer<typeof answersSchema>;

/** Corpo do POST /api/leads/start (etapa "iniciado": só o contato, no clique em "Começar") */
export const leadStartSchema = z.object({
  contact: contactSchema,
  /** honeypot: campo invisível; bots preenchem, humanos não */
  website: z.string().max(500).optional(),
});

export type LeadStartPayload = z.infer<typeof leadStartSchema>;

/** Corpo do POST /api/leads (etapa "concluido": contato + respostas) */
export const leadPayloadSchema = z.object({
  contact: contactSchema,
  answers: answersSchema,
  /** id do lead criado no /api/leads/start (Supabase), pra completar a mesma linha */
  leadId: z.uuid().optional(),
  /** honeypot: campo invisível; bots preenchem, humanos não */
  website: z.string().max(500).optional(),
  startedAt: z.number().int().positive().optional(),
});

export type LeadPayload = z.infer<typeof leadPayloadSchema>;
