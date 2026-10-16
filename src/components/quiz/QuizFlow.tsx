"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { quizQuestions, TOTAL_QUESTIONS } from "@/lib/questions";
import { generateDiagnosis, type Answers, type Diagnosis } from "@/lib/scoring";
import type { Contact, ContactInput } from "@/lib/schema";
import { CONFIG } from "@/lib/config";
import { Logo } from "@/components/site/Header";
import { ContactStep } from "./ContactStep";
import { QuestionStep } from "./QuestionStep";
import { ResultStep, type SaveState } from "./ResultStep";

const CONTACT_STEP = 0;
const RESULT_STEP = TOTAL_QUESTIONS + 1;
const STORAGE_KEY = "fredy-diagnostico:v1";

interface Persisted {
  step: number;
  contact: ContactInput;
  answers: Answers;
  startedAt: number;
  /** id do lead devolvido pelo /api/leads/start (Supabase); completa a mesma linha no fim */
  leadId: string | null;
  /** contato já enviado como "iniciado" (evita reenviar se a pessoa só voltar e avançar) */
  startedKey: string;
}

const START_WAIT_MS = 4_000;

function contactKey(c: ContactInput): string {
  return [c.name.trim().toLowerCase(), c.email.trim().toLowerCase(), c.whatsapp.replace(/\D/g, "")].join("|");
}

const EMPTY: Persisted = {
  step: CONTACT_STEP,
  contact: { name: "", email: "", whatsapp: "" },
  answers: {},
  startedAt: 0,
  leadId: null,
  startedKey: "",
};

function load(): Persisted {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<Persisted>;
    const step = Math.min(Math.max(Number(p.step) || 0, CONTACT_STEP), TOTAL_QUESTIONS);
    return { ...EMPTY, ...p, step };
  } catch {
    return EMPTY;
  }
}

