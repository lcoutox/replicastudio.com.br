# PRD — Replica Studio (nome provisório)

> v0.1 — 2026-09-12. Documento vivo: atualizar conforme decisões mudarem.

## 1. Problema e contexto

Hoje a Réplica (veículo de notícias de Nova Serrana-MG) roda toda a operação editorial via Markdown + Claude Code (repositório `replica`), e usa um protótipo em formato de Artifact (página HTML avulsa, hospedada no claude.ai) pra gerar imagens de post pro Instagram — dois formatos de template (foto com degradê, e card sólido do brandbook), com upload de imagem e texto digitado.

Esse protótipo já resolve o problema imediato, mas tem limitações estruturais:
- Vive na infraestrutura do Claude (claude.ai), não em domínio/infra própria.
- Geração de imagem client-side via `html2canvas`, que tem bugs reais de renderização (ex.: `box-decoration-break` não funciona, quebrando o efeito de grifo em manchetes com mais de um destaque).
- Sem persistência — cada geração é isolada, sem histórico.
- Cores, fontes e logo da marca estão hardcoded no HTML, não configuráveis.

## 2. Visão (não é compromisso de escopo)

No médio prazo, esse pode virar um produto: uma ferramenta de gestão de processos editoriais pra veículos de notícia pequenos/locais (radar de pauta, apuração, geração de posts, e potencialmente integração com CMS). Multi-tenant, possivelmente SaaS pago.

**Isso não faz parte do escopo do v1.** É a razão de algumas decisões de modelagem de dados abaixo (ex.: já existir o conceito de "workspace"), mas nenhuma feature de multi-tenant, cobrança ou onboarding de terceiros entra agora.

## 3. Objetivo do v1

Um web app rodando em infraestrutura própria (Railway), com um único usuário (o dono da Réplica), que substitui o Artifact atual com:
- As mesmas duas funcionalidades de geração de post (foto+degradê, card sólido) — sem os bugs de renderização do protótipo.
- Configuração de marca (brand kit) como dado, não como HTML hardcoded — mesmo que hoje só exista o brand kit da Réplica.
- Histórico dos posts gerados (o que foi feito, quando, com qual texto).
- Deploy contínuo, domínio próprio, sem depender do claude.ai pra existir.

## 4. Não-objetivos explícitos do v1

Registrar aqui evita que o escopo infle sozinho. Fora do v1:

- **Multi-tenant real** (múltiplos veículos/contas). O modelo de dados prevê `workspace`, mas só um existirá.
- **Autenticação multi-usuário / billing.** Um gate simples de login (usuário único) resolve.
- **Integração com Sanity** (ou qualquer CMS). Publicar a matéria no site continua um processo manual/separado, como hoje.
- **Radar de pauta, apuração, redação.** Esse fluxo continua no repositório `replica`, via Claude Code. Não migrar agora.
- **Editor de templates customizável pelo usuário.** Os dois formatos (foto, card sólido) são fixos no código nesta fase; virar "templates editáveis" é decisão de v2+.

## 5. Modelo de dados inicial

Desenhado pra não precisar de reescrita se/quando virar multi-tenant — mas sem construir nada além do necessário pro v1.

```
workspace
  id, nome, criado_em
  (v1: uma linha só, "Réplica")

brand_kit (1:1 com workspace por enquanto)
  id, workspace_id
  cor_azul, cor_preto, cor_branco, cor_cinza
  logo_positivo_svg, logo_negativo_svg, aspa_svg
  fonte_manchete_foto ("Archivo Black")
  fonte_rotulo ("Noto Sans")
  fonte_manchete_card ("Noto Serif")

post_gerado
  id, workspace_id, tipo ("foto" | "card"), tamanho ("feed" | "stories")
  tag_ou_rotulo, manchete_raw (com sintaxe **destaque**)
  tema (claro | escuro, só tipo card)
  imagem_origem (upload, só tipo foto)
  imagem_resultado (arquivo final gerado)
  criado_em
```

Sem tabela de usuário multi-tenant no v1 — só o gate de login (pode ser tão simples quanto uma variável de ambiente com senha, ou uma tabela `usuario` de uma linha só; decidir na fase técnica).

