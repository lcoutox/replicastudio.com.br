import type { Pauta, FonteApuracao, MensagemApuracao } from "@prisma/client";
import { formatarRespostaComCitacoes, type Citacao } from "@/lib/domain/apuracao";
import { clienteAnthropic } from "@/lib/radar/clienteAnthropic";

const MODELO_SONNET = "claude-sonnet-5";

const FERRAMENTA_BUSCA_WEB = {
  type: "web_search_20250305" as const,
  name: "web_search" as const,
  max_uses: 4,
};

function montarPromptSistema(pauta: Pick<Pauta, "titulo" | "resumo">, fontes: FonteApuracao[]): string {
  const listaFontes =
    fontes.length === 0
      ? "(nenhuma fonte anexada ainda)"
      : fontes
          .map((f, i) => {
            const rotulo = f.tipo === "link" ? `link: ${f.conteudo}` : f.tipo === "arquivo" ? `arquivo anexado: ${f.arquivoUrl}` : `nota sem fonte formal: "${f.conteudo}"`;
            return `${i + 1}. [${f.tipo}] ${rotulo}${f.descricao ? ` — ${f.descricao}` : ""}`;
          })
          .join("\n");

  return `Você ajuda um jornalista da Réplica (veículo local de Nova Serrana-MG) a apurar uma pauta. Seu papel é apoiar a apuração, não decidir o que é fato — toda conclusão que você trouxer é uma proposta que o jornalista confirma ou edita antes de virar parte do dossiê oficial.

PAUTA: ${pauta.titulo}
${pauta.resumo ? `Resumo inicial: ${pauta.resumo}` : ""}

FONTES JÁ ANEXADAS:
${listaFontes}

Regras:
- Só busque na web quando o jornalista pedir explicitamente (ex.: "busque", "procure", "veja se tem mais informação sobre X") ou quando for claramente necessário pra responder o que foi perguntado. Não busque por iniciativa própria em toda mensagem.
- "Nota sem fonte formal" é informação que o jornalista tem mas não documentou — trate como pista a confirmar, nunca como fato já estabelecido.
- Sempre que citar algo de uma busca, deixe claro de onde veio.
- Se não souber ou não achar nada confiável, diga isso — não invente fonte nem complete lacuna com suposição.
- Responda em português, direto, sem jargão de IA (nada de "delve", "landscape", listas de três itens por reflexo).`;
}

function mapearHistorico(mensagens: MensagemApuracao[]) {
  return mensagens.map((m) => ({ role: m.papel === "usuario" ? ("user" as const) : ("assistant" as const), content: m.conteudo }));
}

/**
 * Roda uma mensagem do usuário na sala de apuração. Sonnet, não Haiku —
 * ver docs/PRD.md seção 10: isso é julgamento editorial, não classificação
 * em lote, então qualidade do modelo importa mais que custo aqui.
 */
export async function responderNaSala(
  pauta: Pick<Pauta, "titulo" | "resumo">,
  fontes: FonteApuracao[],
  historico: MensagemApuracao[],
  mensagemUsuario: string,
): Promise<string> {
  const resposta = await clienteAnthropic().messages.create({
    model: MODELO_SONNET,
    max_tokens: 2048,
    system: montarPromptSistema(pauta, fontes),
    tools: [FERRAMENTA_BUSCA_WEB],
    messages: [...mapearHistorico(historico), { role: "user", content: mensagemUsuario }],
  });

  const textos: string[] = [];
  const citacoes: Citacao[] = [];

  for (const bloco of resposta.content) {
    if (bloco.type !== "text") continue;
    textos.push(bloco.text);
    for (const citacao of bloco.citations ?? []) {
      if (citacao.type === "web_search_result_location") {
        citacoes.push({ url: citacao.url, titulo: citacao.title ?? citacao.url });
      }
    }
  }

  return formatarRespostaComCitacoes(textos.join("\n\n"), citacoes);
}
