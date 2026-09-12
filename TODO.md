# TODO — Replica Studio

Lista viva de pendências. Atualizar sempre que uma tarefa entrar, sair ou mudar de status — não deixar acumular defasagem. Decisões e o "porquê" das coisas ficam em `docs/PRD.md`; aqui é só o rastreamento tático do que falta fazer.

## Agora (prioridade definida em 2026-09-12)

- [ ] **Diário Oficial: extrair conteúdo real dos PDFs.** Hoje o radar só sabe metadado de edição (número, data) — sem resumo de verdade, o classificador não tem o que avaliar. Precisa: baixar o PDF, extrair texto, resumir/classificar via Haiku.
  - **Decisão em aberto antes de implementar:** uma edição pode ter mais de um ato relevante (decreto + portaria + nomeação, por exemplo). Definir se `Pauta` continua 1:1 com edição (resumo cobre tudo) ou vira 1:N (um `Pauta` por ato encontrado dentro da edição) — muda o schema.
- [ ] **Redesign de UI/UX.** App funcional mas visualmente cru (formulários com estilo inline, sem sistema de design). Usar a skill `ui-ux-pro-max` quando for a vez. Fazer depois do item acima, pra não desenhar a tela de resultado do Diário Oficial em cima de dado placeholder.

## Backlog (levantado em conversa, sem data definida)

- [ ] Fonte "Câmara Municipal de Nova Serrana" no radar — ainda não investigada (tem RSS? qual o formato da lista de proposições?).
- [ ] Fonte "TCE-MG" no radar — ainda não investigada (interface pública de busca por processo/município não mapeada).
- [ ] Tela de gerenciamento de Fontes (hoje só via seed/código — decisão consciente de não construir CRUD ainda, ver PRD).
- [ ] Tela de edição da Linha Editorial (hoje só via seed/código, mesma lógica acima).
- [ ] Recalibrar o limiar de pontuação (hoje 5/10) e a régua de critérios depois de mais uso real — primeira calibração foi só com 2 exemplos de teste.
- [ ] Avaliar se algum dia faz sentido automatizar a checagem do radar (cron) em vez de só trigger manual — decisão consciente de começar manual, ver conversa de 2026-09-12.
- [ ] Provisionar Postgres + bucket R2 de produção de verdade no Railway (hoje o app roda em produção mas o radar ainda não foi testado lá — só local).
- [ ] Adicionar `ANTHROPIC_API_KEY` nas variáveis de ambiente do Railway (hoje só existe no `.env` local) antes de usar o radar em produção.

## Não fazer agora (decisão consciente, ver docs/PRD.md)

- Multi-tenant / multi-workspace real (v2+).
- Integração direta com Sanity (publicação continua manual via MCP no repo `replica`).
- Monitoramento de imprensa concorrente / redes sociais — Instagram bloqueia scraping, fica manual.
- Billing, onboarding self-service (visão de v3, não compromisso).

---

*Última atualização: 2026-09-12.*
