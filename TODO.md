# TODO — Replica Studio

Lista viva de pendências. Atualizar sempre que uma tarefa entrar, sair ou mudar de status — não deixar acumular defasagem. Decisões e o "porquê" das coisas ficam em `docs/PRD.md`; aqui é só o rastreamento tático do que falta fazer.

## Agora (prioridade definida em 2026-09-12)

- [ ] **Validar com o Lucas, na branch `redesign-ui-ux`, antes de ir pra `main`:** o redesign de UI/UX e a sala de apuração — sessão sem acesso a browser pra conferir visualmente durante o trabalho. Essa branch acumulou duas coisas grandes e conceitualmente diferentes (redesign visual + feature nova de agente) — avaliar se vale separar em duas PRs antes do merge.
- [ ] **Sala de redação** (fase seguinte da sala de apuração, ver docs/PRD.md seção 10) — escrever/revisar a matéria a partir do dossiê, com humanização via skill `journalism-core:ai-writing-detox` quando o texto vier de agente. Só depois de validar a sala de apuração em uso real.

## Concluído recentemente

- [x] **Sala de apuração — reconstruída em torno de documento único** (2026-09-12, branch `redesign-ui-ux`). Primeira versão tinha chat + dossiê como painéis separados — exigia ler a resposta do agente e retranscrever manualmente pro dossiê, e o usuário sinalizou que "não tava legal" mesmo depois de ajustes de layout. Reconstruído: o dossiê é a tela inteira; "peça ajuda ao agente" (atalhos: Resumir fontes, Buscar na web, Verificar contradições, ou pedido livre) devolve uma sugestão de texto com Aceitar/Descartar — aceitar cola direto no dossiê, sem retranscrição. Histórico de pedidos fica recolhido, fora do caminho, pra auditoria.
  - **Bug real corrigido no caminho:** a sala não tinha acesso ao texto original extraído da fonte (só um resumo-de-resumo de duas passadas de IA) — por isso o agente saiu buscar na web algo que já tínhamos processado. Agora `Pauta.textoOriginal` guarda o trecho literal (Diário Oficial) ou a descrição crua da API (licitações), e o agente recebe isso automaticamente como fonte primária.
  - Dossiê é texto simples — o agente é instruído a não usar markdown (`**negrito**`, listas numeradas), porque não há renderização, só apareceriam asteriscos literais.
  - **Custo maior que o radar** (Sonnet + busca web, não Haiku) — decisão consciente, é ação deliberada do usuário, não algo rodando em lote.
  - Pautas processadas antes dessa correção (Ripas, Pocah, Diabetes — os 3 dados de teste que já existiam) não têm `textoOriginal` retroativo; só pautas processadas depois da correção terão.
- [x] **Redesign de UI/UX** (2026-09-12, branch `redesign-ui-ux`). Tailwind CSS v4 (antes CSS puro com inline style por página). Tokens de design ancorados no brand kit real da Réplica (azul #325BFF, preto #121212, Noto Sans/Serif) em vez de paleta genérica de SaaS — via skill `ui-ux-pro-max`. Nova barra de navegação persistente (`(app)/TopNav.tsx`) compartilhada entre editor/radar/histórico via route group `(app)`, substituindo cada página duplicar seu próprio cabeçalho — inclui o primeiro botão de logout que a UI já teve. Todas as páginas reconstruídas com componentes consistentes (card, botão, badge, input).
- [x] **Diário Oficial: extrair conteúdo real dos PDFs** (2026-09-12). Uma edição vira 0-N `Pauta` (um por ato administrativo encontrado — decreto, portaria, extrato de contrato etc.), cada um classificado pela mesma régua das outras fontes. Pipeline: listagem HTML -> id da edição -> token de download -> PDF real -> texto (`pdf-parse`) -> extração de atos (Haiku, tool use) -> classificação por ato.
  - **Limitação conhecida:** o mapeamento edição→id de leitura é scraping de HTML (a API de dados abertos só dá o número da edição, não esse id) — mais frágil a mudança de layout do site que o resto do radar, que usa JSON estruturado.
  - **Custo de primeira checagem:** rodar pela primeira vez numa fonte com muitas edições pendentes é lento (13 fontes/16 edições ≈ 13 min, por causa do download+extração por edição). Checagens seguintes (1 edição nova/dia) devem ser rápidas. Se isso incomodar no uso real, considerar feedback de progresso incremental na UI em vez de esperar a resposta inteira.
  - `pdf-parse` precisou entrar em `serverExternalPackages` no `next.config.ts` — o webpack do Next quebra tentando empacotar sua dependência `pdfjs-dist` ("Object.defineProperty called on non-object").

## Backlog (levantado em conversa, sem data definida)

- [ ] Fonte "Câmara Municipal de Nova Serrana" no radar — ainda não investigada (tem RSS? qual o formato da lista de proposições?).
- [ ] Fonte "TCE-MG" no radar — ainda não investigada (interface pública de busca por processo/município não mapeada).
- [ ] Tela de gerenciamento de Fontes (hoje só via seed/código — decisão consciente de não construir CRUD ainda, ver PRD).
- [ ] Tela de edição da Linha Editorial (hoje só via seed/código, mesma lógica acima).
- [ ] Recalibrar o limiar de pontuação (hoje 5/10) e a régua de critérios depois de mais uso real — primeira calibração foi só com poucos exemplos de teste.
- [ ] Avaliar se algum dia faz sentido automatizar a checagem do radar (cron) em vez de só trigger manual — decisão consciente de começar manual, ver conversa de 2026-09-12.
- [ ] Provisionar Postgres + bucket R2 de produção de verdade no Railway (hoje o app roda em produção mas o radar ainda não foi testado lá — só local).
- [ ] Adicionar `ANTHROPIC_API_KEY` nas variáveis de ambiente do Railway (hoje só existe no `.env` local) antes de usar o radar em produção.
- [ ] Local dev tem pautas de Diário Oficial no formato antigo (chaveExterna = só o número da edição, sem sufixo de ato) de antes da extração real existir — inofensivo, mas pode limpar com `TRUNCATE pauta` se incomodar visualmente.

## Não fazer agora (decisão consciente, ver docs/PRD.md)

- Multi-tenant / multi-workspace real (v2+).
- Integração direta com Sanity (publicação continua manual via MCP no repo `replica`).
- Monitoramento de imprensa concorrente / redes sociais — Instagram bloqueia scraping, fica manual.
- Billing, onboarding self-service (visão de v3, não compromisso).

---

*Última atualização: 2026-09-12.*
