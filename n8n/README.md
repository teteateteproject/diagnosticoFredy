# Workflows n8n — Diagnóstico → WTS

- `Diagnostico_Duda_WTS.json` — site da Duda → webhook `/webhook/diagnostico-duda`, etiquetas `Diagnóstico Duda` (contato) e `Duda` + `Diagnóstico Duda` (card). **Recebe as duas etapas** (`iniciado` e `concluido`).
- `Diagnostico_Fredy_WTS.json` — site do Frédy → webhook `/webhook/diagnostico-fredy`, etiquetas `Diagnóstico Frédy` (contato) e `Frédy` + `Diagnóstico Frédy` (card), etapa `a80658c9-4327-405a-a848-2ed69995517d`. **Recebe as duas etapas**, mesma lógica da Duda (abaixo), com prefixo `Diagnóstico Frédy ·` e origem `diagnostico-fredy`.

Importe em workflows.tedyleads.com.br (Import from File).

## Duas etapas (Duda e Frédy; descrito com a Duda)

O site manda o lead em dois momentos, no mesmo webhook, diferenciados por `stage`:

| `stage` | Quando | Payload |
|---|---|---|
| `iniciado` | clique em "Começar" (`POST /api/leads/start`) | `id`, `product`, `name`, `email`, `whatsapp`, `source`, `started_at` |
| `concluido` | última pergunta (`POST /api/leads`) | o completo (respostas, `answers_detail`, `diagnosis`…) |

Payload sem `stage` (site antigo) é tratado como `concluido`.

Fluxo: **Webhook** → **É Duda?** → **Montar dados** (Code, monta contato/card/anotação conforme a etapa) → **Criar/atualizar contato** (`POST core/v1/contact`, upsert por telefone, metadado `diagnostico_status`) → **Buscar card do diagnóstico** (`GET crm/v2/panel/card`, cards OPEN do contato no Funil Comercial - Duda/Frédy) → **Decidir ação** (Code) → **Ação?** (Switch):

| Etapa | Já tem card aberto do diagnóstico? | Ação |
|---|---|---|
| iniciado | não | **Criar card** "Diagnóstico Duda · Nome · Em andamento" (etapa `34039e39-24ae-49a1-85f1-cd46dd8ecd6c` do painel `b92678e3-…`) + anotação curta |
| iniciado | sim (recomeçou) | nada, pra não duplicar |
| concluido | sim | **Atualizar card** (`PUT crm/v3/panel/card/{id}`: título com maturidade, descrição, metadados; etapa não muda) + anotação com as respostas |
| concluido | não (o iniciado falhou) | **Criar card** completo + anotação |

"Card do diagnóstico" = metadado `origem = diagnostico-duda` ou título começando com `Diagnóstico Duda ·`. Cards do SDR no mesmo painel ficam de fora.

Depois → **Anotar no card** (`POST crm/v1/panel/card/{id}/note`) → *Gravar card_id no Supabase* (desativado; ative quando a tabela `leads` existir com as migrations 0001 e 0002).

Pra achar quem abandonou: no card, metadado `diagnostico_status = iniciado` e título "Em andamento"; no contato, o mesmo metadado.

## Depois de importar

1. Reatribua as credenciais (import não mantém): `WTS API - SDR Duda` nos cinco HTTP Request (contato, buscar, criar, atualizar, anotar); `Diagnóstico Duda - Webhook Secret` (Header Auth, Name `Authorization`, Value `Bearer <segredo>`) no Webhook.
2. No Vercel do projeto: `N8N_LEAD_WEBHOOK_URL=https://webhooks.tedyleads.com.br/webhook/diagnostico-duda` e `N8N_WEBHOOK_SECRET=<o segredo SEM "Bearer">`.
3. Ative o workflow **antes** de publicar o site que manda `iniciado`, e teste: preencha os dados, responda 1 pergunta e feche (deve criar o card "Em andamento"); depois faça um completo com o mesmo número (deve atualizar o mesmo card).

`montar_dados.js` (Duda), `montar_dados_fredy.js` (Frédy) e `decidir_acao.js` (os dois) são o código dos nós Code, em arquivo só pra leitura/edição.
