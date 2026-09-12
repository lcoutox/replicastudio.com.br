import type { Pauta, FonteApuracao } from "@prisma/client";
import { formatarRespostaComCitacoes, type Citacao } from "@/lib/domain/apuracao";
import { clienteAnthropic } from "@/lib/radar/clienteAnthropic";

const MODELO_SONNET = "claude-sonnet-5";

const FERRAMENTA_BUSCA_WEB = {
  type: "web_search_20250305" as const,
  name: "web_search" as const,
  max_uses: 4,
};

function montarPromptSistema(pauta: Pick<Pauta, "titulo" | "resumo" | "textoOriginal">, fontes: FonteApuracao[], dossieAtual: string): string {
  const listaFontes =
    fontes.length === 0
      ? "(nenhuma fonte anexada ainda)"
      : fontes
          .map((f, i) => {
            const rotulo = f.tipo === "link" ? `link: ${f.conteudo}` : f.tipo === "arquivo" ? `arquivo anexado: ${f.arquivoUrl}` : `nota sem fonte formal: "${f.conteudo}"`;
            return `${i + 1}. [${f.tipo}] ${rotulo}${f.descricao ? ` — ${f.descricao}` : ""}`;
          })
          .join("\n");

  return `Você ajuda um jornalista da Réplica (veículo local de Nova Serrana-MG) a escrever o dossiê de apuração de uma pauta. O dossiê é um documento único — você não conversa, você produz texto pra entrar direto nele.

PAUTA: ${pauta.titulo}
${pauta.resumo ? `Resumo: ${pauta.resumo}` : ""}
${pauta.textoOriginal ? `\nTEXTO ORIGINAL DA FONTE (já temos isso — é a fonte primária, não precisa buscar na web pra confirmar o que já está aqui):\n${pauta.textoOriginal}\n` : ""}

FONTES ANEXADAS PELO JORNALISTA:
${listaFontes}

DOSSIÊ ATUAL (o que já está escrito — não repita, complemente):
${dossieAtual.trim() || "(vazio ainda)"}

Regras:
- Sua resposta inteira é a sugestão de texto a ser adicionada ao dossiê. Sem saudação, sem "aqui está", sem meta-comentário — só o conteúdo, pronto pra colar.
- O dossiê é texto simples, não markdown renderizado — não use **negrito**, # cabeçalho, ou listas numeradas de markdown. Escreva em prosa corrida, parágrafos curtos; se precisar listar itens, use hífen simples no início da linha.
- Só busque na web quando o pedido do jornalista pedir isso explicitamente, ou quando não houver como responder sem isso. O texto original acima já é fonte primária — busca na web serve pra achar repercussão externa (imprensa, reação pública), não pra reconfirmar o que a fonte primária já diz.
- "Nota sem fonte formal" é pista a confirmar, nunca fato estabelecido.
- Sempre que citar algo de uma busca, deixe claro de onde veio.
- Se não achar nada confiável, diga isso — não invente fonte nem complete lacuna com suposição.
- Português direto, sem jargão de IA (nada de "delve", "landscape", listas de três itens por reflexo).`;
}

/**
 * Gera uma sugestão de texto pro dossiê a partir de um pedido do jornalista
 * — nunca grava sozinho (ver docs/PRD.md seção 10). Sonnet, não Haiku: isso
 * é julgamento editorial, uso deliberado do jornalista, não classificação
 * em lote.
 */
export async function gerarSugestao(
  pauta: Pick<Pauta, "titulo" | "resumo" | "textoOriginal">,
  fontes: FonteApuracao[],
  dossieAtual: string,
  pedido: string,
): Promise<string> {
  const resposta = await clienteAnthropic().messages.create({
    model: MODELO_SONNET,
    max_tokens: 2048,
    system: montarPromptSistema(pauta, fontes, dossieAtual),
    tools: [FERRAMENTA_BUSCA_WEB],
    messages: [{ role: "user", content: pedido }],
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