## 6. Decisões técnicas já fechadas

- **Framework:** Next.js (App Router).
- **Hospedagem:** Railway.
- **Banco:** Postgres (gerenciado pelo Railway), acessado via Prisma.
- **Geração de imagem:** Satori + `@resvg/resvg-js` rodando no servidor (runtime Node, nunca Edge) — substitui o `html2canvas` do protótipo. Resolve a classe de bug de renderização que já observamos (`box-decoration-break`).
- **Armazenamento de imagem gerada: Cloudflare R2.** Guardar o histórico é decisão tomada (não só "talvez") — é a única coisa que não dá pra reconstruir depois se não for salva desde o v1, e o custo é irrisório no volume esperado. R2 em vez de S3/disco do Railway por não cobrar taxa de egress e ter tier gratuito generoso (10GB); API compatível com S3, então não é lock-in de verdade.
- **Login:** gate único por senha compartilhada (`APP_PASSWORD`), sessão via cookie assinado com HMAC (Web Crypto, não `node:crypto` — precisa funcionar tanto em rota de API quanto no middleware, que roda em Edge Runtime). Sem tabela de usuário no v1.
- **Sem Sanity, sem integração de CMS no v1** (ver não-objetivos).
- **Testes:** Vitest, cobrindo a lógica pura de domínio (`src/lib/domain/`) e autenticação — não a camada de UI/API, que é fina de propósito (orquestra chamadas às funções testadas).

## 7. Roadmap em fases

- **v1 — uso pessoal:** só o gerador de posts, um usuário, um workspace (Réplica), sem integrações externas.
- **v2 — multi-workspace (ainda uso interno):** suportar mais de um brand kit/workspace, ainda sem multi-usuário por workspace nem cobrança. Serve pra validar se o modelo de dados aguenta mais de um "cliente" antes de expor publicamente.
- **v3 — SaaS (visão, não compromisso):** múltiplos usuários por workspace, autenticação real, billing, onboarding self-service. Só entra em consideração se v1/v2 provarem valor de uso real.

## 8. Perguntas em aberto

- Nome definitivo do produto (hoje: "Replica Studio", provisório).

## 9. Status de implementação

v1 implementado e verificado localmente em 2026-09-12 (ver `README.md` para rodar):
- Build de produção (`next build`) passa limpo.
- 30 testes automatizados passando (`npm test`) — domínio (destaque, brand kit, validação de pedido, tamanho) e autenticação.
- Renderização verificada de ponta a ponta com fontes e imagem reais (`scripts/smoke-test-render.ts`), não só com testes unitários.

**Melhorias pós-v1 (2026-09-12):**
- **Preview ao vivo:** editor carrega com um preview de exemplo desde a abertura da página; qualquer mudança de campo re-renderiza automaticamente (debounce de 350ms) via `/api/preview` — endpoint que só renderiza, sem persistir. Usa o mesmo `renderizarPost()` do endpoint de geração final, então preview e download são pixel-idênticos.
- **Botão de download:** baixa localmente o PNG que já está no preview e, em paralelo, persiste no histórico via `/api/gerar`.
- **Seletor de tamanho (feed/stories):** `post_gerado` ganhou a coluna `tamanho`. Os dois formatos (foto, card) agora suportam tanto Feed (1080×1350) quanto Stories (1080×1920, com zona segura de 250px no topo e 320px na base reservada pra UI do Instagram). Verificado visualmente nas 4 combinações (foto×feed, foto×stories, card×feed, card×stories).

**Limitação conhecida:** as fontes Noto Sans/Noto Serif embarcadas (`src/lib/render/fonts/`) vieram de pacotes `@fontsource/*` nos pesos 700/800 — o Google Fonts parou de distribuir instâncias estáticas dessas famílias (só fonte variável, que o parser de fontes do Satori não sustenta, `fvar` quebra o parser). Se um dia o peso visual não bater com o esperado, a correção é só trocar esses arquivos, não mexer em código.

**Ainda não provisionado (depende de contas externas do usuário):** banco Postgres no Railway, bucket no Cloudflare R2, deploy do serviço. Ver `README.md`.