export function QuizFlow() {
  const [state, setState] = useState<Persisted>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saving");
  const honeypot = useRef("");
  /** POST do "Começar" ainda em voo: o envio final espera ele (até START_WAIT_MS) pra pegar o leadId */
  const startRequest = useRef<Promise<string | null> | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Restaura progresso (refresh não perde o que já respondeu)
  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage indisponível: segue sem persistir */
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (hydrated) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state.step, hydrated]);

  const { step, contact, answers } = state;
  const question = step >= 1 && step <= TOTAL_QUESTIONS ? quizQuestions[step - 1] : null;
  const progress = step === CONTACT_STEP ? 0 : step >= RESULT_STEP ? 100 : ((step - 1) / TOTAL_QUESTIONS) * 100;

  /** Etapa "iniciado": registra o lead (Supabase + n8n → contato e card no WTS) já no "Começar" */
  const startLead = useCallback((c: Contact) => {
    const request = fetch("/api/leads/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contact: c, website: honeypot.current || undefined }),
      keepalive: true, // segue mesmo se a pessoa fechar a aba logo depois
    })
      .then((res) => (res.ok ? (res.json() as Promise<{ id?: string | null }>) : null))
      .then((data) => (typeof data?.id === "string" ? data.id : null))
      .catch(() => null);
    startRequest.current = request;
    void request.then((id) => {
      if (id && startRequest.current === request) setState((s) => ({ ...s, leadId: id }));
    });
  }, []);

  const handleContact = useCallback(
    (c: Contact) => {
      const key = contactKey(c);
      const changed = key !== state.startedKey;
      if (changed) startLead(c);
      setState((s) => ({
        ...s,
        contact: { name: c.name, email: c.email, whatsapp: c.whatsapp },
        step: 1,
        startedAt: s.startedAt || Date.now(),
        startedKey: key,
        // contato novo = lead novo: o id antigo não vale mais
        leadId: changed ? null : s.leadId,
      }));
    },
    [state.startedKey, startLead],
  );

  const setAnswer = useCallback((id: string, value: string | string[]) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [id]: value } }));
  }, []);

  const submitLead = useCallback(
    async (finalAnswers: Answers, c: ContactInput, startedAt: number, knownLeadId: string | null) => {
      setSaveState("saving");
      try {
        // Se o POST do "Começar" ainda não voltou, espera um pouco pelo id (sem travar o envio)
        let leadId = knownLeadId;
        if (!leadId && startRequest.current) {
          leadId = await Promise.race([
            startRequest.current,
            new Promise<null>((r) => setTimeout(() => r(null), START_WAIT_MS)),
          ]);
        }
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            contact: c,
            answers: finalAnswers,
            leadId: leadId ?? undefined,
            website: honeypot.current || undefined,
            startedAt: startedAt || undefined,
          }),
        });
        if (!res.ok) {
          setSaveState("error");
          return;
        }
        const data = (await res.json().catch(() => ({}))) as { persisted?: boolean };
        setSaveState(data.persisted ? "saved" : "local");
      } catch {
        setSaveState("error");
      }
    },
    [],
  );

  const next = useCallback(() => {
    if (step < TOTAL_QUESTIONS) {
      setState((s) => ({ ...s, step: s.step + 1 }));
      return;
    }
    const result = generateDiagnosis(answers);
    setDiagnosis(result);
    setState((s) => ({ ...s, step: RESULT_STEP }));
    void submitLead(answers, contact, state.startedAt, state.leadId);
  }, [step, answers, contact, state.startedAt, state.leadId, submitLead]);

  const back = useCallback(() => {
    setState((s) => ({ ...s, step: Math.max(CONTACT_STEP, s.step - 1) }));
  }, []);

  const restart = useCallback(() => {
    setDiagnosis(null);
    setSaveState("saving");
    startRequest.current = null;
    setState({ ...EMPTY, startedAt: Date.now() });
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const stepLabel = useMemo(() => {
    if (step === CONTACT_STEP) return "Seus dados";
    if (step >= RESULT_STEP) return "Resultado";
    return `${step} de ${TOTAL_QUESTIONS}`;
  }, [step]);

  return (
    <div ref={topRef} className="flex min-h-dvh flex-col">
      <header className="no-print sticky top-0 z-10 border-b border-line bg-bg/95 backdrop-blur">
        <div className="wrap flex items-center justify-between gap-4 py-3">
          <Logo height={36} />
          <div className="flex items-center gap-3">
            <span className="hidden text-[14px] font-semibold text-ink sm:inline">Diagnóstico {CONFIG.product}</span>
            <span className="num rounded-pill bg-accent px-3 py-1 text-[13px] font-bold text-accent-fg">{stepLabel}</span>
          </div>
        </div>
        <div className="h-[3px] w-full bg-bg-s2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Progresso do diagnóstico">
          <div className="h-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="wrap flex-1 py-10">
        <div className="mx-auto w-full max-w-[44rem] print-page">
          {!hydrated ? (
            <div className="h-64" aria-busy="true" />
          ) : step === CONTACT_STEP ? (
            <ContactStep initial={contact} onSubmit={handleContact} onHoneypot={(v) => (honeypot.current = v)} />
          ) : question ? (
            <QuestionStep
              question={question}
              index={step}
              total={TOTAL_QUESTIONS}
              value={answers[question.id]}
              textValue={question.textInputId ? String(answers[question.textInputId] ?? "") : ""}
              onSelect={(v) => setAnswer(question.id, v)}
              onTextChange={(v) => question.textInputId && setAnswer(question.textInputId, v)}
              onNext={next}
              onBack={back}
            />
          ) : diagnosis ? (
            <ResultStep diagnosis={diagnosis} answers={answers} contactName={contact.name} saveState={saveState} onRestart={restart} />
          ) : null}
        </div>
      </main>

      <footer className="no-print border-t border-line">
        <div className="wrap flex flex-wrap items-center justify-between gap-2 py-5 text-[13px] text-ink-muted-2">
          <span>
            © {new Date().getFullYear()} {CONFIG.productFull} · Diagnóstico {CONFIG.product}
          </span>
          <Link href="/" className="font-bold text-accent-ink underline-offset-4 hover:underline">
            Voltar ao início
          </Link>
        </div>
      </footer>
    </div>
  );
}
