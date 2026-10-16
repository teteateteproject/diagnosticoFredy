-- Lead em duas etapas:
--   "iniciado"  → preencheu os dados e clicou em "Começar" (POST /api/leads/start)
--   "concluido" → respondeu a última pergunta (POST /api/leads completa a mesma linha)
-- Respostas e diagnóstico passam a ser opcionais porque só chegam na conclusão.

alter table public.leads
  add column if not exists stage        text not null default 'concluido',
  add column if not exists completed_at timestamptz;

alter table public.leads drop constraint if exists leads_stage_check;
alter table public.leads
  add constraint leads_stage_check check (stage in ('iniciado', 'concluido'));

alter table public.leads
  alter column answers            drop not null,
  alter column answers_readable   drop not null,
  alter column maturity_score     drop not null,
  alter column max_maturity_score drop not null,
  alter column maturity_pct       drop not null,
  alter column maturity_level     drop not null;

-- Linhas antigas já eram concluídas
update public.leads set completed_at = created_at where stage = 'concluido' and completed_at is null;

create index if not exists leads_stage_idx on public.leads (stage, created_at desc);

comment on column public.leads.stage is 'iniciado = começou e não terminou o quiz; concluido = respondeu tudo';
